var https = require('https');
var util = require('util');
var Promise = require('bluebird');

function SlackIncomingWebhook(options) {
    this.url = options.url;
}

SlackIncomingWebhook.prototype.post = function(data) {
    var context = this.context;

    var options = {
        method: 'POST',
        hostname: 'hooks.slack.com',
        port: 443,
        path: this.url
    };

    return Promise.fromCallback(function(callback) {
        var req = https.request(options, function(res) {
	    res.setEncoding('utf8');
	    res.on('data', function (chunk) {
                    callback(null, 'success');
	    });
	});
    
        req.on('error', function(e) {
	    console.log('problem with request: ' + e.message);
            callback(e);
	});

        req.write(util.format("%j", data));
        req.end();
    });
};

function Responder(options) {
    this.event = options.event;
    this.bot = options.bot;
    this.match = options.match;
}

Responder.prototype.send = function(text) {
    return this.bot.send(text, this.event);
};

Responder.prototype.reply = function(text) {
    return this.send("@" + this.event.userName + " " + text);
};

function Handler(options) {
    this.match = options.match;
    this.action = options.action;
}

Handler.prototype.execute = function(options) {
    var event = options.event;
    var bot = options.bot;

    var match = this._match(event, bot);

    if (!match) {
        return false;
    }

    var res = new Responder({event: event, bot: bot, match: match});

    return this.action(res);
};

Handler.prototype._match = function(event, bot) {
    return event.userName != bot.userName && this.match(event);
};

function LambdaBot(options) {
    this.slackIncomingWebhook = options.slackIncomingWebhook;
    if (!!!this.slackIncomingWebhook) {
        this.slackIncomingWebhook = new SlackIncomingWebhook({url: options.slackIncomingWebhookURL})
    }
    this.iconEmoji = options.iconEmoji;
    this.userName = options.userName;
    this.channelName = options.channelName;
    this.scheduledEventPrefix = 'cron:';
}

LambdaBot.prototype.logEvent = function(event) {
    var str = JSON.stringify(event, null, 2);

    console.log("event", event);
};

LambdaBot.prototype.normalizeEvent = function(event) {
    var normalized = {};
    for (var key in event) {
        normalized[this.lowerCamelizeString(key)] = event[key];
    }
    if (event.resources && event.resources[0]) {
        var resource = event.resources[0];
        var ruleName = resource.match(/rule\/(.+)$/)[1];
        normalized.text = this.scheduledEventPrefix + ruleName;
    }
    return normalized;
};

LambdaBot.prototype.lowerCamelizeString = function(str) {
    return str.replace(/(?:^|[_])(\w)/g, function (_, c, i) {
        return c && i != 0 ? c.toUpperCase () : c;
    }).split('_').join('');
};

LambdaBot.prototype.handler = function(event, context) {
    var self = this;
    var normalized = this.normalizeEvent(event);

    this.logEvent(event);
    this.logEvent(normalized);

    return Promise.all(this.handlers).map(function(handler) {
        return handler.execute({event: normalized, bot: self});
    }).then(function(result) {
        context.done(null, result);
    });
};

LambdaBot.prototype.addHandler = function(handler) {
    var handlers = this.handlers = this.handlers || [];

    console.log("handlers", handlers);

    handlers.push(handler);
};

LambdaBot.prototype.respond = function(pattern, action) {
    var userName = this.userName;
    var handler = new Handler({
        match: function(event) {
            return event.text.indexOf(userName) > -1 && event.text.match(pattern);
        },
        action: action
    });

    this.addHandler(handler);
};

LambdaBot.prototype.hear = function(pattern, action) {
    var handler = new Handler({
        match: function(event) {
            return event.text.match(pattern);
        },
        action: action
    });

    this.addHandler(handler);
};

LambdaBot.prototype.quoteStrInRegexp = function(str) {
    return str.replace(/(?=[\/\\^$*+?.()|{}[\]])/g, "\\");
};

LambdaBot.prototype.on = function(ruleName, action) {
    var pattern = new RegExp(this.quoteStrInRegexp(this.scheduledEventPrefix + ruleName));
    this.hear(pattern, action);
};

LambdaBot.prototype.send = function(text, options) {
    options = options || {};

    var channelName = options.channelName || this.channelName;
    var userName = this.userName;
    var iconEmoji = this.iconEmoji;

    var postData = {
        "channel": "#" + channelName,
        "username": userName,
        "text": text,
        "icon_emoji": iconEmoji
    };

    return this.slackIncomingWebhook.post(postData);
};

/**
 * @param [Object] event
 * LambdaのScheduled Eventの場合、以下のような内容になる。
 * {
     "id": "833df979-2577-4df3-89b0-e810bab1423e",
     "detail-type": "Scheduled Event",
     "source": "aws.events",
     "account": "<AWS Account ID>",
     "time": "2015-10-22T04:19:00Z",
     "region": "ap-northeast-1",
     "resources": [
       "arn:aws:events:ap-northeast-1:<AWS Account ID>:rule/test"
     ],
     "detail": {}
   }
   API Gateway経由の場合、以下のような内容になっている想定
   {
     "user_name": "yusuke.kuoka",
     "text": "lambda_bot hello",
     "channel_id": "C0xxxxxx",
     "user_id": "U0xxxxxx",
     "team_id": "T0xxxxxx",
     "token": "(*´ڡ`●)",
     "timestamp": "1445488596.002628",
     "channel_name": "playground"
   }
*/
LambdaBot.prototype.createHandler = function() {
    var self = this;
    return function(event, context) {
        self.handler(event, context);
    };
};

module.exports = LambdaBot;
