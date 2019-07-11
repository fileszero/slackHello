import { baseConverter } from './baseConverter';
import { ParsedMail } from 'mailparser';
import { GoogleCalendar } from '../gcal';

export class greenDogOrder implements baseConverter {
	constructor(private calendarId: string) {}
	async convert(mail_data: ParsedMail): Promise<string> {
		let unified = mail_data.text;
		const gcal = new GoogleCalendar();

		return unified;
	}
}
