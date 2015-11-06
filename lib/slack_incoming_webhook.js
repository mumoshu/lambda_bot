'use strict';

var https = require('https'),
    util = require('util'),
    Promise = require('bluebird');

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

    console.log("POSTING");

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

module.exports = SlackIncomingWebhook;
