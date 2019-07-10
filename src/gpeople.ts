import { GoogleOAuthApi } from './googleOAuthApi';
import { google, people_v1 } from 'googleapis';

export class GooglePeople {
	// If modifying these scopes, delete token.json.
	// static SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

	_oauth: GoogleOAuthApi;
	constructor(ClientSecretPath: string = '', TokenPath: string = '') {
		this._oauth = new GoogleOAuthApi();
	}

	private _API: people_v1.People | undefined;
	private async getAPI(): Promise<people_v1.People> {
		if (this._API) {
			return this._API;
		}
		const auth = await this._oauth.authorize();
		this._API = google.people({ version: 'v1', auth });
		return this._API;
	}

	private _Contacts: people_v1.Schema$Person[] | undefined;
	public async getContacts(): Promise<people_v1.Schema$Person[]> {
		if (this._Contacts) {
			return this._Contacts;
		}
		const api = await this.getAPI();
		this._Contacts = [];
		const param: people_v1.Params$Resource$People$Connections$List = {
			resourceName: 'people/me',
			personFields: 'names,phoneNumbers'
		};
		var page_Token: string | undefined = undefined;

		do {
			param.pageToken = page_Token;
			const connections = await api.people.connections.list(param);
			if (connections.data.connections) {
				Array.prototype.push.apply(this._Contacts, connections.data.connections);
			}
			page_Token = connections.data.nextPageToken;
		} while (page_Token);
		return this._Contacts;
	}
	public async getContactByPhoneNumber(phoneNum: string): Promise<people_v1.Schema$Person[]> {
		const contacts = await this.getContacts();
		const searchNum = phoneNum.replace(/[^\d]/g, '');
		const match_contacts = contacts.filter((c) => {
			if (c.phoneNumbers) {
				const is_match = c.phoneNumbers.find((num) => {
					let jp_num = num.canonicalForm || num.value || '';
					if (!jp_num) return false;
					jp_num = jp_num.replace(/^\+81/, '0');
					jp_num = jp_num.replace(/^184/, '');
					jp_num = jp_num.replace(/[^\d]/g, '');
					//console.log(jp_num);
					return jp_num == searchNum;
				});
				if (is_match) return true;
				return false;
			}
		});
		return match_contacts;
	}
}

// test entry point
// (async () => {
// 	const people = new GooglePeople();
// 	const contacts = await people.getContacts();
// })();
