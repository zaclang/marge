#!/bin/sh

set -e

# npm i
# export PATH="node_modules/.bin:node_modules/hubot/node_modules/.bin:$PATH"

exec node_modules/.bin/webby --name "marge" "$@"
