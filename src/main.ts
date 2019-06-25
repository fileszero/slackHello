
import * as cron from 'node-cron';
import * as slackBot from './slackBot'
import { sendScheduleNotice } from './scheduleNotice';

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
cron.schedule(CRON_EVERY_HALFDAY, () => {
    console.log("sendScheduleNotice CRON_EVERY_HALFDAY");
    sendScheduleNotice(controller);
})
sendScheduleNotice(controller);
