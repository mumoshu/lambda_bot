var LambdaBot = require('lambda_bot');
var env = require('node-env-file');

env(__dirname + '/.env');

var bot = new LambdaBot({
    iconEmoji: process.env['SLACK_ICON_EMOJI'],
    userName: process.env['SLACK_USER_NAME'],
    channelName: process.env['SLACK_CHANNEL_NAME'],
    slackIncomingWebhookURL: process.env['SLACK_INCOMING_WEBHOOK_URL']
});

bot.hear(/foo/, function(res) {
    return res.send('bar');
});

bot.hear(/bar/, function(res) {
    return res.send('baz1').then(function() {
        return res.send('baz2');
    });
});

bot.respond(/hi/, function(res) {
    return res.reply('hi');
});

bot.respond(/say (.+)/, function(res) {
    return res.send(res.match[1]);
});

bot.on('every5min', function(res) {
    return res.send('5 min passed.');
});

bot.on('10am', function(res) {
    return res.send("It's 10am.");
});

exports.handler = bot.createHandler();
