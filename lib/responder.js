'use strict';

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

module.exports = Responder;
