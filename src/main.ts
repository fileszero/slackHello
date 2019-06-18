import dotenv from 'dotenv';
import { Botkit } from 'botkit';
// import { SlackAdapter } from 'botbuilder-adapter-slack'
import { SlackAdapter, SlackMessageTypeMiddleware } from 'botbuilder-adapter-slack';

// Botkit for Slack Class Reference
// https://botkit.ai/docs/v4/reference/slack.html
// BotKit 4.xでのライブラリ仕様変更について
// https://qiita.com/0622okakyo/items/07d1961697a4c620380a

dotenv.config();

if (!process.env.SLACK_CLIENT_ID) {
    console.log('Error: Specify SLACK_BOTTOKEN in environment');
    process.exit(1);
}
console.log(process.env.SLACK_CLIENT_ID);

const adapter = new SlackAdapter({
    // clientId: process.env.SLACK_CLIENT_ID,
    clientSigningSecret: process.env.SLACK_SIGNING_SECRET,
    botToken: process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN,
    redirectUri: process.env.SLACK_REDIRECTURI || "",
}).use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
    adapter: adapter
});

controller.on('message', async (bot, message) => {
    await bot.reply(message, 'I heard a message!');
});

// say hi
controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
    await bot.reply(message, 'hello');
});

// default
// 最後に記述してください。
controller.hears('(.*)', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
    await bot.reply(message, 'なに??');
});
