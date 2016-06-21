#!/bin/bash

mkdir release
mkdir release/src

~/uglifyjs2harmony/bin/uglifyjs src/dataExtractor.js --mangle -o release/src/dataExtractor.js
~/uglifyjs2harmony/bin/uglifyjs src/mapUtil.js -c --mangle -o release/src/mapUtil.js
~/uglifyjs2harmony/bin/uglifyjs src/mapswitcher.js -c --mangle -o release/src/mapswitcher.js
~/uglifyjs2harmony/bin/uglifyjs src/options.js -c --mangle -o release/src/options.js
~/uglifyjs2harmony/bin/uglifyjs src/outputMaps.js -o release/src/outputMaps.js


cp manifest.json release/
cp -r image release/image
cp -r html release/html
cp -r vendor release/vendor
