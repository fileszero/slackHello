import dotenv from 'dotenv';
import { SlackAdapter, SlackMessageTypeMiddleware, SlackBotWorker, SlackAdapterOptions } from 'botbuilder-adapter-slack';
import { Botkit, BotkitMessage, BotkitConfiguration } from 'botkit';
import config from "./config";

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

const slackOption: SlackAdapterOptions = {
    clientSigningSecret: config.slack.signingSecret,
    botToken: config.slack.botUserOauthAccessToken,    // https://botkit.ai/docs/v4/platforms/slack.html#multi-team-support
    redirectUri: "",
};

interface slackIdInfo {
    Id: string,
    type: "user" | "channel" | "group" | "unknown",
    info: any
}


export class slackBot {
    private adapter: SlackAdapter;
    private IdInfo: slackIdInfo[] = [];
    public controller: Botkit;
    constructor(config: BotkitConfiguration) {
        this.adapter = new SlackAdapter(slackOption).use(new SlackMessageTypeMiddleware());
        config.adapter = this.adapter;
        this.controller = new Botkit(config);
    }

    async getIdInfo(bot: SlackBotWorker, slackId: string): Promise<slackIdInfo> {
        let info = this.IdInfo.find((id) => id.Id == slackId);
        if (!info) {
            const user = await bot.api.users.info({ user: slackId }).catch(() => undefined);
            if (user) {
                info = { Id: slackId, type: 'user', info: user };
            }
            if (!info) {
                const channel = await bot.api.channels.info({ channel: slackId }).catch(() => undefined);
                if (channel) {
                    info = { Id: slackId, type: 'channel', info: channel };
                }
            }
            if (!info) {
                const channel = await bot.api.groups.info({ channel: slackId }).catch(() => undefined);
                if (channel) {
                    info = { Id: slackId, type: 'group', info: channel };
                }
            }

            if (info) {
                this.IdInfo.push(info)
            }
        }
        if (info) {
            return info;
        }
        return { Id: slackId, type: "unknown", info: {} };
    }

    private async  sendDirectMessage(bot: SlackBotWorker, userId: string, msg: string): Promise<{ activity: any, bot: SlackBotWorker }> {
        await bot.startPrivateConversation(userId); //  function works only on platforms with multiple channels.    // fileszero
        return { activity: await bot.say(msg), bot: bot };
    }
    private async  sendChannelMessage(bot: SlackBotWorker, channel: string, msg: string): Promise<{ activity: any, bot: SlackBotWorker }> {
        await bot.startConversationInChannel(channel, ""); //  function works only on platforms with multiple channels.    // fileszero
        const bot_msg: Partial<BotkitMessage> = {
            channel: channel,
            text: msg
        };
        return { activity: await bot.say(bot_msg), bot: bot };
    }

    async sendMessage(channel: string, msg: string): Promise<{ activity: any, bot: SlackBotWorker }> {
        let bot: SlackBotWorker = await this.controller.spawn("PROACTIVE") as SlackBotWorker;
        const idInfo = await this.getIdInfo(bot, channel);
        if (idInfo.type == "user") {
            return this.sendDirectMessage(bot, channel, msg)
        } else if (idInfo.type == "channel" || idInfo.type == "group") {
            return this.sendChannelMessage(bot, channel, msg)
        }
        return { activity: {}, bot: bot };
    }
}
