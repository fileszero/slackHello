
import * as cron from 'node-cron';
import { slackBot } from './slackBot'
import { getScheduleNotice } from './scheduleNotice';
import { sendRainNotice } from './yahooWeather';
import config from "./config";

const bot = new slackBot({});

async function startBot() {
    /**
     * RTM APIのイベント
     * ないと「Error: Stale RTM connection, closing RTM」というエラーになる
     */
    bot.controller.on('rtm_open', async (bot, message) => {
        console.log('** The RTM api just connected!');
    });
    bot.controller.on('rtm_close', async (bot, message) => {
        console.log('** The RTM api just closed');
    });

    bot.controller.on('message', async (bot, message) => {
        await bot.reply(message, 'I heard a message!');
    });

    // say hi
    bot.controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
        await bot.reply(message, 'hello');
    });

    bot.controller.hears('test', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
        let msg = message.text || "";
        msg = msg.replace(/test/i, "").trim();
    });

    // default
    // 最後に記述してください。
    bot.controller.hears('(.*)', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
        await bot.reply(message, 'なに??');
    });
}

function startCRONJobs() {
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
            bot.sendMessage(config.slack.dmTarget, message);
        }

    })

    cron.schedule(CRON_EVERY_5MINUTE, async () => {
        console.log("sendRainNotice CRON_EVERY_5MINUTE");
        const message = await sendRainNotice();
        if (message) {
            bot.sendMessage(config.slack.dmTarget, message);
        }

    });
}
(async () => {
    startCRONJobs();
    bot.sendMessage(config.slack.dmTarget, "bot started Direct message", { username: "開始しますyo", icon_emoji: ":robot_face:", as_user: false });
    // bot.sendMessage("C7W0K6P5G", "bot started public channel message general");
    // bot.sendMessage("GKJE67PGC", "bot started private channel message", { icon_emoji: ":woman:", as_user: false });
    // bot.sendMessage("G7WRV4KS7", "bot started private channel message (not memeber)log4js");
    // const message = await sendRainNotice();
    // if (message) {
    //     bot.sendDirectMessage(config.slack.dmTarget, message);
    // }
    // var msg = [":sunny:", ":rain_0_1:", ":rain_1_3:", ":rain_4_10:", ":rain_11_20:", ":rain_21:"].join(" ");
    // slackBot.sendDirectMessage(controller, config.slack.dmTarget || '', "テスト\n" + msg);

    // const message = await sendRainNotice();
    // if (message) {
    //     slackBot.sendDirectMessage(controller, config.slack.dmTarget || '', message);
    // }

})();
