/* global
  browser, chrome, Blob,
  jQuery, $,
  OutputMaps,
  ScriptExecution,
  codegrid, jsonWorldGrid
  CoordTransform, OsGridRef */

/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if (typeof browser === 'undefined') {
  browser = chrome // eslint-disable-line no-global-assign
}

/**
 * CodeGrid is a service for identifying the country within which a coordinate
 * falls. The first-level identification tiles are loaded client-side, so most
 * of the time, no further request is necessary. But in cases where the coordinate
 * is close to an international boundary, additional levels of tiles, with more
 * detail, are reqested from the specified host.
 */
const CodeGrid = codegrid.CodeGrid('http://www.loughrigg.org/codegrid-js/tiles/', jsonWorldGrid) // eslint-disable-line no-global-assign

/**
 * Sorts divs inside the element this is called on, based on the ascending numeric
 * value of their "data-sort" attribute.
 *
 * Divs with no such attribute specified are placed at the end of the list in
 * arbitrary order.
 */
jQuery.fn.sortDivs = function sortDivs () {
  $('> div', this[0]).sort(decSort).appendTo(this[0])
  function decSort (a, b) {
    if ($(a).data('sort') === 'undefined') { return 1 }
    if ($(b).data('sort') === 'undefined') { return -1 }
    return ($(b).data('sort')) < ($(a).data('sort')) ? 1 : -1
  }
}

/**
 * Main view object for the extension popup.
 */
