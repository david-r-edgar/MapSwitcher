/* global
  globalThis,
  ScriptExecution */

import SourceMapData from './sourceMapData.js'
import Config from './config.js'
import MapLinksView from './mapLinksView.js'

// The Web Extension API is implemented on different root objects in different browsers.
// Firefox uses 'browser'. Chrome uses 'chrome'.
// Checking here allows us to use a common 'browser' everywhere.
let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

class MapSwitcher {
  // Main routine
  // - Initiates the content scripts
  // - Loads config and settings to determine how to display output
  // - Constructs the view, based on the config
  // - Passes the source data to the view to display the outputs
  // In case of any error (or for any non-map-service site), show a standard message
  async run () {
    try {
      await this.validateCurrentTab()
      const [extractedData] = await Promise.all([this.listenForExtraction(), this.runExtraction()])
      const sourceMapData = await SourceMapData.build(extractedData)
      const config = await Config.create()
      this.mapLinksView = new MapLinksView(config)
      await this.mapLinksView.display(sourceMapData)
    } catch (err) {
      this.mapLinksView.handleNoCoords(err)
    }
  }

  // Checks if we should continue attempting to extract data from the current tab.
  //
  // @return Promise which fulfils if OK to continue, otherwise rejects.
  validateCurrentTab () {
    return new Promise(function (resolve, reject) {
      browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if ((tabs[0].url.indexOf('chrome://') >= 0) ||
            (tabs[0].url.indexOf('chrome-extension://') >= 0) ||
            (tabs[0].url.indexOf('//chrome.google.com/') >= 0)) {
          reject(new Error())
        } else {
          resolve()
        }
      })
    })
  }

  // Sets up message listener to receive results from content script
  //
  // @return Promise which fulfils with the source map data
  listenForExtraction () {
    return new Promise(function (resolve) {
      browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        resolve(request.sourceMapData)
      })
    })
  }

  // Runs the content scripts which handle the extraction of coordinate data from the current tab.
  //
  // @return Promise which fulfils when complete
  runExtraction () {
    return new Promise(function (resolve) {
      new ScriptExecution().executeScripts(
        '/vendor/google-maps-data-parameter-parser/src/googleMapsDataParameter.js',
        '/src/mapUtil.js',
        '/src/dataExtractor.js')
      resolve()
    })
  }
}

function runMapSwitcher () {
  const mapSwitcher = new MapSwitcher()
  mapSwitcher.run()
}

// either run immediately, if loading is already complete, or run it when DOM is loaded
if (
  document.readyState === 'complete' ||
    (document.readyState !== 'loading' && !document.documentElement.doScroll)
) {
  runMapSwitcher()
} else {
  document.addEventListener('DOMContentLoaded', runMapSwitcher)
}
