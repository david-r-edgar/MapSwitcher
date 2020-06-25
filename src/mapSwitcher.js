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

  // Handles cases where no coordinates are available from the page, or another problem
  // has occured.
  //
  // @param {object} errorObject - Contains any relevant error data
  handleNoCoords (errorObject) {
    const loadingElem = document.getElementsByClassName('loading')[0]
    loadingElem.style.display = 'none'
    const nomapElem = document.getElementById('nomap')
    nomapElem.style.display = 'block'
    const maplinkboxElem = document.getElementById('tabContainer')
    maplinkboxElem.style.display = 'none'
  }

  // Constructs the outputs to be shown in the extension popup.
  //
  // Run once the dataExtractor has been executed on the current tab.
  // Iterates throught the map services to request them to generate their links.
  //
  // @param sourceMapData
  constructOutputs (sourceMapData) {
    const mapLinksView = this.mapLinksView

    // display modal with warning for non-updating sources
    if (sourceMapData.nonUpdating !== undefined) {
      var modal = document.getElementById('warningModal')
      modal.style.display = 'block'

      document.getElementById('nonUpdatingHost').textContent = sourceMapData.nonUpdating

      const close = document.getElementsByClassName('modalClose')[0]

      close.onclick = function () {
        modal.style.display = 'none'
      }
      modal.onclick = function (event) {
        if (event.target === modal) {
          modal.style.display = 'none'
        }
      }
    }

    // set source coords and description
    Array.from(document.getElementsByClassName('sourceLocnVal')).map(elem => {
      elem.textContent =
      Number(sourceMapData.centreCoords.lat).toFixed(7) + ', ' +
      Number(sourceMapData.centreCoords.lng).toFixed(7)
    })
    Array.from(document.getElementsByClassName('sourceExtrFromVal')).map(elem => {
      if (undefined === sourceMapData.locationDescr) {
        elem.textContent = 'currently displayed map'
      } else {
        elem.textContent = sourceMapData.locationDescr
      }
    })

    // show directions category; set directions description
    if ('directions' in sourceMapData) {
      let numWpts = 0
      let mode = ''
      if ('route' in sourceMapData.directions) {
        numWpts = sourceMapData.directions.route.length
      }
      var dirnDescr = numWpts + ' waypoint route'
      if ('mode' in sourceMapData.directions) {
        mode = (sourceMapData.directions.mode === 'transit')
          ? 'public transport' : sourceMapData.directions.mode
        dirnDescr += ', travelling by ' + mode
      }
      Array.from(document.getElementsByClassName('directionsDescr')).map((elem) => {
        elem.textContent = dirnDescr
      })
    }

    // actually construct the lines for each output service
    for (let outputMapService of OutputMaps.services) {
      (function (outputMapService) { // dummy immediately executed fn to save variables
        let mapOptDefaults = {}
        mapOptDefaults[outputMapService.id] = true

        browser.storage.local.get(mapOptDefaults, function (options) {
          if (options[outputMapService.id]) {
            outputMapService.generate(sourceMapData, mapLinksView)
          }
        })
      })(outputMapService)
    }
  }

  // determines whether we're dealing with 'directions' or 'regular' source data
  determineSourceDataType (sourceMapData) {
    return sourceMapData.directions ? 'directions' : 'regular'
  }

  // Hide the animated loading dots.
  loaded () {
    const loadingElem = document.getElementsByClassName('loading')[0]
    loadingElem.style.display = 'none'
    const mainTabBox = document.getElementById('mainBorderBox')
    mainTabBox.style.display = 'inline-block'
    const nomapbox = document.getElementById('nomapbox')
    nomapbox.style.display = 'none'
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
      await this.loaded()
    } catch (err) {
      this.handleNoCoords(err)
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