var MapLinksView = {

  /** Number of direction segments in the source map data. */
  sourceDirnSegs: 0,

  /**
     * Returns the appropriate jquery selector for the given map service category,
     * based on the number of direction segments.
     *
     * @param {category} OutputMaps category for which the selector is requested.
     */
  getSelector: function (category) {
    if (OutputMaps.category.multidirns === category && this.sourceDirnSegs >= 2) {
      return '#multiSegDirns'
    } else if (OutputMaps.category.multidirns === category && this.sourceDirnSegs === 1) {
      return '#singleSegDirns'
    } else if (OutputMaps.category.singledirns === category && this.sourceDirnSegs > 0) {
      return '#singleSegDirns'
    } else if (OutputMaps.category.misc === category) {
      return '#misc'
    } else if (OutputMaps.category.special === category) {
      return '#special'
    } else {
      return '#noDirns'
    }
  },

  /**
     * Returns the section title for the given map service category, based
     * on the number of direction segments.
     *
     * @param {category} OutputMaps category for which the title is requested.
     */
  getTitle: function (category) {
    let title = ''
    switch (category) {
      case OutputMaps.category.multidirns:
        if (this.sourceDirnSegs >= 2) {
          title = 'Directions, full'
        } else {
          title = 'Directions'
        }
        break
      case OutputMaps.category.singledirns:
        if (this.sourceDirnSegs >= 2) {
          title = 'Directions, single segment only'
        } else {
          title = 'Directions'
        }
        break
      case OutputMaps.category.misc:
        title = 'Miscellaneous'
        break
      case OutputMaps.category.special:
        title = 'Special'
        break
      default:
        if (this.sourceDirnSegs >= 1) {
          title = 'Other Maps'
        } else {
          title = 'Map Services'
        }
        break
    }
    return title
  },

  /**
     * Adds links to a map service to a particular category
     *
     * @param {category} Category in which to add this map service.
     * @param {mapService} Object containing data about the particular map service.
     * @param {mapLinks} All the map links to be added.
     * @param {note} Content for an optional explanatory note.
     */
  addMapServiceLinks: function (category, mapService, mapLinks, note) {
    var thisView = this
    const selector = this.getSelector(category)

    if ($(selector).children().length === 0) {
      $(selector).append('<h4>' + this.getTitle(category) + '</h4>')
    }

    let prioDefaults = {}
    prioDefaults['prio/' + mapService.id] = mapService.prio !== undefined ? mapService.prio : 999

    browser.storage.local.get(prioDefaults, function (prio) {
      mapService.prio = prio['prio/' + mapService.id]

      $(selector).append(thisView.buildLineOfLinks(mapService.id,
        mapService,
        mapLinks,
        note))
      $(selector).sortDivs()

      if (note && note.length) {
        $('.linknote').tipsy({ gravity: 's', opacity: 1, fade: true })
      }
    })
  },

  addUtility: function (mapService, id, name) {
    // only add the title once
    const utilityElem = document.getElementById('utility')
    if (utilityElem.innerText.length === 0) {
      const title = document.createElement('h4')
      title.innerText = 'Utilities'
      utilityElem.appendChild(title)
    }

    // create div for mapService if not one already
    let mapServiceIdElem = document.getElementById(mapService.id)
    if (!mapServiceIdElem || mapServiceIdElem.innerText.length === 0) {
      utilityElem.insertAdjacentHTML('beforeend', "<div id='" + mapService.id +
        "' class='serviceLine' data-sort='" + mapService.prio + "'>" +
        '<span class="linkLineImg"><img src="../image/' + mapService.image + '"></span> ' +
        '<span class="serviceName">' + mapService.site + '</span></div>')
    }

    const linkHtml = " <a href='#' class=\"maplink\" id='" + id + "'>" + name + '</a>'
    // get it again (now that's it been created)
    mapServiceIdElem = document.getElementById(mapService.id)
    mapServiceIdElem.insertAdjacentHTML('beforeend', linkHtml)
  },

  /**
     * Adds links for file downloads (such as GPX)
     *
     * @param {mapService} Object containing data about the particular map service.
     * @param {id} Identifying string for this link.
     * @param {name} Display name for the link.
     * @param {fileGenerator} Function to invoke to create the file contents.
     */
  addFileDownload: function (mapService, id, name, fileGenerator) {
    this.addUtility(mapService, id, name)

    const idElem = document.getElementById(id)
    idElem.addEventListener('click', () => {
      const fileData = fileGenerator()
      const filename = fileData.name
      const contentBlob = new Blob([fileData.content], { type: fileData.type })
      const gpxURL = URL.createObjectURL(contentBlob)
      browser.downloads.download({
        url: gpxURL,
        filename: filename
      })
    })
  },

  addUtilityLink: function (mapService, id, name, utilFunction) {
    this.addUtility(mapService, id, name)

    const idElem = document.getElementById(id)
    idElem.addEventListener('click', utilFunction)
  },

  /**
     * Adds a note for a map service.
     *
     * @param {mapService} Object representing the map service.
     * @param {note} Text content of the note to be displayed.
     */
  addNote: function (mapService, note) {
    if (note && note.length) {
      const mapServiceIdElem = document.getElementById(mapService.id)
      mapServiceIdElem.innerHTML = ' ' +
        "<span class=linknote title='" + note + "'>" +
          '<svg viewBox="0 0 512 512">' +
            '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#sticky-note">' +
            '</use>' +
          '</svg>' +
        '</span>'
      $('.linknote').tipsy({ gravity: 's', opacity: 1, fade: true })
    }
  },

  /**
    * Utility function which builds the HTML for all the map links belonging to a specific
    * map service.
    *
    * @param {string} id - id for the main map service div.
    * @param {object} mapSite - the output object representing the map service
    * @param {object} links - the map links to add, containing URLs and names for each
    * @param {note} note - a note for this map service, if applicable
    * @return {string} the HTML for the line
    */
  buildLineOfLinks: function (id, mapSite, links, note) {
    let html = ''
    if (links) {
      html =
        "<div id='" + id + "' class='serviceLine' data-sort='" + mapSite.prio + "'>" +
        '<span class="linkLineImg"><img src="../image/' + mapSite.image + '"></span> ' +
        '<span class="serviceName">' + mapSite.site + '</span> '
      Object.keys(links).forEach(link => {
        html += '<a class="maplink" target="_blank" id="' +
          link + '" href="' +
          links[link].link + '">' +
          links[link].name + '</a> '
      })

      if (note && note.length) {
        html +=
        "<span class=linknote title='" + note + "'>" +
          '<svg viewBox="0 0 512 512">' +
            '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#sticky-note">' +
            '</use>' +
          '</svg>' +
        '</span>'
      }
      html += '</div>'
    }
    return html
  }

}

