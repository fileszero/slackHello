import dotenv from 'dotenv';
import * as Botkit from 'botkit';

dotenv.config();

if (!process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}
console.log(process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN);

const controller = Botkit.slackbot({
    debug: false
});

const slackConfig: Botkit.SlackSpawnConfiguration = {
    token: process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN || ""
};
const bot = controller.spawn(slackConfig);
function connect() {
    bot.startRTM((err) => {
        if (err) {
            console.log("Error==>" + err)
            throw new Error(err);
        }
    });
}
connect();
controller.on('rtm_close', function (bot) {
    console.log('rtm_close-->RTM connection is closed');
    connect();
});

// say hi
controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    bot.reply(message, 'hello');
});

// default
// 最後に記述してください。
controller.hears('(.*)', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    bot.reply(message, 'なに??');
});
