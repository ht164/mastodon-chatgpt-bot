# mastodon-chatgpt-bot

ChatGPTを利用して返信内容しMastodonに投稿するbotです。
botが動作するアカウントにメンションされた投稿に反応します。

## 利用方法

### 前提
OpenAIにユーザー登録し、APIキーを生成してください。
MastodonにBotで利用するアプリを登録してください。[ユーザー設定] - [開発] - [新規アプリ] から登録できます。

### Docker利用

1. .env.sample を .env としてコピー、必要な情報を記載する
2. docker compose を利用して Docker コンテナを起動する
```
$ docker compose build
$ docker compose up -d
```

### 非Docker利用

1. Node.jsをインストールしていない場合はインストールする
2. .env.sample を .env としてコピー、必要な情報を記載する
3. 必要ライブラリのインストール
```
$ npm install
```
4. 実行
```
$ npm start
```

## .envの説明

| パラメーター名 | 説明 |
|----|----|
| CLIENT_KEY | Mastodonに登録したアプリのクライアントキー |
| CLIENT_SECRET | Mastodonに登録したアプリのクライアントシークレット |
| ACCESS_TOKEN | Mastodonに登録したアプリのアクセストークン |
| MASTODON_HOST | Mastodonサーバーのホスト名 (例: mstdn2.ht164.jp) |
| BOT_ACCOUNT_NAME | Botに利用するMastodonアカウントの名前 (例: testbot) |
| OPENAI_API_KEY | OpenAI のAPIキー |
| CHATGPT_SYSTEM_CONTENT | ChatGPTを呼び出す際の前提として渡す情報。例えばどういう設定の人物か、どういう口調か、などを記載することができる |
| TOKEN_LIMIT_PER_DAY | 1日で使用するトークン量の最大値。これを超えるとbotは反応しない |
| MAX_USE_REPLY_HISTORY | ChatGPTを呼び出すときに渡す会話の履歴数 |