var MapSwitcher = {

  /**
     * Checks if we should continue attempting to extract data from the current tab.
     *
     * @return Promise which fulfils if OK to continue, otherwise rejects.
     */
  validateCurrentTab: function () {
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
  },

  /**
     * Runs the content scripts which handle the extraction of coordinate data from the current tab.
     *
     * @return Promise which fulfils when complete
     */
  runExtraction: function () {
    return new Promise(function (resolve) {
      new ScriptExecution().executeScripts(
        '/vendor/google-maps-data-parameter-parser/src/googleMapsDataParameter.js',
        '/src/mapUtil.js',
        '/src/dataExtractor.js')
      resolve()
    })
  },

  /**
     * Sets up message listener to receive results from content script
     *
     * @return Promise which fulfils with the source map data
     */
  listenForExtraction: function () {
    return new Promise(function (resolve) {
      browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        resolve(request.sourceMapData)
      })
    })
  },

  /**
    * Put the extracted data in a standard format, and perform any necessary checks
    * to ensure the extracted data object is suitable for output use.
    *
    * The main functionality is to convert from unusual coordinate systems to WGS84.
    *
    * @param {object} extractedData - Data object extracted by the dataExtractor.
    * @return Promise which resolves if the data can be normalised, or rejects if not.
    */
  normaliseExtractedData: function (extractedData) {
    return new Promise(function (resolve, reject) {
      if (!extractedData) {
        return reject(extractedData)
      }

      if (extractedData.centreCoords) {
        // regular wgs84 coords extracted
        resolve(extractedData)
      } else if (extractedData.osgbCentreCoords) {
        // osgb36 coords specified
        var osGR = new OsGridRef(extractedData.osgbCentreCoords.e,
          extractedData.osgbCentreCoords.n)
        var osLL = OsGridRef.osGridToLatLong(osGR)
        var wgs84LL = CoordTransform.convertOSGB36toWGS84(osLL)
        extractedData.centreCoords = {
          'lat': wgs84LL._lat,
          'lng': wgs84LL._lon
        }
        resolve(extractedData)
      } else if (extractedData.lambertCentreCoords) {
        // Lambert Conic Conformal coords specified
        const request = new window.Request(`http://www.loughrigg.org/wgs84Lambert/lambert_wgs84/${extractedData.lambertCentreCoords.e}/${extractedData.lambertCentreCoords.n}`)
        window.fetch(request)
          .then(response => response.json())
          .then(latlng => {
            extractedData.centreCoords = {
              'lat': latlng.lat,
              'lng': latlng.lng
            }
            resolve(extractedData)
          })
          .catch(() => {
            reject(extractedData)
          })
      } else {
        // no centre coords of any recognised format
        reject(extractedData)
      }
    })
  },

  /**
    * Gets the two letter country code for the current location of the map shown
    * in the current tab. If the country code can be found, it is stored in the
    * extracted data object passed as argument.
    *
    * @param {object} extractedData - Data object extracted by the dataExtractor.
    * @return Promise which resolves on success with the extracted data object.
    */
  getCountryCode: function (extractedData) {
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
  },

  /**
    * Handles cases where no coordinates are available from the page, or another problem
    * has occured.
    *
    * @param {object} sourceMapData - Data object extracted by the dataExtractor.
    */
  handleNoCoords: function (sourceMapData) {
    const nomapElem = document.getElementById('nomap')
    nomapElem.style.display = 'block'
    const maplinkboxElem = document.getElementById('maplinkbox')
    maplinkboxElem.style.display = 'none'
  },

  /**
    * Constructs the outputs to be shown in the extension popup.
    *
    * Run once the dataExtractor has been executed on the current tab.
    * Iterates throught the map services to request them to generate their links.
    *
    * @param sourceMapData
    */
  constructOutputs: function (sourceMapData) {
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
      MapLinksView.sourceDirnSegs = sourceMapData.directions.route.length - 1
    }

    for (let outputMapService of OutputMaps.services) {
      (function (outputMapService) { // dummy immediately executed fn to save variables
        let mapOptDefaults = {}
        mapOptDefaults[outputMapService.id] = true

        browser.storage.local.get(mapOptDefaults, function (options) {
          if (options[outputMapService.id]) {
            outputMapService.generate(sourceMapData, MapLinksView)
          }
        })
      })(outputMapService)
    }
  },

  /**
    * Hide the animated loading dots.
    */
  loaded: function (s) {
    const maplinkboxElem = document.getElementsByClassName('loading')[0]
    maplinkboxElem.style.display = 'none'
    const sourceDescrElem = document.getElementById('sourceDescr')
    sourceDescrElem.style.display = 'block'
  }
}

/**
 * Entry routine.
 *
 * Injects content scripts into the current tab (including the most important, the data
 * extractor), which reads data from the map service.
 * Then performs some auxiliary methods before executing the main method run() which
 * generates all the links.
 */
function runMapSwitcher () {
  MapSwitcher.validateCurrentTab().then(function () {
    Promise.all([MapSwitcher.listenForExtraction(), MapSwitcher.runExtraction()])
    // s[0] refers to the source map data received from the dataExtractor script
      .then(s => s[0])
    // the following functions use the extracted source map data to build the view
      .then(s => MapSwitcher.normaliseExtractedData(s))
      .then(s => MapSwitcher.getCountryCode(s))
      .then(s => MapSwitcher.constructOutputs(s))
      .then(s => MapSwitcher.loaded(s))
      .catch(s => (MapSwitcher.handleNoCoords(s)))
  }, function () {
    MapSwitcher.handleNoCoords()
  })
}

if (
  document.readyState === 'complete' ||
    (document.readyState !== 'loading' && !document.documentElement.doScroll)
) {
  runMapSwitcher()
} else {
  document.addEventListener('DOMContentLoaded', runMapSwitcher)
}
