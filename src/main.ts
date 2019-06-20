import dotenv from 'dotenv';
import * as datefns from 'date-fns';
import { Botkit, BotkitMessage } from 'botkit';
// import { SlackAdapter } from 'botbuilder-adapter-slack'
import { SlackAdapter, SlackMessageTypeMiddleware, SlackBotWorker, SlackAdapterOptions } from 'botbuilder-adapter-slack';

// run > ngrok http 3000 --log stdout
// access https://api.slack.com/apps
// open app -> Event Subscriptions -> set Request URL http://???????.ngrok.io/api/messages
//
// add to C:\Users\<user>\.ngrok2\ngrok.yml
// trust_host_root_certs: true
// root_cas: host

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

const slackOption: SlackAdapterOptions = {
    // clientId: process.env.SLACK_CLIENT_ID,
    clientSigningSecret: process.env.SLACK_SIGNING_SECRET,
    botToken: process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN,    // https://botkit.ai/docs/v4/platforms/slack.html#multi-team-support
    redirectUri: process.env.SLACK_REDIRECTURI || "",
};
const adapter = new SlackAdapter(slackOption).use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
    adapter: adapter
});

/**
 * RTM APIのイベント
 * ないと「Error: Stale RTM connection, closing RTM」というエラーになる
 */
controller.on('rtm_open', async (bot, message) => {
    console.log('** The RTM api just connected!');
});
controller.on('rtm_close', async (bot, message) => {
    console.log('** The RTM api just closed');
});

controller.on('message', async (bot, message) => {
    await bot.reply(message, 'I heard a message!');
});

// say hi
controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
    await bot.reply(message, 'hello');
});

controller.hears('test', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
    let msg = message.text || "";
    msg = msg.replace(/test/i, "").trim();
    test(msg);
});

// default
// 最後に記述してください。
controller.hears('(.*)', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
    await bot.reply(message, 'なに??');
});
test("STARTUP");

async function test(msg: string): Promise<void> {
    const send_message = "bot kit message : " + msg + " : " + datefns.format(Date.now(), 'YYYY/MM/DD HH:mm:ss');
    // boot_data.team_id
    // "T7W20F22G"
    // spawn a bot
    let bot: SlackBotWorker = await controller.spawn(msg) as SlackBotWorker;

    // let bot = await controller.spawn() as SlackBotWorker;
    //await bot.startConversationInChannel("C7W0K6PNW", "");
    await bot.startPrivateConversation("U7W20F25A"); //  function works only on platforms with multiple channels.
    // await bot.startConversationWithUser("U7W20F25A");
    //await bot.say("test");
    // const im_res = await bot.api.im.open({ user: "U7W20F25A" }) as any;
    const message: Partial<BotkitMessage> = {
        text: send_message,
        channel: "C7W0K6P5G",    // #general
        // user: "U7W20F25A",
        // channel: im_res.channel.id,
    };
    console.log(send_message);
    await bot.say(send_message);
}
