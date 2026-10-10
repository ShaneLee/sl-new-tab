#!/usr/bin/env bash

set -e

FIREFOX_APP="${FIREFOX_APP:-Firefox Developer Edition}"

cd "$(dirname "$0")"

./package-firefox.sh

# Firefox only offers to install a local file if it ends in .xpi
cp sl.zip sl.xpi

open -a "$FIREFOX_APP" "$PWD/sl.xpi"
echo "Opened $PWD/sl.xpi in $FIREFOX_APP - accept the install prompt there"
