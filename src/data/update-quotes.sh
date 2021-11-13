#!/usr/bin/env bash

git clone https://github.com/ShaneLee/quotes
cp quotes/src/quotes.json .
rm -rf quotes

git add .
git commit -m 'Update quotes'
git push
