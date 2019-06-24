
import * as datefns from 'date-fns';
import { Botkit, BotkitMessage } from 'botkit';
// import { SlackAdapter } from 'botbuilder-adapter-slack'
import { SlackAdapter, SlackMessageTypeMiddleware, SlackBotWorker, SlackAdapterOptions } from 'botbuilder-adapter-slack';
import { GoogleCalendar, CalendarEvent } from './gcal';

import * as slackBot from './slackBot'

const controller = slackBot.controller;
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

async function GetTodaysCalender() {
    const gcal = new GoogleCalendar(process.env.GOOGLE_CLIENT_SECRET_PATH || "", process.env.GOOGLE_TOKEN_PATH || "")
    // Authorize a client with credentials, then call the Google Calendar API.
    const compEvent = (a: CalendarEvent, b: CalendarEvent) => a.startAt.getTime() - b.startAt.getTime();
    const eventToString = (event: CalendarEvent) => {
        let start = event.isAllDay ? datefns.format(event.startAt, "MM-DD") + " ALL" : datefns.format(event.startAt, "MM-DD HH:mm");
        start = (start + ' '.repeat(12)).substr(0, 12);
        return (`${start} - \`${event.summary}\``);
    }


    const todays_events = (await gcal.listEvents(0, 1)).sort(compEvent).map(eventToString).join("\n");
    // const tomorrow_events = (await gcal.listEvents(1, 1)).sort(compEvent).map(eventToString).join("\n");

    let message = "";
    if (todays_events) {
        message += "今日の予定は\n" + todays_events + "\nです。"
    } else {
        message += "今日の予定は *ありません* 。"
    }

    return message;

}

(async () => {
    //test(await GetTodaysCalender());
    test("startPrivateConversation");
})();

async function test(msg: string): Promise<void> {
    let bot: SlackBotWorker = await controller.spawn("PROACTIVE") as SlackBotWorker;
    await bot.startPrivateConversation("U7W20F25A"); //  function works only on platforms with multiple channels.
    //await bot.startPrivateConversation("UKEG6SQP3");    // cozyjpn
    await bot.say(msg);
}
