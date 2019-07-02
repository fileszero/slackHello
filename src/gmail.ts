import dotenv from 'dotenv';
import * as imaps from 'imap-simple';
import config from "./config";
import { GoogleOAuthApi } from './googleOAuthApi';
import { google, gmail_v1 } from 'googleapis';
import * as emoji from 'emoji';

dotenv.config();
// https://github.com/chadxz/imap-simple

var imap_config: imaps.ImapSimpleOptions = {
    imap: {
        user: config.gmail.address,
        password: config.gmail.imapPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 3000
    },
    // onmail: function (numNewMail: number) {
    //     console.log("new mail!" + numNewMail.toString());
    // }
};

class Gmail {
    _oauth: GoogleOAuthApi;
    constructor() {
        this._oauth = new GoogleOAuthApi();
    }

    private _API: gmail_v1.Gmail | undefined;
    private async getAPI(): Promise<gmail_v1.Gmail> {
        if (this._API) {
            return this._API;
        }
        const auth = await this._oauth.authorize();
        this._API = google.gmail({ version: "v1", auth: auth });

        return this._API;
    }
    charCodeStr(char: string) {
        const code = Buffer.from(char);
        let code_str = "";
        for (const c of code) {
            code_str += "-" + c.toString(16);
        }
        return "0x" + code_str;
    }

    public async getMailByMessageId(msgId: string) {
        // rfc822msgid: <IMTM1XS122bdd90704IR@docomo.ne.jp>
        const api = await this.getAPI();
        const list = await api.users.messages.list({ userId: "me", q: "rfc822msgid:" + msgId });
        let id = '';
        if (list.data && list.data.messages) {
            if (list.data.messages.length > 0) {
                id = list.data.messages[0].id || '';
            }
        }
        if (id != '') {
            const message = await api.users.messages.get({ userId: "me", id: id });
            console.log(message.data.snippet);
            console.log(emoji.googleToUnified(message.data.snippet || ""));
            if (message.data.payload && message.data.payload.body) {
                const body = Buffer.from(message.data.payload.body.data || '', 'base64').toString();
                console.log(emoji.googleToUnified(body));
            }

        }

    }
}

// // test
// (async () => {
//     var client = new Gmail();
//     client.getMailByMessageId("<IMTM1XS122bdd90704IR@docomo.ne.jp>");
//     //client.getMailByMessageId("<1365751891.4095.1562026538707.JavaMail.appbatch@10.0.10.3>")
// })();
