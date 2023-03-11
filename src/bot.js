require("dotenv").config();
const Mastodon = require("mastodon-api-v1");
const { Configuration, OpenAIApi } = require("openai");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

class Bot {
    constructor() {
        this.m = new Mastodon({
            client_key: process.env.CLIENT_KEY,
            client_secret: process.env.CLIENT_SECRET,
            access_token: process.env.ACCESS_TOKEN,
            timeout_ms: 60*1000,
            api_url: "https://" + process.env.MASTODON_HOST + "/api",
        });
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openai = new OpenAIApi(configuration);

        (async ()=> {
            this.db = await open({
                filename: "./db/bot.db",
                driver: sqlite3.Database
            });
            await this.db.exec("create table if not exists reply(time integer, token integer)");
        })();
    }

    listen() {
        const listener = this.m.stream("/streaming/user");
        listener.on("error", err => console.log(err));
        listener.on("message", async (msg) => {
            if (msg.event !== "notification" || msg.data.type !== "mention") return;

            console.log("Recognized mentioned message (id: " + msg.data.status.id + ").");

            // not reply if message sender is a bot.
            if (msg.data.account.bot) {
                console.log("Not reply because message sender is a bot.");
                return;
            }

            // check whether tokens reach a limit.
            const _now = new Date();
            const startDate = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
            const endDate = new Date(startDate.getTime() + 60*60*24*1000);
            const result = await this.db.get("select sum(token) from reply where time >= "
                + Math.floor(startDate.getTime() / 1000) + " and time < "
                + Math.floor(endDate.getTime() / 1000));
            const tokens = result["sum(token)"];
            if (tokens !== null || tokens > process.env.TOKEN_LIMIT_PER_DAY) {
                console.log("Number of tokens has reached to limit, so bot cannot reply.");
                return;
            }

            const messages = await this.getReplyHistory(msg.data.status);

            // generate reply.
            const replyContent = await this.generateReply(messages);
            const id = msg.data.status.id;
            const acct = msg.data.account.acct;
            const content = "@" + acct + " " + replyContent;
            this.toot(content, id);

            console.log("Posted reply message.");
        });
    }

    toot(content, replyId) {
        this.m.apis.status.create(content, null, replyId);
    }

    async getReplyHistory(status) {
        const messages = [];

        const innerGetReplyHistory = async (status, count) => {
            // convert content to plain text and remove "@xxx"
            const content = status.content.replace(/<.+?>/g, "").replace(/@[^\s]+/g, "");
            const role = (status.account.acct === process.env.BOT_ACCOUNT_NAME) ? "assistant" : "user";

            messages.unshift({ role: role, content: content });

            // limit?
            if (count >= process.env.MAX_USE_REPLY_HISTORY) {
                return;
            }

            // get parent status.
            if (status.in_reply_to_id !== null) {
                const parentStatus = await this.m.apis.status.get(status.in_reply_to_id);
                await innerGetReplyHistory(parentStatus.data, count + 1);
            }
        };

        await innerGetReplyHistory(status, 1);

        return messages;
    }

    async generateReply(messages) {
        // generate reply using ChatGPT API.
        messages.unshift({ "role": "system", "content": process.env.CHATGPT_SYSTEM_CONTENT });
        console.debug("Post data to ChatGPT API:");
        console.debug(messages);
        const completion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
        });

        // save tokens
        const totalTokens = completion.data.usage.total_tokens;
        await this.db.run("insert into reply values (" + Date.now() + ", " + totalTokens + ")");
        
        return completion.data.choices[0].message.content;
    }
}

module.exports = Bot;
