import * as Botkit from 'botkit';

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}
console.log(process.env.token);

const controller = Botkit.slackbot({
    debug: false
});

const slackConfig: Botkit.SlackSpawnConfiguration = {
    token: process.env.token || ""
};
controller.spawn(slackConfig).startRTM((err) => {
    if (err) {
        throw new Error(err);
    }
});

// say hi
controller.hears('hi', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
    bot.reply(message, 'hello');
});