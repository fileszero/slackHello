import { baseConverter } from './baseConverter';
import { ParsedMail } from 'mailparser';
import * as datefns from 'date-fns';

import { GoogleCalendar, CalendarEvent } from '../gcal';

export class greenDogOrder implements baseConverter {
    constructor(private calendarId: string) {}
    async convert(mail_data: ParsedMail): Promise<string> {
        let unified = mail_data.text;
        // slack message
        let msg = 'GREEN DOGが来ますよ\n';
        // find order number
        let order_num = '';
        let match = unified.match(/\[受注番号\] (\d+)/);
        if (match) {
            order_num = match[1];
        }
        // find delivery date
        match = unified.match(/\[配達日時指定\] (.+)/);
        let delivery_date: Date | undefined = undefined;
        if (match) {
            let str_date = match[1]; //yyyy年mm月dd日 hh時-hh時
            str_date = str_date.replace(/[年月]/g, '-');
            str_date = str_date.replace(/日\s?/, 'T');
            str_date = str_date.replace(/時.*/, '');
            str_date += ':00:00';
            delivery_date = new Date(str_date);
        }

        // cannot parse
        if (!order_num || !delivery_date) {
            return '';
        }
        msg += '\n配達日時 ' + datefns.format(delivery_date, 'YYYY/MM/DD HH:mm (ddd)') + '\n';
        msg += 'あと' + datefns.differenceInDays(delivery_date, new Date()).toString() + '日\n';
        console.log(order_num);
        console.log(delivery_date);
        await this.sendToCalendar(order_num, delivery_date, unified);

        return msg;
    }

    private async sendToCalendar(order_num: string, delivery_date: Date, body: string) {
        const start = delivery_date;
        const end = datefns.addMinutes(start, 15);
        const key = 'Order=' + order_num;
        let event: Partial<CalendarEvent> = {
            CalendarId: this.calendarId,
            summary: 'GREEN DOGが来ますよ',
            description: key + '\n\n' + body,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            reminders: {
                useDefault: false,
                overrides: [ { method: 'email', minutes: 24 * 60 }, { method: 'popup', minutes: 10 } ]
            }
        };
        const gcal = new GoogleCalendar();
        const events = await gcal.listEvents(-30, 60, { q: key });
        if (events.length > 0) {
            if (
                JSON.stringify(events[0].start) != JSON.stringify(event.start) ||
                JSON.stringify(events[0].end) != JSON.stringify(event.end)
            ) {
                event = events[0];
                event.start = { dateTime: start.toISOString() };
                event.end = { dateTime: end.toISOString() };
            }
        }

        await gcal.upsertEvent(event);
    }
}
