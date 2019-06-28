import * as emoji from 'emoji';
import * as mailparser from 'mailparser';
import * as fs from 'fs';
const Iconv = require('iconv').Iconv;

import { toUnicode } from 'punycode';
async function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        let text = "";
        process.stdin.on('data', (chunk) => {
            text += chunk;
        });

        process.stdin.on('end', () => {
            resolve(text);
        });
    });
}


(async () => {
    // const text = await readStdin();
    const text = fs.readFileSync(0);    //type .\data\original_msg.eml | node ./dest/mailConvert.js
    // .\data\iso-2022-jp.eml
    // const text = fs.readFileSync('./data/iso-2022-jp.eml', {});

    console.log(text);
    const mail_opt: mailparser.SimpleParserOptions = {
        //encoding: "sjis"
    };
    const mail_data = await mailparser.simpleParser(text, { Iconv: Iconv });
    console.log(mail_data);
    // let charset: string | undefined = undefined;
    // try {
    //     charset = (mail_data.headers.get("content-type") as any).params.charset;
    // } catch{ }
    // if (charset) {
    //     const iconv = new Iconv(charset, 'UTF-8');
    //     mail_data.text = iconv.convert(mail_data.text);
    // }
    const unified = emoji.docomoToUnified(mail_data.text);
    console.log(unified);
})();
