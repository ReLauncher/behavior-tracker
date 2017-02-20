#!/bin/bash

echo "===================================="
echo "= BEHAVIOR TRACKER LOGS TO CSV ="
echo "===================================="

echo "\nNow we create a folder for $@ source"
mkdir "logs"
echo "\nNow we generate logs of key presses from firebase..."
node key_presses_to_csv.js $@ $@
echo "\nNow we generate logs of clicks from firebase..."
node clicks_to_csv.js $@ $@
echo "\nNow we generate logs of tab visibility from firebase..."
node tab_visibility_to_csv.js $@ $@
echo "\nDONE"
echo "===================================="