/* global
  browser, chrome */

var browserRoot = chrome?.runtime ? chrome : browser // eslint-disable-line no-global-assign

function registerExtractor (extractor) { // eslint-disable-line no-unused-vars
  // execute the extractor and send the result to the main script
  new Promise(extractor).then(function (sourceMapData) {
    browserRoot.runtime.sendMessage({ sourceMapData })
  }).catch(function () {
    // if the extractor fails, just send a null message to the main script to indicate failure
    browserRoot.runtime.sendMessage({})
  })
}
