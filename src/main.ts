
import * as datefns from 'date-fns';
import { Botkit, BotkitMessage } from 'botkit';
// import { SlackAdapter } from 'botbuilder-adapter-slack'
import { SlackAdapter, SlackMessageTypeMiddleware, SlackBotWorker, SlackAdapterOptions } from 'botbuilder-adapter-slack';
import { GoogleCalendar, CalendarEvent } from './gcal';

import * as slackBot from './slackBot'

const controller = slackBot.controller;
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


