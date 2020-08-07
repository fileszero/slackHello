import * as emoji from "emoji";
import * as mailparser from "mailparser";
import * as fs from "fs";
import { slackBot } from "./slackBot";
import { SlackBotWorker } from "botbuilder-adapter-slack";
import config from "./config";
import * as mailConverters from "./mailConverters";
// import request = require('request');

const Iconv = require("iconv").Iconv;

async function readStdin(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data: any[] = [];
    process.stdin.on("data", (chunk) => {
      data.push(chunk);
    });

    process.stdin.on("end", () => {
      resolve(Buffer.concat(data));
    });
  });
}

function unifiedToSlack(text: string) {
  return text.replace(emoji.EMOJI_RE(), function (_, m) {
    var em = emoji.EMOJI_MAP[m];

    return ": " + em[1].replace(" ", "_") + " :";
  });
}
(async () => {
  const text = await readStdin();

  // const text = fs.readFileSync(0);    //type .\data\original_msg.eml | node ./dest/mailConvert.js
  // const text = fs.readFileSync('./data/original_msg.eml', {});
  // const text = fs.readFileSync('./data/iso-2022-jp.eml', {});
  // const text = fs.readFileSync('./data/inline_img.eml', {});
  // const text = fs.readFileSync('./data/lalacall.eml', {});
  // const text = fs.readFileSync('./data/GREEN_DOG_Fix.eml', {});

  // console.log(text);
  const mail_opt: mailparser.SimpleParserOptions = {
    //encoding: "sjis"
  };
  const mail_data = await mailparser.simpleParser(text, { Iconv: Iconv });
  const from_address: string = mail_data.from.value[0]["address"];
  const emailChannel = config.slack.emailChannel.find((ec) => ec.email == from_address);
  console.log("from:" + from_address);
  if (!emailChannel) {
    return "";
  }
  // convert body to slack
  const mailConverter: mailConverters.baseConverter = emailChannel.converter ? emailChannel.converter : mailConverters.static_default;
  // console.log(mail_data.text);
  // if (mail_data.from.value[0]["address"]) {    }
  let unified = await mailConverter.convert(mail_data);
  console.log(unified);
  // unified = ''; // debug
  if (unified) {
    const bot = new slackBot({ disable_webserver: true });
    const thread = await bot.sendMessage(emailChannel.channel, unified, emailChannel.opt);
    if (mail_data.attachments) {
      //https://qiita.com/stkdev/items/992921572eefc7de4ad8
      const attachments = await Promise.all(
        mail_data.attachments.map(async (f) => {
          // var image = 'data:' + f.contentType + ";base64," + f.content.toString('base64');
          // f.content.toString(image);
          const upload = await thread.bot.api.files.upload({
            // https://api.slack.com/methods/files.upload
            filename: f.filename,
            title: f.filename,
            initial_comment: "アタッチ",
            file: f.content,
            channels: emailChannel.channel, // general: 'C7W0K6P5G'
            thread_ts: thread.activity.id,
            // filetype: 'png'  //https://api.slack.com/types/file#file_types
          });
        })
      );
    }
  }
})();
