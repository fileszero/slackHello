import { baseConverter } from './baseConverter';
import { ParsedMail } from 'mailparser';

export class missedLalacall implements baseConverter {
	convert(mail_data: ParsedMail): string {
		let unified = mail_data.text;
		const tels = unified.match(/[-\d]{10,}/g) as Array<string>;
		tels.map((s) => {
			let tel = s.replace('-', '');
			tel = s.substr(0, 3) + '-' + s.substr(3, 4) + '-' + s.substr(7);
			unified = unified.replace(s, tel);
		});
		return unified;
	}
}
