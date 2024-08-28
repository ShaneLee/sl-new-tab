#!/usr/bin/env bash

set -e

cd src

mv manifest.json manifest.v3.json
mv manifest.v2.json manifest.json
cp manifest.json manifest.v2.json.bak
files=$(ls template | awk '{printf "\"template/%s\",", $0}' | sed 's/,$//')
echo "[$files]" > files_array.json
jq --argjson files "$(cat files_array.json)" '.web_accessible_resources = $files' manifest.json > manifest.updated.json
mv manifest.updated.json manifest.json
cat files_array.json
rm files_array.json
zip -r -FS ../sl.zip * --exclude '*.git*'
mv manifest.v2.json.bak manifest.v2.json
mv manifest.v3.json manifest.json

cd -
