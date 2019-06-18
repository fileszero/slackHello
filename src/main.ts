import dotenv from 'dotenv';
import { Botkit } from 'botkit';
// import { SlackAdapter } from 'botbuilder-adapter-slack'
import { SlackAdapter, SlackMessageTypeMiddleware, SlackBotWorker } from 'botbuilder-adapter-slack';
import { TestAdapter } from 'botbuilder';

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

async function test(): Promise<void> {
    // spawn a bot
    let bot: SlackBotWorker = await controller.spawn() as SlackBotWorker;

    await bot.startConversationInChannel("C7W0K6PNW", "");
    await bot.say("test");
}
async (trigger: any) => {

    // there's a user id somewhere in this trigger
    let user = trigger.userid;

    // spawn a bot
    let bot = await controller.spawn();
    // await bot.startConversationWithUser(user);

    await bot.say('ALERT! A trigger was detected');
    // await bot.beginDialog(ALERT_DIALOG);

};

test();