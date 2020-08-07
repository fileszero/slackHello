import { GoogleCalendar, CalendarEvent } from './gcal';
import * as datefns from 'date-fns';
import config from "./config";


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
    const gcal = new GoogleCalendar(config.google.clientSecretPath, config.google.tokenPath)

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

export async function getScheduleNotice(): Promise<string> {
    // await chatpostMessage();
    let offsetToday: 0 | 1 = 0;
    const now = new Date();
    if (now.getHours() > 12) {  // 午後は明日の予定を出力
        offsetToday = 1;
    }
    let message = await GetCalenderMessage(offsetToday);
    return message;
}
