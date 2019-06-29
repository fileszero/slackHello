import dotenv from 'dotenv';
import { SlackAdapter, SlackMessageTypeMiddleware, SlackBotWorker, SlackAdapterOptions } from 'botbuilder-adapter-slack';
import { Botkit, BotkitMessage, BotkitConfiguration } from 'botkit';

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

export class slackBot {
    private adapter: SlackAdapter;
    public controller: Botkit;
    constructor(config: BotkitConfiguration) {
        this.adapter = new SlackAdapter(slackOption).use(new SlackMessageTypeMiddleware());
        config.adapter = this.adapter;
        this.controller = new Botkit(config);
    }


    async  sendDirectMessage(userId: string, msg: string): Promise<{ activity: any, bot: SlackBotWorker }> {
        let bot: SlackBotWorker = await this.controller.spawn("PROACTIVE") as SlackBotWorker;
        await bot.startPrivateConversation(userId); //  function works only on platforms with multiple channels.    // fileszero
        return { activity: await bot.say(msg), bot: bot };
    }

    async  sendMessage(channel: string, msg: string): Promise<{ activity: any, bot: SlackBotWorker }> {
        let bot: SlackBotWorker = await this.controller.spawn("PROACTIVE") as SlackBotWorker;
        await bot.startConversationInChannel(channel, ""); //  function works only on platforms with multiple channels.    // fileszero
        const bot_msg: Partial<BotkitMessage> = {
            channel: channel,
            text: msg
        };
        return { activity: await bot.say(bot_msg), bot: bot };
    }
}
