'use strict';

var Responder = require('./responder');

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

module.exports = Handler;
