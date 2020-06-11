/* global
  globalThis,
  ScriptExecution,
  codegrid, jsonWorldGrid
  calculateResolutionFromStdZoom,
  CoordTransform, OsGridRef */

import MapLinksView from './mapLinks.js'
import OutputMaps from './outputMaps.js'

/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

class MapSwitcher {

  /**
     * Checks if we should continue attempting to extract data from the current tab.
     *
     * @return Promise which fulfils if OK to continue, otherwise rejects.
     */
  validateCurrentTab = function () {
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

  /**
     * Runs the content scripts which handle the extraction of coordinate data from the current tab.
     *
     * @return Promise which fulfils when complete
     */
  runExtraction = function () {
    return new Promise(function (resolve) {
      new ScriptExecution().executeScripts(
        '/vendor/google-maps-data-parameter-parser/src/googleMapsDataParameter.js',
        '/src/mapUtil.js',
        '/src/dataExtractor.js')
      resolve()
    })
  }

  /**
     * Sets up message listener to receive results from content script
     *
     * @return Promise which fulfils with the source map data
     */
  listenForExtraction = function () {
    return new Promise(function (resolve) {
      browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        resolve(request.sourceMapData)
      })
    })
  }

  normaliseOSGBCoords = function (extractedData) {
    const osGR = new OsGridRef(extractedData.osgbCentreCoords.e,
      extractedData.osgbCentreCoords.n)
    const osLL = OsGridRef.osGridToLatLong(osGR)
    const wgs84LL = CoordTransform.convertOSGB36toWGS84(osLL)
    extractedData.centreCoords = {
      lat: wgs84LL._lat,
      lng: wgs84LL._lon
    }
    return extractedData
  }

  normaliseLambertCoords = async function (extractedData) {
    const request = new window.Request(`http://www.loughrigg.org/wgs84Lambert/lambert_wgs84/${extractedData.lambertCentreCoords.e}/${extractedData.lambertCentreCoords.n}`)
    const response = await window.fetch(request)
    const { lat, lng } = await response.json()
    extractedData.centreCoords = { lat, lng }
    return extractedData
  }

  normaliseGooglePlace = async function (extractedData) {
    const request = new window.Request(`https://www.google.com/maps?q=${extractedData.googlePlace}`)
    const initOptions = {
      credentials: 'omit'
    }
    const response = await window.fetch(request, initOptions)
    const responseBlob = await response.blob()
    const blobtext = await responseBlob.text()
    // coords are given many times in the response, but some others are shifted to one side
    const googleRe = /preview\/place\/[^/]+\/@([-0-9.]+),([-0-9.]+),[-0-9.]+a,([0-9.]+)y/
    const resultArray = blobtext.match(googleRe)
    extractedData.centreCoords = {
      lat: resultArray[1],
      lng: resultArray[2]
    }
    extractedData.resolution = calculateResolutionFromStdZoom(resultArray[3], resultArray[1])
    return extractedData
  }

  /**
    * Put the extracted data in a standard format, and perform any necessary checks
    * to ensure the extracted data object is suitable for output use.
    *
    * The main functionality is to convert from unusual coordinate systems to WGS84.
    *
    * @param {object} extractedData - Data object extracted by the dataExtractor.
    * @return Promise which resolves if the data can be normalised, or rejects if not.
    */
  normaliseExtractedData = async function (extractedData) {
    // return new Promise(function (resolve, reject) {
    if (!extractedData) {
      throw new Error('no data extracted')
    }

    if (extractedData.centreCoords) {
      // regular wgs84 coords extracted
      return extractedData
    } else if (extractedData.osgbCentreCoords) {
      // osgb36 coords specified
      return this.normaliseOSGBCoords(extractedData)
    } else if (extractedData.lambertCentreCoords) {
      // Lambert Conic Conformal coords specified
      return this.normaliseLambertCoords(extractedData)
    } else if (extractedData.googlePlace) {
      // named google place (a map is being shown in search results, but
      // we don't know how to extract the coords)
      return this.normaliseGooglePlace(extractedData)
    }

    // if we reach here, then have no coords of any recognised format
    throw new Error('extracted data not in recognised format')
  }

  /**
    * Gets the two letter country code for the current location of the map shown
    * in the current tab. If the country code can be found, it is stored in the
    * extracted data object passed as argument.
    *
    * @param {object} extractedData - Data object extracted by the dataExtractor.
    * @return Promise which resolves on success with the extracted data object.
    */
  getCountryCode = function (extractedData) {
    // CodeGrid is a service for identifying the country within which a coordinate
    // falls. The first-level identification tiles are loaded client-side, so most
    // of the time, no further request is necessary. But in cases where the coordinate
    // is close to an international boundary, additional levels of tiles, with more
    // detail, are reqested from the specified host.
    const CodeGrid = codegrid.CodeGrid('https://www.loughrigg.org/codegrid-js/tiles/', jsonWorldGrid) // eslint-disable-line no-global-assign

    return new Promise(function (resolve) {
      if (extractedData && extractedData.centreCoords != null) {
        CodeGrid.getCode(
          Number(extractedData.centreCoords.lat),
          Number(extractedData.centreCoords.lng),
          function (error, countryCode) {
            if (!error) {
              extractedData.countryCode = countryCode
              resolve(extractedData)
            }
          })
      }
    })
  }

  /**
    * Handles cases where no coordinates are available from the page, or another problem
    * has occured.
    *
    * @param {object} errorObject - Contains any relevant error data
    */
  handleNoCoords = function (errorObject) {
    const nomapElem = document.getElementById('nomap')
    nomapElem.style.display = 'block'
    const maplinkboxElem = document.getElementById('maplinkbox')
    maplinkboxElem.style.display = 'none'
  }

  /**
    * Constructs the outputs to be shown in the extension popup.
    *
    * Run once the dataExtractor has been executed on the current tab.
    * Iterates throught the map services to request them to generate their links.
    *
    * @param sourceMapData
    */
  constructOutputs = function (sourceMapData) {
    const mapLinksView = new MapLinksView

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

    document.getElementById('sourceLocnVal').textContent =
      Number(sourceMapData.centreCoords.lat).toFixed(7) + ', ' +
      Number(sourceMapData.centreCoords.lng).toFixed(7)
    if (undefined === sourceMapData.locationDescr) {
      document.getElementById('sourceExtrFromVal').textContent = 'currently displayed map'
    } else {
      document.getElementById('sourceExtrFromVal').textContent = sourceMapData.locationDescr
    }
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
      const sourceDirnElem = document.getElementById('sourceDirn')
      sourceDirnElem.style.display = 'block'
      document.getElementById('sourceDirnVal').textContent = dirnDescr
    }

    if (sourceMapData.directions && sourceMapData.directions.route) {
      mapLinksView.sourceDirnSegs = sourceMapData.directions.route.length - 1
    }

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

  /**
    * Hide the animated loading dots.
    */
  loaded = function (s) {
    const maplinkboxElem = document.getElementsByClassName('loading')[0]
    maplinkboxElem.style.display = 'none'
    const sourceDescrElem = document.getElementById('sourceDescr')
    sourceDescrElem.style.display = 'block'
  }

  /**
   * Entry routine.
   *
   * Injects content scripts into the current tab (including the most important, the data
   * extractor), which reads data from the map service.
   * Then performs some auxiliary methods before executing the main method run() which
   * generates all the links.
   */
  run = async function () {
    try {
      await this.validateCurrentTab()
      const [extractedData] = await Promise.all([this.listenForExtraction(), this.runExtraction()])
      const normalised = await this.normaliseExtractedData(extractedData)
      const countryCodeAdded = await this.getCountryCode(normalised)
      const outputsConstructed = await this.constructOutputs(countryCodeAdded)
      await this.loaded(outputsConstructed)
    } catch (err) {
      this.handleNoCoords(err)
    }
  }
}

function runMapSwitcher() {
  const mapSwitcher = new MapSwitcher
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
