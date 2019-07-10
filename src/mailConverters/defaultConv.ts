import { baseConverter } from './baseConverter';
import { ParsedMail } from 'mailparser';
import * as emoji from 'emoji';

export class defaultConverter implements baseConverter {
	convert(mail_data: ParsedMail): string {
		const from_address: string = mail_data.from.value[0]['address'];
		// console.log(mail_data.text);
		// if (mail_data.from.value[0]["address"]) {    }
		let unified = emoji.docomoToUnified(mail_data.text);
		unified = emoji.kddiToUnified(unified);
		unified = emoji.softbankToUnified(unified);
		// unified = emoji.googleToUnified(unified);
		//unified = unifiedToSlack(unified);
		unified = from_address + '\n\n' + unified;
		if (mail_data.subject) {
			unified = '*' + mail_data.subject.trim() + '* / ' + unified;
		}
		return unified;
	}
}
