import * as slackBot from './slackBot'
import { Botkit, BotkitMessage } from 'botkit';
import { SlackBotWorker } from 'botbuilder-adapter-slack';
import { GoogleCalendar, CalendarEvent } from './gcal';
import * as datefns from 'date-fns';
import { WebAPICallOptions } from '@slack/client';


function compareCalendarEvent(a: CalendarEvent, b: CalendarEvent) {
    return a.startAt.getTime() - b.startAt.getTime();
}

function eventToString(event: CalendarEvent) {
    let start = event.isAllDay ? datefns.format(event.startAt, "MM-DD") + " ALL" : datefns.format(event.startAt, "MM-DD HH:mm");
    start = (start + ' '.repeat(12)).substr(0, 12);
    return (`${start} - \`${event.summary}\``);
}

function eventArrayToString(events: CalendarEvent[]) {
    return events.sort(compareCalendarEvent).map(eventToString).join("\n");
}

async function GetCalenderMessage(offsetToday: 0 | 1) {
    const name_of_days = ["今日", "明日"];
    // Authorize a client with credentials, then call the Google Calendar API.
    const gcal = new GoogleCalendar(process.env.GOOGLE_CLIENT_SECRET_PATH || "", process.env.GOOGLE_TOKEN_PATH || "")

    const events = eventArrayToString(await gcal.listEvents(offsetToday, 1));
    // const tomorrow_events = (await gcal.listEvents(1, 1)).sort(compEvent).map(eventToString).join("\n");

    let message = "";
    if (events) {
        message += name_of_days[offsetToday] + "の予定は\n" + events + "\nです。"
    } else {
        message += name_of_days[offsetToday] + "の予定は *ありません* 。"
    }

    return message;

}

async function sendNotice(controller: Botkit, msg: string): Promise<void> {
    let bot: SlackBotWorker = await controller.spawn("PROACTIVE") as SlackBotWorker;
    await bot.startPrivateConversation("U7W20F25A"); //  function works only on platforms with multiple channels.    // fileszero
    // await bot.startPrivateConversation("@fileszero");
    // await bot.startPrivateConversation("D7WSFRVRC"); //  function works only on platforms with multiple channels.
    // await bot.startPrivateConversation("UKEG6SQP3");    // cozyjpn

    // await bot.startConversationInChannel("D7WSFRVRC", "DKN1KEEKA");
    // await bot.startConversationInChannel("C7W0K6P5G", ""); // general
    // await bot.startConversationInChannel("U7W20F25A", ""); // fileszero user id
    // await bot.startConversationInChannel("D7WSFRVRC", ""); // fileszero private channel
    // await bot.startConversationWithUser("D7WSFRVRC");

    // await bot.startConversationWithUser("U7W20F25A");    // fileszero user id
    // https://api.slack.com/team/files.eq.zero
    // await bot.startConversationWithUser("files.eq.zero");
    const bmsg: Partial<BotkitMessage> = {
        // channel: "D7WSFRVRC",
        // channel: "@fileszero",
        // user: "U7W20F25A",
        user: "@fileszero",
        text: msg
    }
    // await bot.say(bmsg);
    await bot.say(msg);
}

async function chatpostMessage() {
    const api = await slackBot.adapter.getAPI({});
    console.log(api.token);
    const im_open_opt: WebAPICallOptions = {
        token: api.token,
        user: 'U7W20F25A',
    };
    const im_open_response = await api.apiCall("im.open", im_open_opt) as any;

    // https://api.slack.com/methods
    // const response = await api.apiCall("api.test");
    // "D7WSFRVRC", // // fileszero private channel
    // "U7W20F25A", ""); // fileszero user id
    const api_opt: WebAPICallOptions = {
        token: api.token,
        channel: im_open_response.channel.id,   // 'D7WSFRVRC',
        as_user: true,
        text: "Hello",
        // user: 'U7W20F25A'
    };
    // https://api.slack.com/methods/chat.postMessage#channels  Post to an IM channel
    // How to send direct messages to a user as app in app channel
    // https://stackoverflow.com/questions/47753834/how-to-send-direct-messages-to-a-user-as-app-in-app-channel
    //const response = await api.apiCall("chat.meMessage", api_opt);  //https://qiita.com/masatomix/items/56fc2024e383875cca1a
    const response = await api.apiCall("chat.postMessage", api_opt);  //https://qiita.com/masatomix/items/56fc2024e383875cca1a

    // https://api.slack.com/docs/working-with-workspace-tokens#single_channel_authorizations

    console.log(JSON.stringify(response));
    // const msg_response = await api.apiCall("chat.postMessage");

}

export async function sendScheduleNotice(controller: Botkit) {
    // await chatpostMessage();
    let offsetToday: 0 | 1 = 0;
    const now = new Date();
    if (now.getHours() > 12) {  // 午後は明日の予定を出力
        offsetToday = 1;
    }
    let message = await GetCalenderMessage(offsetToday);
    sendNotice(controller, message);
}
