import * as emoji from 'emoji';
import * as mailparser from 'mailparser';
import * as fs from 'fs';
import * as slackBot from './slackBot'

const Iconv = require('iconv').Iconv;

async function readStdin(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const data: any[] = [];
        process.stdin.on('data', (chunk) => {
            data.push(chunk);
        });

        process.stdin.on('end', () => {
            resolve(Buffer.concat(data));
        });
    });
}


function unifiedToSlack(text: string) {
    return text.replace(emoji.EMOJI_RE(), function (_, m) {
        var em = emoji.EMOJI_MAP[m];

        return ': ' + em[1].replace(' ', '_') + ' :';
    });
}
(async () => {
    const text = await readStdin();
    // const text = await readStdin2()
    //const text = fs.readFileSync(0);    //type .\data\original_msg.eml | node ./dest/mailConvert.js
    // .\data\iso-2022-jp.eml
    // const text = fs.readFileSync('./data/iso-2022-jp.eml', {});

    console.log(text);
    const mail_opt: mailparser.SimpleParserOptions = {
        //encoding: "sjis"
    };
    const mail_data = await mailparser.simpleParser(text, { Iconv: Iconv });
    // console.log(mail_data);
    // if (mail_data.from.value[0]["address"]) {    }
    let unified = emoji.docomoToUnified(mail_data.text);
    unified = emoji.kddiToUnified(unified);
    unified = emoji.softbankToUnified(unified);
    // unified = unifiedToSlack(unified);
    // const controller = slackBot.controller;
    // slackBot.sendDirectMessage(controller, process.env.DM_TARGET || '', unified);
    if (mail_data.attachments) {
        mail_data.attachments.map((f) => {
            console.log(f.filename);
        });
    }
    console.log(unified);
})();
