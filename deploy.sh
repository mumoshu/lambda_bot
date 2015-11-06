#!/bin/bash

set -vxe

handler_name=example_bot
function_name=lambda_bot
channel_name=playground3
user_name=$SLACK_USER_NAME

build() {
  mkdir -p build/
  rm -Rf build/*

  cp -R node_modules build/

  mkdir build/node_modules/lambda_bot
  cp -R package.json lib build/node_modules/lambda_bot/

  cp .env *.js build/

  pushd build
  rm ../dist.zip
  zip ../dist.zip -r .env *
  popd
}

deploy() {
  if aws lambda get-function --function-name $function_name; then
    aws lambda update-function-code --function-name $function_name --zip-file fileb://$(pwd)/dist.zip && unzip -l dist.zip
  else
    aws lambda create-function --function-name $function_name --runtime nodejs --role $(aws iam list-roles --output json | jq -r '.Roles[].Arn | select(match("lambda_basic_execution"))') --handler $handler_name.handler --zip-file fileb://$(pwd)/dist.zip --region ap-northeast-1 && unzip -l dist.zip
  fi
}

test() {
  aws lambda invoke --function-name $function_name --payload "{\"channel_name\":\"$channel_name\",\"user_name\":\"$user_name\",\"text\":\"lambda_bot say Deployment completed.\"}" -
}

run_all() {
  build
  deploy

  if [ $? -eq 0 ]; then
    test
  fi
}

if [ -z "$1" ]; then
  run_all
else
  "$@"
fi
