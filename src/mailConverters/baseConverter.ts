import * as mailparser from 'mailparser';

export interface baseConverter {
	convert(mail_data: mailparser.ParsedMail): string;
}
