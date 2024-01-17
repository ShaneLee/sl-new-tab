#!/usr/bin/env bash

set -e

mv manifest.json manifest.v3.json
mv manifest.v2.json manifest.json
zip -r -FS ../sl.zip * --exclude '*.git*'
mv manifest.json manifest.v2.json
mv manifest.v3.json manifest.json
