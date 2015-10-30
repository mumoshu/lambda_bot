#!/bin/bash

tests_dir=test/integration

function test() {
  $tests_dir/test.sh $tests_dir/test.js "$@"
}

test api_gateway playground3 lambda_bot "lambda_bot hi"
test api_gateway playground3 yusuke.kuoka "lambda_bot hi"
test api_gateway playground3 yusuke.kuoka "lambda_bot say deployment completed"
test scheduled_event every4min
test scheduled_event every5min
test scheduled_event 9am
test scheduled_event 10am
