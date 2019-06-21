import dotenv from 'dotenv';

import * as datefns from 'date-fns';

import { google, calendar_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { GoogleOAuthApi } from './googleOAuthApi';

interface CalendarEvent extends calendar_v3.Schema$Event {
    startAt: Date;
    isAllDay?: boolean;
    CalendarId?: string;
    CalendarSummary?: string;
}
class GoogleCalendar extends GoogleOAuthApi {
    // If modifying these scopes, delete token.json.
    static SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

    constructor(ClientSecretPath: string, TokenPath: string) {
        super(ClientSecretPath, TokenPath, GoogleCalendar.SCOPES)
    }


    private _CalendarAPI: calendar_v3.Calendar | undefined;
    private async getCalendarAPI(): Promise<calendar_v3.Calendar> {
        if (this._CalendarAPI) {
            return this._CalendarAPI;
        }
        const auth = await this.authorize();
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
                        }
                    }
                    ev.CalendarId = cal.id;
                    ev.CalendarSummary = cal.summary;
                    return ev;
                }));
            }
        }
        return events;
    }
}
// entry point
dotenv.config();
(async () => {
    const gcal = new GoogleCalendar(process.env.GOOGLE_CLIENT_SECRET_PATH || "", process.env.GOOGLE_TOKEN_PATH || "")
    // Authorize a client with credentials, then call the Google Calendar API.
    const events = await gcal.listEvents(0, 7);
    console.log('todays');
    console.log(JSON.stringify(events, undefined, 2));
    const sorted_events = events.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    const message = sorted_events.map((event, i) => {
        let start = event.isAllDay ? datefns.format(event.startAt, "MM-DD") + " ALL" : datefns.format(event.startAt, "MM-DD HH:mm");
        start = (start + ' '.repeat(12)).substr(0, 12);
        return (`${start} - \`${event.summary}\``);
    }).join("\n");
    console.log(JSON.stringify(message));

})();
