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

    public getMailBody(payload?: gmail_v1.Schema$MessagePart): gmail_v1.Schema$MessagePartBody | undefined {
        let body: gmail_v1.Schema$MessagePartBody | undefined;
        if (payload) {
            if (payload.body && payload.body.data) {
                body = payload.body;
            } else if (payload.parts && payload.parts.length > 0) {
                for (const part of payload.parts) {
                    if (part.mimeType == "multipart/alternative") {
                        return this.getMailBody(part);
                    }
                    if (part.mimeType == "text/plain") {
                        return part.body;
                    }
                }
            }
        }
        return body;
    }

    public async getMailByMessageId(msgId: string) {
        // rfc822msgid: <IMTM1XS122bdd90704IR@docomo.ne.jp>
        const api = await this.getAPI();
        const list = await api.users.messages.list({ userId: "me", q: "rfc822msgid:" + msgId, maxResults: 1 });
        let id = '';
        if (list.data && list.data.messages) {
            if (list.data.messages.length > 0) {
                id = list.data.messages[0].id || '';
            }
        }
        if (id != '') {
            const message = await api.users.messages.get({ userId: "me", id: id });
            // console.log(message.data.snippet);
            let message_body = "";
            const body = this.getMailBody(message.data.payload);
            if (body) {
                message_body = Buffer.from(body.data || '', 'base64').toString();
            }

            console.log(emoji.googleToUnified(message_body));

        }

    }
}

// // test
// (async () => {
//     var client = new Gmail();
//     await client.getMailByMessageId("<IMTM1XS122bdd90704IR@docomo.ne.jp>");
//     console.log("<><><><><><><><>");
//     await client.getMailByMessageId("<CALa0no8Oesqyz3rL0-hMYtYbXO66dx99GHscMF-Syy2EiqoZSg@mail.gmail.com>");  // inline img
//     console.log("<><><><><><><><>");
//     await client.getMailByMessageId("<d_P7X5j7jMYBs-Irsuj40Q.0@notifications.google.com>");
//     console.log("<><><><><><><><>");
//     await client.getMailByMessageId("<1365751891.4095.1562026538707.JavaMail.appbatch@10.0.10.3>")
//     console.log("<><><><><><><><>");
//     //await client.getMailByMessageId("<20190701202409.0788C1801A5@www11478ui.sakura.ne.jp>");
//     //console.log("<><><><><><><><>");
//     await client.getMailByMessageId("<CALa0no_k43xxqTSAT4=8+QDQMq7TUL17xV-Ah7u1=H5WTmFnNQ@mail.gmail.com>");
//     console.log("<><><><><><><><>");
// })();
