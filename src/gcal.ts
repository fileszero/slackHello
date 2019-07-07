import dotenv from 'dotenv';

import * as datefns from 'date-fns';

import { google, calendar_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { GoogleOAuthApi } from './googleOAuthApi';
import config from "./config";

export interface CalendarEvent extends calendar_v3.Schema$Event {
    startAt: Date;
    endAt: Date;
    isAllDay?: boolean;
    CalendarId?: string;
    CalendarSummary?: string;
}
export class GoogleCalendar {
    // If modifying these scopes, delete token.json.
    // static SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

    _oauth: GoogleOAuthApi;
    constructor(ClientSecretPath: string = '', TokenPath: string = '') {
        this._oauth = new GoogleOAuthApi();
    }


    private _CalendarAPI: calendar_v3.Calendar | undefined;
    private async getCalendarAPI(): Promise<calendar_v3.Calendar> {
        if (this._CalendarAPI) {
            return this._CalendarAPI;
        }
        const auth = await this._oauth.authorize();
        const calendar = google.calendar({ version: 'v3', auth });
        return calendar;
    }

    private async getSchimas<T_ITM, T_ARR extends { items?: T_ITM[]; } = any, T_PRM extends { pageToken?: string } = any>(param: T_PRM, list: (param: T_PRM) => Promise<GaxiosResponse<T_ARR>>): Promise<T_ITM[]> {
        const result: T_ITM[] = [];
        var page_Token: string | undefined = undefined;

        do {
            param.pageToken = page_Token;
            const schemas = await list(param);  // as GaxiosResponse<calendar_v3.Schema$CalendarList>;
            if (schemas.data.items) {
                if (schemas.data.items.length > 0) {
                    Array.prototype.push.apply(result, schemas.data.items);
                }
            }
            page_Token = ((): string | undefined => { return (schemas.data as any).nextPageToken; })();
        } while (page_Token);
        return result;
    }

    public async getCalendarList(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
        const api = await this.getCalendarAPI();
        const result = await this.getSchimas<calendar_v3.Schema$CalendarListEntry>({}, (p) => { return api.calendarList.list(p) });
        return result;
    }

    public async getCalendarEvents(param: calendar_v3.Params$Resource$Events$List): Promise<calendar_v3.Schema$Event[]> {
        const api = await this.getCalendarAPI();
        const result = await this.getSchimas<calendar_v3.Schema$Event>(param, (p) => { return api.events.list(p) });
        return result;
    }

    /**
     * Lists the next 10 events on the user's primary calendar.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    public async  listEvents(offsetToday: number, days: number = 1): Promise<CalendarEvent[]> {
        const api = await this.getCalendarAPI();

        const calendars = await this.getCalendarList();
        //console.log(JSON.stringify(calendars, undefined, 2));

        const timeMin = datefns.addDays(datefns.startOfToday(), offsetToday);
        const timeMax = datefns.addDays(timeMin, days);
        // trim bound
        const listParam: calendar_v3.Params$Resource$Events$List = {
            calendarId: 'primary',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: 'startTime',
        };

        const events: CalendarEvent[] = [];
        // process all calendars
        for (const cal of calendars) {
            listParam.calendarId = cal.id;
            const cal_events = await this.getCalendarEvents(listParam);
            if (cal_events) {
                Array.prototype.push.apply(events, cal_events.map((src) => {
                    const ev: CalendarEvent = src as CalendarEvent;
                    if (src.start) {
                        if (src.start.dateTime) {
                            ev.startAt = new Date(src.start.dateTime);
                            ev.isAllDay = false;
                        }
                        if (src.start.date) {
                            ev.startAt = new Date(src.start.date + "T00:00:00+09:00");
                            ev.isAllDay = true;
                            if (src.end) {
                                ev.endAt = new Date(src.end.date + "T00:00:00+09:00");
                            } else {
                                ev.endAt = datefns.addDays(ev.startAt, 1);
                            }
                            if (ev.endAt > timeMin) {
                                ev.isAllDay = true;
                            } else {
                                return null;
                            }
                        }
                    }
                    ev.CalendarId = cal.id;
                    ev.CalendarSummary = cal.summary;
                    return ev;
                }).filter((ev) => ev != null));
            }
        }
        return events;
    }
}
// test entry point
// dotenv.config();
// (async () => {


//     const gcal = new GoogleCalendar(config.google.clientSecretPath, config.google.tokenPath)
//     // Authorize a client with credentials, then call the Google Calendar API.
//     const compEvent = (a: CalendarEvent, b: CalendarEvent) => a.startAt.getTime() - b.startAt.getTime();
//     const eventToString = (event: CalendarEvent) => {
//         let start = event.isAllDay ? datefns.format(event.startAt, "MM-DD") + " ALL" : datefns.format(event.startAt, "MM-DD HH:mm");
//         start = (start + ' '.repeat(12)).substr(0, 12);
//         return (`${start} - \`${event.summary}\``);
//     }


//     const events = (await gcal.listEvents(-2, 1)).sort(compEvent).map(eventToString).join("\n");
//     // const events = (await gcal.listEvents(1, 1)).sort(compEvent).map(eventToString).join("\n");
//     // const events = (await gcal.listEvents(0, 7)).sort(compEvent).map(eventToString).join("\n");

//     let message = "";
//     if (events) {
//         message += "予定は\n" + events + "\nです。"
//     } else {
//         message += "予定は*ありません*。"
//     }

//     console.log(message);

// })();
