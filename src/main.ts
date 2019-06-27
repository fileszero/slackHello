
import * as cron from 'node-cron';
import * as slackBot from './slackBot'
import { getScheduleNotice } from './scheduleNotice';
import { sendRainNotice } from './yahooWeather';

const controller = slackBot.controller;

async function startBot() {
    /**
     * RTM APIのイベント
     * ないと「Error: Stale RTM connection, closing RTM」というエラーになる
     */
    controller.on('rtm_open', async (bot, message) => {
        console.log('** The RTM api just connected!');
    });
    controller.on('rtm_close', async (bot, message) => {
        console.log('** The RTM api just closed');
    });

    controller.on('message', async (bot, message) => {
        await bot.reply(message, 'I heard a message!');
    });

    // say hi
    controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
        await bot.reply(message, 'hello');
    });

    controller.hears('test', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
        let msg = message.text || "";
        msg = msg.replace(/test/i, "").trim();
    });

    // default
    // 最後に記述してください。
    controller.hears('(.*)', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
        await bot.reply(message, 'なに??');
    });
}
// https://www.npmjs.com/package/node-cron#cron-syntax
//         # ┌────────────── second(optional)
//         # │ ┌──────────── minute
//         # │ │ ┌────────── hour
//         # │ │ │ ┌──────── day of month
//         # │ │ │ │ ┌────── month
//         # │ │ │ │ │ ┌──── day of week
//         # │ │ │ │ │ │
//         # │ │ │ │ │ │
//         # * * * * * *
const CRON_EVERY_5MINUTE = "*/5 * * * *"
const CRON_EVERY_MORNING = "5 6 * * *"
const CRON_EVERY_EVENING = "5 18 * * *"
const CRON_EVERY_HALFDAY = "5 6,18 * * *"
cron.schedule(CRON_EVERY_HALFDAY, async () => {
    console.log("sendScheduleNotice CRON_EVERY_HALFDAY");
    const message = await getScheduleNotice();
    if (message) {
        slackBot.sendDirectMessage(controller, process.env.DM_TARGET || '', message);
    }

})

cron.schedule(CRON_EVERY_5MINUTE, async () => {
    console.log("sendRainNotice CRON_EVERY_5MINUTE");
    const message = await sendRainNotice();
    if (message) {
        slackBot.sendDirectMessage(controller, process.env.DM_TARGET || '', message);
    }

});

(async () => {
    slackBot.sendDirectMessage(controller, process.env.DM_TARGET || '', "bot started");

    // var msg = [":sunny:", ":rain_0_1:", ":rain_1_3:", ":rain_4_10:", ":rain_11_20:", ":rain_21:"].join(" ");
    // slackBot.sendDirectMessage(controller, process.env.DM_TARGET || '', "テスト\n" + msg);

    // const message = await sendRainNotice();
    // if (message) {
    //     slackBot.sendDirectMessage(controller, process.env.DM_TARGET || '', message);
    // }

})();
