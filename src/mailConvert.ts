import * as emoji from 'emoji';
import * as mailparser from 'mailparser';
import * as fs from 'fs';
import { slackBot } from './slackBot'
import { SlackBotWorker } from 'botbuilder-adapter-slack';

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
    // const text = fs.readFileSync('./data/original_msg.eml', {});
    // const text = fs.readFileSync('./data/iso-2022-jp.eml', {});
    // const text = fs.readFileSync('./data/inline_img.eml', {});

    console.log(text);
    const mail_opt: mailparser.SimpleParserOptions = {
        //encoding: "sjis"
    };
    const mail_data = await mailparser.simpleParser(text, { Iconv: Iconv });
    console.log(mail_data.text);
    // if (mail_data.from.value[0]["address"]) {    }
    let unified = emoji.docomoToUnified(mail_data.text);
    unified = emoji.kddiToUnified(unified);
    unified = emoji.softbankToUnified(unified);
    // unified = emoji.googleToUnified(unified);
    //unified = unifiedToSlack(unified);
    console.log(unified);
    const bot = new slackBot({ disable_webserver: true });
    const CHANNEL = "GKJE67PGC";    // prvatetest:GKJE67PGC // fileszero:U7W20F25A
    const thread = await bot.sendMessage(CHANNEL, unified);
    // if (mail_data.attachments) {
    //     //https://qiita.com/stkdev/items/992921572eefc7de4ad8
    //     const attachments = await Promise.all(mail_data.attachments.map(async (f) => {
    //         // var image = 'data:' + f.contentType + ";base64," + f.content.toString('base64');
    //         // f.content.toString(image);
    //         const upload = await thread.bot.api.files.upload({
    //             // https://api.slack.com/methods/files.upload
    //             filename: f.filename,
    //             title: f.filename,
    //             initial_comment: "アタッチ",
    //             file: f.content,
    //             channels: CHANNEL,   // general: 'C7W0K6P5G'
    //             thread_ts: thread.activity.id,
    //             // filetype: 'png'  //https://api.slack.com/types/file#file_types
    //         });
    //     }));
    // }
    //console.log(unified);
})();
