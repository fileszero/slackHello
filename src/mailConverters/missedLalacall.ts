import { baseConverter } from './baseConverter';
import { ParsedMail } from 'mailparser';
import { GooglePeople } from '../gpeople';

export class missedLalacall implements baseConverter {
	async convert(mail_data: ParsedMail): Promise<string> {
		let unified = mail_data.text;
		const tels = unified.match(/[-\d]{10,}/g) as Array<string>;
		const people = new GooglePeople();

		for (const s of tels) {
			let tel = s.replace('-', '');
			tel = '`' + s.substr(0, 3) + '-' + s.substr(3, 4) + '-' + s.substr(7) + '`';
			// find contact name
			const person = await people.getContactByPhoneNumber(tel);
			if (person.length > 0 && person[0].names) {
				tel += '  [' + person[0].names.map((n) => n.displayName).join('/') + ']';
			}
			unified = unified.replace(s, tel);
		}
		const lines = unified.split('\n').map((l) => l.trim()).filter((l) => l);
		unified = lines.join('\n\n');
		return unified;
	}
}
