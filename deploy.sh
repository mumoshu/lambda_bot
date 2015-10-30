#!/bin/bash

set -vx

handler_name=lambda_bot
function_name=$handler_name
channel_name=playground3
user_name=$SLACK_USER_NAME

zip dist.zip -r node_modules lib .env *.js

if aws lambda get-function --function-name $function_name; then
  aws lambda update-function-code --function-name $function_name --zip-file fileb://$(pwd)/dist.zip && unzip -l dist.zip
else
  aws lambda create-function --function-name $function_name --runtime nodejs --role $(aws iam list-roles --output json | jq -r '.Roles[].Arn | select(match("lambda_basic_execution"))') --handler $handler_name.handler --zip-file fileb://$(pwd)/dist.zip --region ap-northeast-1 && unzip -l dist.zip
fi

if [ $? -eq 0 ]; then
  aws lambda invoke --function-name $function_name --payload "{\"channel_name\":\"$channel_name\",\"user_name\":\"$user_name\",\"text\":\"lambda_bot say Deployment completed.\"}" -
fi
