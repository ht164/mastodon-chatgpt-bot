const Bot = require("./src/bot");

console.log("Mastodon bot start...");

const bot = new Bot();
bot.listen();
