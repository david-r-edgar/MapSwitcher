/* global
  globalThis,
  fetch,
  ScriptExecution */

import MapLinksView from './mapLinks.js'
import OutputMaps from './outputMaps.js'
import SourceMapData from './sourceMapData.js'

// The Web Extension API is implemented on different root objects in different browsers.
// Firefox uses 'browser'. Chrome uses 'chrome'.
// Checking here allows us to use a common 'browser' everywhere.
let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

class MapSwitcher {
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

  async loadConfig () {
    const response = await fetch(browser.runtime.getURL('../config/defaultServices.json'))
    return response.json()
  }

  loadSettings () {
    return new Map([
      // FOR TESTING
      //   ['someservice', {cat: 'somecat', tab: 'sometab'}],
      //   ['waze', {cat: 'wazewazewazewazecat', tab: 'wazewazewazewazetab'}]
      // [ 'google', { 'cat': 'General purpose', 'tab': 'Regular mapping', 'hidden': true }]
    ])
  }

  mergeSettings (settings, defaultSettings) {
    // for each key in defaultSettings, if it doesn't exist in settings, add it
    //
    // it's not a straightforward 'union' of maps since we want to keep the
    // order of 'settings', but also keep any values it has set
    defaultSettings.forEach((value, key) => {
      if (!settings.has(key)) {
        settings.set(key, value)
      }
    })
    return settings
  }

  async loadConfigsAndSettings () {
    const loadedConfig = await this.loadConfig()
    const defaultConfig = new Map(loadedConfig)
    const settings = this.loadSettings()
    this.settings = this.mergeSettings(settings, defaultConfig)
  }

  // creates a three-level map with tabs at the top level, a submap of categories beneath each of
  // the tabs and a further submap of services beneath each of the categories
  // This structure is convenient for creating the DOM elements before the outputs
  // are generated
  convertSettingsToHierachicalMap () {
    const tabMap = new Map()
    this.settings.forEach((serviceSettings, service) => {
      if (!tabMap.has(serviceSettings.tab)) {
        tabMap.set(serviceSettings.tab, new Map())
      }
      if (!(tabMap.get(serviceSettings.tab)).get(serviceSettings.cat)) {
        (tabMap.get(serviceSettings.tab)).set(serviceSettings.cat, new Map())
      }
      const { 'cat': _, 'tab': __, ...otherSettings } = serviceSettings

      tabMap.get(serviceSettings.tab).get(serviceSettings.cat).set(service, otherSettings)
    })
    return tabMap
  }

  determineWhichTabsNeedDirections () {
    this.directionsTabs = {}
    this.settings.forEach((serviceSettings) => {
      if (serviceSettings.type === 'directions') {
        this.directionsTabs[serviceSettings.tab] = true
      }
    })
    return this.directionsTabs
  }

  // Constructs the outputs to be shown in the extension popup.
  //
  // Iterates throught the map services to request them to generate their links.
  //
  // @param sourceMapData
  constructOutputs (sourceMapData) {
    if (sourceMapData.nonUpdating !== undefined) {
      this.mapLinksView.displayNonUpdatingWarning(sourceMapData.nonUpdating)
    }

    const sourceMapDataInfo = {
      centreCoords: sourceMapData.centreCoords,
      locationDescr: sourceMapData.locationDescr
    }

    if (sourceMapData.directions && sourceMapData.directions.route) {
      sourceMapDataInfo.directions = {
        numWpts: sourceMapData.directions.route.length,
        mode: sourceMapData.directions.mode
      }
    }

    this.mapLinksView.showInfo(sourceMapDataInfo)

    // actually construct the lines for each output service
    for (let outputMapService of OutputMaps.services) {
      outputMapService.generate(sourceMapData, this.mapLinksView)
    }
  }

  // determines whether we're dealing with 'directions' or 'regular' source data
  determineSourceDataType (sourceMapData) {
    return sourceMapData.directions ? 'directions' : 'regular'
  }

  // Main routine
  // - Initiates the content scripts
  // - Loads config and settings to determine how to display output
  // - Constructs the view
  // - Builds outputs
  async run () {
    try {
      await this.validateCurrentTab()
      const [extractedData] = await Promise.all([this.listenForExtraction(), this.runExtraction()])
      const sourceMapData = await SourceMapData.build(extractedData)
      await this.loadConfigsAndSettings()
      const tabCatSvcMap = this.convertSettingsToHierachicalMap()
      const directionsTabs = this.determineWhichTabsNeedDirections()
      this.mapLinksView = new MapLinksView(tabCatSvcMap, this.settings, directionsTabs)
      this.mapLinksView.tabCatSvcSetup()
      this.mapLinksView.setupTabSourceDescr()
      await this.constructOutputs(sourceMapData)
      const sourceDataType = this.determineSourceDataType(sourceMapData)
      this.mapLinksView.prepareTabs(sourceDataType)
      this.mapLinksView.tabSetup()
      await this.mapLinksView.loaded()
    } catch (err) {
      MapLinksView.handleNoCoords(err)
    }
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
