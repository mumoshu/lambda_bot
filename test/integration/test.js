var test_bot = require('test_bot');

var event;

if (process.argv[2] == 'api_gateway') {
    event = {
        channel_name: process.argv[3] || "playground3",
        user_name: process.argv[4] || "yusuke.kuoka",
        text: process.argv[5] || "lambda_bot foo"
    };
} else {
    event = {
        "id": "833df979-2577-4df3-89b0-e810bab1423e",
        "detail-type": "Scheduled Event",
        "source": "aws.events",
        "account": "<AWS Account ID>",
        "time": "2015-10-22T04:19:00Z",
        "region": "ap-northeast-1",
        "resources": [
            "arn:aws:events:ap-northeast-1:<AWS Account ID>:rule/" + process.argv[3]
         ],
         "detail": {}
    };
}

var context = {
    done: function(err, result) {
        console.log({err: err, result: result});
        var status = err ? 1 : 0;
        process.exit(status);
    }
};

test_bot.handler(event, context);

setTimeout(function() {
    console.error("timed out.");
    process.exit(2)
}, 4000);
