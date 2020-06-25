/* global
  browser, chrome,
  XPathResult,
  calculateResolutionFromScale,
  calculateResolutionFromStdZoom,
  getDistanceFromLatLonInKm,
  Gmdp, GmdpException */

// All the extractors are in one file to simplify loading content scripts.
// Maybe in future there'll be a build stage (webpack or whatever) to combine
// individual source files for each extractor.

// The Web Extension API is implemented on different root objects in different browsers.
// Firefox uses 'browser'. Chrome uses 'chrome'.
// Check here and use a common 'browserRoot' everywhere.
// Use 'var' rather than 'let' to avoid already-declared errors
// due to this file being executed as a content script.
var browserRoot
if (chrome && chrome.runtime) {
  browserRoot = chrome // eslint-disable-line no-global-assign
} else {
  browserRoot = browser // eslint-disable-line no-global-assign
}

var extractors = []

extractors.push({
  host: '.google.',
  extract:
    function (resolve, reject) {
      function customMap () {
        let sourceMapData = {}
        const customCoordsRe = /ll=([-0-9.]+)%2C([-0-9.]+)/
        const coordArray = window.location.search.match(customCoordsRe)
        const customZoomRe = /z=([0-9.]+)/
        const zoomArray = window.location.search.match(customZoomRe)
        if (coordArray && coordArray.length > 2 && zoomArray && zoomArray.length > 1) {
          sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
          sourceMapData.resolution =
            calculateResolutionFromStdZoom(zoomArray[1], coordArray[1])
        }
        resolve(sourceMapData)
      }

      function regularMap () {
        let sourceMapData = {}
        const re2 = /@([-0-9.]+),([-0-9.]+),([0-9.]+)([a-z])/
        const coordArray2 = window.location.pathname.match(re2)
        if (coordArray2 && coordArray2.length >= 3) {
          sourceMapData.centreCoords = { lat: coordArray2[1], lng: coordArray2[2] }
        }
        if (coordArray2 && coordArray2.length >= 5) {
          if (coordArray2[4] === 'z') {
            sourceMapData.resolution =
              calculateResolutionFromStdZoom(coordArray2[3], coordArray2[1])
          } else if (coordArray2[4] === 'm') {
            // on google satellite / earth, the zoom is specified in the URL not
            // as the standard 'z' value but as an m value, which is the height in
            // metres of the map displayed in the map window.
            // (i.e. if you resize the window, you'll see the URL updated accordingly)
            sourceMapData.resolution = coordArray2[3] / document.body.offsetHeight
          }
        }

        // google maps URLs have route waypoints specified in two different places

        // first we look for the 'dir' waypoints
        // these are where any named addresses will be (but maybe coords too)
        const re3 = /dir\/(([-A-Za-z0-9%'+,!$_.*()]+\/){2,})@/
        const wholeRouteArray = window.location.pathname.match(re3)
        if (wholeRouteArray && wholeRouteArray.length > 1) {
          sourceMapData.directions = {}
          sourceMapData.directions.route = []
          for (let arrWpt of wholeRouteArray[1].split('/')) {
            if (arrWpt.length > 0) {
              var wptObj = { address: arrWpt }
              // check if the address looks like a coordinate
              // if so, we put it in the coords sub-object too
              const coordRe = /([-0-9.]+),[+]?([-0-9.]+)/
              var addrIsCoordArr = arrWpt.match(coordRe)
              if (addrIsCoordArr && addrIsCoordArr.length > 2) {
                wptObj.coords = { lat: addrIsCoordArr[1], lng: addrIsCoordArr[2] }
              }
              sourceMapData.directions.route.push(wptObj)
            }
          }
        }

        // we expect to have sub-objects for each waypoint now
        // But some of them may only have addresses, not coordinates.
        // So we must parse the data part of the URL to find the coords.
        try {
          const gmdp = new Gmdp(window.location.href)
          const gmdpRoute = gmdp.getRoute()
          let mapDataWptIndex = 0 // index into sourceMapData wpts
          // FIXME we should do a count here - number of gmdp primary wpts should be equal to
          // number of sourceMapData wpts
          for (let gmdpWpt of gmdpRoute.getAllWaypoints()) {
            if (gmdpWpt.primary) {
              var mapDataWptCoords = sourceMapData.directions.route[mapDataWptIndex].coords
              // if coords are not yet specified, insert them
              // - but don't overwrite them if they're already there
              if ((!mapDataWptCoords) ||
                            (mapDataWptCoords.lat === undefined) ||
                            (mapDataWptCoords === undefined)) {
                sourceMapData.directions.route[mapDataWptIndex].coords =
                                    { lat: gmdpWpt.lat, lng: gmdpWpt.lng }
              }
              mapDataWptIndex++
            } else {
              var newSecondaryWpt =
                            { coords: { lat: gmdpWpt.lat, lng: gmdpWpt.lng } }
              sourceMapData.directions.route.splice(mapDataWptIndex, 0, newSecondaryWpt)
              mapDataWptIndex++
            }
          }

          sourceMapData.directions.mode = gmdpRoute.getTransportation()
        } catch (ex) {
          if (ex instanceof GmdpException) {
            // console.log(ex);
          }
        } finally {
          resolve(sourceMapData)
        }
      }

      // when a single matching search result is found
      function searchResultsMap () {
        const re = /&rllag=([-0-9]+),([-0-9]+)/
        const coordArray = window.location.hash.match(re)
        if (coordArray && coordArray.length > 2) {
          resolve({
            centreCoords: { lat: coordArray[1] / 1000000, lng: coordArray[2] / 1000000 },
            locationDescr: 'default map of search results',
            nonUpdating: window.location.hostname + window.location.pathname
          })
        }

        // when a map of multiple possible results shows on the search page
        const anchors = document.querySelector('#search').querySelectorAll('a')
        for (const anchor of anchors) {
          if (anchor.href.indexOf('https://www.google.com') === 0) {
            const firstAhrefRe = /rllag=([-0-9]+),([-0-9]+),([-0-9]+)/
            const firstAhrefArr = anchor.href.match(firstAhrefRe)
            if (firstAhrefArr && firstAhrefArr.length > 3) {
              const centreLat = firstAhrefArr[1] / 1000000
              const centreLng = firstAhrefArr[2] / 1000000
              const zoomMPP = firstAhrefArr[3] / 100
              return resolve({
                centreCoords: { lat: centreLat, lng: centreLng },
                locationDescr: 'map of search results',
                resolution: zoomMPP
              })
            }
          }
        }

        // probably the first one ([0]) will be the one of the map at the top of the column
        const dataUrl = document.querySelectorAll('.rhscol a[data-url]')[0].attributes['data-url'].value
        const dataUrlRe = /@([-0-9.]+),([-0-9.]+),([0-9]+)z/
        const dataUrlCoordArray = dataUrl.match(dataUrlRe)
        if (dataUrlCoordArray && dataUrlCoordArray.length > 3) {
          resolve({
            centreCoords: { lat: dataUrlCoordArray[1], lng: dataUrlCoordArray[2] },
            locationDescr: 'map of primary search result',
            resolution: calculateResolutionFromStdZoom(
              dataUrlCoordArray[3], dataUrlCoordArray[1])
          })
        } else {
          // sometimes the url will not contain lat/lng
          // instead there's a hex id (whose interpretation is unknown)
          // so instead we'll pass the location
          const dataUrlPlaceRe = /\/maps\/place\/([^/]+)\//
          const dataUrlPlaceArray = dataUrl.match(dataUrlPlaceRe)

          if (dataUrlPlaceArray && dataUrlPlaceArray.length > 1) {
            resolve({
              googlePlace: dataUrlPlaceArray[1],
              locationDescr: 'named search location'
            })
          }
        }

        resolve(null)
      }

      // search results 'map' page (click through from search with multiple results)
      function multipleSearchResultsMap () {
        // when initial map is shown, coords give the bounds of a box containing all search results
        const initialRe = /mv:\[\[([-0-9.]+),([-0-9.]+)\],\[([-0-9.]+),([-0-9.]+)\]\]/
        const initialArray = window.location.hash.match(initialRe)

        // after moving, centre coords + zoom are given too
        const movedRe = /mv:\[\[([-0-9.]+),([-0-9.]+)\],\[([-0-9.]+),([-0-9.]+)\],[a-zA-Z0-9_]+,\[([-0-9.]+),([-0-9.]+)\],([0-9]+)\]/
        const movedArray = window.location.hash.match(movedRe)

        if (movedArray && movedArray.length > 7) {
          resolve({
            centreCoords: { lat: movedArray[5], lng: movedArray[6] },
            locationDescr: 'displayed (repositioned) map',
            resolution: calculateResolutionFromStdZoom(
              movedArray[7], movedArray[5])
          })
        } else if (initialArray && initialArray.length > 4) {
          const [maxLat, maxLng, minLat, minLng] = initialArray.slice(1)
          const centreLat = (+maxLat + +minLat) / 2
          const centreLng = (+maxLng + +minLng) / 2

          const vert = getDistanceFromLatLonInKm(maxLat, centreLng, minLat, centreLng)
          const horiz = getDistanceFromLatLonInKm(centreLat, minLng, centreLat, maxLng)

          const mapdiv = document.querySelector('.rhscol')
          const vertMetresPerPixel = vert * 1000 / +mapdiv.clientHeight
          const horizMetresPerPixel = horiz * 1000 / +mapdiv.clientWidth

          const maxMPP = vertMetresPerPixel > horizMetresPerPixel ? vertMetresPerPixel : horizMetresPerPixel

          // use max mpp, adjusted a bit to approximate typical map shown (exact determination of this is unknown)
          const resnMPP = maxMPP * 1.2

          resolve({
            centreCoords: { lat: centreLat, lng: centreLng },
            locationDescr: 'search results map',
            resolution: resnMPP
          })
        }
      }

      if (window.location.pathname === '/maps/d/viewer') {
        customMap()
      } else if (window.location.pathname.indexOf('/maps/') === 0) {
        regularMap()
      } else if ((window.location.pathname.indexOf('/search') === 0) &&
                (window.location.hash.length > 0)) {
        multipleSearchResultsMap()
      } else if ((window.location.pathname.indexOf('/search') === 0) ||
                (window.location.pathname.indexOf('/webhp') === 0)) {
        searchResultsMap()
      } else {
        reject(null)
      }
    }
})

extractors.push({
  host: '.bing.',
  extract:
    function (resolve, reject) {
      let sourceMapData = {}
      // if there's no 'state', it means no scrolling has happened yet.
      // So we should extract the lat and lng from the window.location parameter
      if (window.history && !window.history.state) {
        const re1 = /cp=([-0-9.]+)~([-0-9.]+)/
        const coordArray = window.location.search.match(re1)

        if (coordArray && coordArray.length >= 3) {
          sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
        }
        const re2 = /lvl=([0-9]+)/
        const levelArray = window.location.search.match(re2)
        if (levelArray && levelArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(
            levelArray[1], sourceMapData.centreCoords.lat)
        }
      } else {
        // scrolling has happened, but bing doesn't update its URL. So we pull
        // the coords from the'MapModeStateHistory'

        // MapModeStateHistory broke - so we assume it may be in one of two locations
        let mapModeStateHistory
        if (window.history.state && window.history.state.MapModeStateHistory) {
          mapModeStateHistory = window.history.state.MapModeStateHistory
        } else if (window.history.state.state && window.history.state.state.MapModeStateHistory) {
          mapModeStateHistory = window.history.state.state.MapModeStateHistory
        }
        if (!mapModeStateHistory) {
          reject()
        }

        sourceMapData.centreCoords = {
          lat: mapModeStateHistory.centerPoint.latitude, lng: mapModeStateHistory.centerPoint.longitude }

        const level = mapModeStateHistory.level
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          level, sourceMapData.centreCoords.lat)
      }

      const directionsPanelRoot = document.evaluate('//*[@id="directionsPanelRoot"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      if (directionsPanelRoot.singleNodeValue &&
        directionsPanelRoot.singleNodeValue.children.length) {
        // we expect a single 'From' input, followed by one or more 'To' inputs
        const routeFrom = document.evaluate('//*[@class="dirWaypoints"]//input[contains(@title, "From")]',
          directionsPanelRoot.singleNodeValue, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
        sourceMapData.directions = {
          route: [ { address: routeFrom } ]
        }
        const routeTo = document.evaluate('//*[@class="dirWaypoints"]//input[contains(@title, "To")]',
          directionsPanelRoot.singleNodeValue, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)

        let routeToWpts
        while ((routeToWpts = routeTo.iterateNext())) {
          sourceMapData.directions.route.push({ address: routeToWpts.value })
        }

        const re3 = /([-0-9.]+)[ ]*,[ ]*([-0-9.]+)/
        for (let rteWptIndex in sourceMapData.directions.route) {
          let wptArray =
            sourceMapData.directions.route[rteWptIndex].address.match(re3)
          if (wptArray && wptArray.length > 2) {
            sourceMapData.directions.route[rteWptIndex].coords =
              { lat: wptArray[1], lng: wptArray[2] }
          }
        }

        const dirBtnSelected = document.evaluate('//*[contains(@class, "dirBtnSelected")]',
          directionsPanelRoot.singleNodeValue, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        switch (dirBtnSelected.singleNodeValue.classList[0]) {
          case 'dirBtnDrive':
            sourceMapData.directions.mode = 'car'
            break
          case 'dirBtnTransit':
            sourceMapData.directions.mode = 'transit'
            break
          case 'dirBtnWalk':
            sourceMapData.directions.mode = 'foot'
            break
        }
      }

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'openstreetmap.',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re1 = /map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
      const coordArray = window.location.hash.match(re1)
      if (coordArray && coordArray.length >= 4) {
        sourceMapData.centreCoords = { lat: coordArray[2], lng: coordArray[3] }
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          coordArray[1], sourceMapData.centreCoords.lat)
      }

      const re2 = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/
      const routeCoordsArray = window.location.search.match(re2)

      if (routeCoordsArray && routeCoordsArray.length > 4) {
        const routeFrom = document.evaluate('//*[@id="route_from"]',
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
        const routeTo = document.evaluate('//*[@id="route_to"]',
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
        sourceMapData.directions = {
          route: [
            { address: routeFrom },
            { address: routeTo }
          ]
        }

        sourceMapData.directions.route[0].coords =
          { lat: routeCoordsArray[1],
            lng: routeCoordsArray[2] }
        sourceMapData.directions.route[1].coords =
          { lat: routeCoordsArray[3],
            lng: routeCoordsArray[4] }
      }

      const re3 = /engine=[a-zA-Z_]+_([a-z]+)&/
      const modeArray = window.location.search.match(re3)

      if (modeArray && modeArray.length > 1) {
        switch (modeArray[1]) {
          case 'bicycle':
            sourceMapData.directions.mode = 'bike'
            break
          case 'car':
            sourceMapData.directions.mode = 'car'
            break
          case 'foot':
            sourceMapData.directions.mode = 'foot'
            break
        }
      }

      // sometimes (eg. after a search?) osm has directions but no centre coords
      if (!sourceMapData.centreCoords &&
          sourceMapData.directions.route.length >= 2) {
        const calcCentreLat = (+sourceMapData.directions.route[0].coords.lat +
          +sourceMapData.directions.route[1].coords.lat) / 2
        const calcCentreLng = (+sourceMapData.directions.route[0].coords.lng +
          +sourceMapData.directions.route[1].coords.lng) / 2
        sourceMapData.centreCoords = {
          lat: calcCentreLat,
          lng: calcCentreLng
        }
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          8, calcCentreLat)
      }

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'tools.wmflabs.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const reCoordsD = /params=([-0-9.]+)_([NS])_([-0-9.]+)_([EW])/
      const reCoordsDM = /params=([0-9]+)_([0-9.]+)_([NS])_([0-9]+)_([0-9.]+)_([EW])/
      const reCoordsDMS = /params=([0-9]+)_([0-9]+)_([0-9.]+)_([NS])_([0-9]+)_([0-9]+)_([0-9.]+)_([EW])/
      const coordArrayD = window.location.search.match(reCoordsD)
      const coordArrayDM = window.location.search.match(reCoordsDM)
      const coordArrayDMS = window.location.search.match(reCoordsDMS)
      if (coordArrayD && coordArrayD.length >= 5) {
        const lat = +coordArrayD[1]
        const lng = +coordArrayD[3]
        sourceMapData.centreCoords = {
          lat: coordArrayD[2] === 'N' ? lat : -lat,
          lng: coordArrayD[4] === 'E' ? lng : -lng
        }
      } else if (coordArrayDM && coordArrayDM.length >= 7) {
        const lat = +coordArrayDM[1] + coordArrayDM[2] / 60
        const lng = +coordArrayDM[4] + coordArrayDM[5] / 60
        sourceMapData.centreCoords = {
          lat: coordArrayDM[3] === 'N' ? lat : -lat,
          lng: coordArrayDM[6] === 'E' ? lng : -lng
        }
      } else if (coordArrayDMS && coordArrayDMS.length >= 9) {
        const lat = +coordArrayDMS[1] + coordArrayDMS[2] / 60 + coordArrayDMS[3] / 3600
        const lng = +coordArrayDMS[5] + coordArrayDMS[6] / 60 + coordArrayDMS[7] / 3600
        sourceMapData.centreCoords = {
          lat: coordArrayDMS[4] === 'N' ? lat : -lat,
          lng: coordArrayDMS[8] === 'E' ? lng : -lng
        }
      }
      sourceMapData.resolution = 12
      const urlScaleArray = window.location.search.match(/scale:([0-9]+)/)
      if (urlScaleArray && urlScaleArray.length > 1) {
        sourceMapData.resolution = calculateResolutionFromScale(urlScaleArray[1])
      }
      sourceMapData.locationDescr = 'primary page coordinates'
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'geocaching.',
  extract:
    function (resolve) {
      let sourceMapData = {}
      if (window.location.pathname.indexOf('/map/') >= 0) {
        const re1 = /ll=([-0-9.]+),([-0-9.]+)&z=([0-9.]+)/
        let coordArray = window.location.hash.match(re1)
        if (coordArray && coordArray.length > 3) {
          sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
          sourceMapData.resolution =
            calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
        }
        const re2 = /lat=([-0-9.]+)&lng=([-0-9.]+)&zoom=([0-9.]+)/
        coordArray = window.location.search.match(re2)
        if (coordArray && coordArray.length > 3) {
          sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
          sourceMapData.resolution =
            calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
        }
      } else if (window.location.pathname.indexOf('/geocache/') === 0) {
        const dmLatLng = document.getElementById('uxLatLon').innerText
        const re3 = /([NS])\s+([0-9]+)[^0-9]\s+([0-9.]+)\s+([EW])\s+([0-9]+)[^0-9]\s+([0-9.]+)/
        const dmCoordArray = dmLatLng.match(re3)
        if (dmCoordArray && dmCoordArray.length > 6) {
          let lat = parseInt(dmCoordArray[2]) + (dmCoordArray[3] / 60)
          let lng = parseInt(dmCoordArray[5]) + (dmCoordArray[6] / 60)
          if (dmCoordArray[1] === 'S') {
            lat = -lat
          }
          if (dmCoordArray[4] === 'W') {
            lng = -lng
          }
          Object.assign(sourceMapData, {
            centreCoords: { lat, lng },
            resolution: calculateResolutionFromStdZoom(15, lat),
            locationDescr: 'primary geocache coordinates'
          })
        }
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'wikimapia.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re1 = /&lat=([-0-9.]+)&lon=([-0-9.]+)&/
      const coordArray = window.location.hash.match(re1)
      if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
      }
      const re2 = /z=([0-9]+)/
      const zoomArray = window.location.hash.match(re2)
      if (zoomArray && zoomArray.length > 1) {
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          zoomArray[1], sourceMapData.centreCoords.lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'waze.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const centrePermalink = document.evaluate('//*[@class="wm-permalink-control__link"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href

      const lonArray = centrePermalink.match(/lon=([-0-9.]+)/)
      const latArray = centrePermalink.match(/lat=([-0-9.]+)/)
      if (lonArray && lonArray.length > 1 && latArray && latArray.length > 1) {
        sourceMapData.centreCoords = { lat: latArray[1], lng: lonArray[1] }
        const zoomArray = centrePermalink.match(/zoom=([0-9]+)/)
        if (zoomArray && zoomArray.length > 1) {
          sourceMapData.resolution =
            calculateResolutionFromStdZoom(zoomArray[1], latArray[1])
        }
      }

      const re2 = /from_lat=([-0-9.]+)&from_lon=([-0-9.]+)&to_lat=([-0-9.]+)&to_lon=([-0-9.]+)/
      const routeCoordsArray = centrePermalink.match(re2)
      if (routeCoordsArray && routeCoordsArray.length > 4) {
        sourceMapData.directions = {
          route: [
            {
              coords: { lat: routeCoordsArray[1],
                lng: routeCoordsArray[2] }
            },
            {
              coords: { lat: routeCoordsArray[3],
                lng: routeCoordsArray[4] }
            }
          ]
        }
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'openseamap.',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const centrePermalink = document.evaluate('//*[@id="OpenLayers_Control_Permalink_13"]//a/@href',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
      const re = /lat=([-0-9.]+)&lon=([-0-9.]+)/
      const coordArray = centrePermalink.match(re)
      if (coordArray && coordArray.length > 2) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
      }
      const re2 = /zoom=([0-9]+)/
      const zoomArray = centrePermalink.match(re2)
      if (zoomArray && zoomArray.length > 1) {
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          zoomArray[1], sourceMapData.centreCoords.lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'wego.here.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /map=([-0-9.]+),([-0-9.]+),([0-9]+),/
      const coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          coordArray[3], sourceMapData.centreCoords.lat)
      }

      // check if pathname contains directions
      let state = -1
      for (let directions of window.location.pathname.split('/')) {
        if (state < 0) {
          if (directions === 'directions') {
            sourceMapData.directions = {}
            state = 0
          }
        } else if (state === 0) {
          switch (directions) {
            case 'mix':
              break
            case 'walk':
              sourceMapData.directions.mode = 'foot'
              break
            case 'bicycle':
              sourceMapData.directions.mode = 'bike'
              break
            case 'drive':
              sourceMapData.directions.mode = 'car'
              break
            case 'publicTransport':
              sourceMapData.directions.mode = 'transit'
              break
          }
          state = 1
          sourceMapData.directions.route = []
        } else if (state > 0) {
          let wptObj
          const re1 = /^([^:]+):/
          const addrArray = directions.match(re1)
          if (addrArray && addrArray.length > 1) {
            const addr = addrArray[1].replace(/-/g, ' ')
            wptObj = { address: addr }

            const re2 = /:loc-([^:]+)/
            const dirArray = directions.match(re2)
            if (dirArray && dirArray.length > 1) {
              const locnFromB64 = window.atob(dirArray[1])
              const re3 = /lat=([-0-9.]+);lon=([-0-9.]+)/
              const coordsArr = locnFromB64.match(re3)
              if (coordsArr.length > 2) {
                wptObj.coords = { lat: coordsArr[1], lng: coordsArr[2] }
              }
            }
            const re4 = /:([-0-9.]+),([-0-9.]+)/
            const coordsArray = directions.match(re4)
            if (coordsArray && coordsArray.length > 2) {
              wptObj.coords =
                            { lat: coordsArray[1], lng: coordsArray[2] }
            }
          }
          sourceMapData.directions.route.push(wptObj)
        }
      }
      if (sourceMapData.directions && sourceMapData.directions.route) {
        for (let wptIndex in sourceMapData.directions.route) {
          // URL can contain empty waypoints, when locations have not yet been entered
          // into the search box. So we need to do a bit of clean-up.
          if (undefined === sourceMapData.directions.route[wptIndex]) {
            sourceMapData.directions.route.splice(wptIndex, 1)
          }
        }
        if (sourceMapData.directions.route.length < 2) {
          // if directions don't contain at least two points, they are considered invalid
          delete sourceMapData.directions
        }
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'streetmap.co.uk',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const urlToShare = document.evaluate('//*[@id="LinkToInput"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
      const re1 = /X=([0-9]+)&Y=([0-9]+)/
      const osCoordArray = urlToShare.match(re1)
      if (osCoordArray && osCoordArray.length > 2) {
        sourceMapData.osgbCentreCoords = { e: osCoordArray[1], n: osCoordArray[2] }
      }
      const re2 = /Z=([0-9]+)/
      const zoomArray = urlToShare.match(re2)
      if (zoomArray && zoomArray.length > 1) {
        let scale = 50000
        switch (zoomArray[1]) {
          case '106':
            scale = 2500
            break
          case '110':
            scale = 5000
            break
          case '115':
            scale = 25000
            break
          case '120':
            scale = 50000
            break
          case '126':
            scale = 100000
            break
          case '130':
            scale = 200000
            break
          case '140':
            scale = 500000
            break
          case '150':
            scale = 1000000
            break
        }
        sourceMapData.resolution = calculateResolutionFromScale(scale)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'maps.stamen.com',
  extract:
    function (resolve, reject) {
      const re = /#[a-zA-Z]*\/?([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        resolve({
          centreCoords: { lat: coordArray[2], lng: coordArray[3] },
          resolution: calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
        })
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'www.gpxeditor.co.uk',
  extract:
    function (resolve, reject) {
      const re = /location=([-0-9.]+),([-0-9.]+)&zoom=([0-9]+)/
      const coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 3) {
        resolve({
          centreCoords: { lat: coordArray[1], lng: coordArray[2] },
          resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
          nonUpdating: window.location.hostname,
          locationDescr: 'non-updating URL'
        })
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'wma.wmflabs.org',
  extract:
    function (resolve, reject) {
      const re = /\?(?:wma=)?([-0-9.]+)_([-0-9.]+)_[0-9]+_[0-9]+_[a-z]{0,3}_([0-9]+)/
      const coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 3) {
        resolve({
          centreCoords: { lat: coordArray[1], lng: coordArray[2] },
          resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
          nonUpdating: window.location.hostname,
          locationDescr: 'non-updating URL'
        })
      } else {
        reject()
      }
    }
})

extractors.push({
  host: '.topozone.com',
  extract:
    function (resolve, reject) {
      const re = /lat=([-0-9.]+)&lon=([-0-9.]+)/
      const coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 2) {
        let sourceMapData = {
          centreCoords: { lat: coordArray[1], lng: coordArray[2] },
          nonUpdating: window.location.hostname,
          locationDescr: 'non-updating URL'
        }
        const zoomArray = window.location.search.match(/zoom=([0-9]+)/)
        if (zoomArray && zoomArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[1])
        }
        resolve(sourceMapData)
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'suncalc.net',
  extract:
    function (resolve, reject) {
      const re = /#\/([-0-9.]+),([-0-9.]+),([0-9]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length >= 3) {
        resolve({
          centreCoords: { lat: coordArray[1], lng: coordArray[2] },
          resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
          locationDescr: 'current pin location'
        })
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'suncalc.org',
  extract:
    function (resolve, reject) {
      const re = /#\/([-0-9.]+),([-0-9.]+),([0-9]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length >= 3) {
        resolve({
          centreCoords: { lat: coordArray[1], lng: coordArray[2] },
          resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
          locationDescr: 'current pin location'
        })
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'sysmaps.co.uk',
  extract:
    function (resolve, reject) {
      function inDom () {
        try {
          const locationText = document.evaluate('//*[@class="style1"][contains(text(),"Map Centre")]',
            document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
          const re = /East: ([0-9.]+) : North: ([0-9.]+)/
          const mapCentreArr = locationText.match(re)
          if (mapCentreArr && mapCentreArr.length > 2) {
            const sourceMapData = {
              osgbCentreCoords: { e: mapCentreArr[1], n: mapCentreArr[2] },
              locationDescr: 'map centre'
            }
            resolve(sourceMapData)
            return true
          }
        } catch (err) {
        }
        return false
      }

      function inLocationSearch () {
        const re = /!([-0-9.]+)~([-0-9.]+)/
        const mapCentreArr = window.location.search.match(re)
        if (mapCentreArr && mapCentreArr.length > 2) {
          resolve({
            centreCoords: { lat: mapCentreArr[1], lng: mapCentreArr[2] },
            nonUpdating: window.location.hostname,
            locationDescr: 'non-updating URL'
          })
          return true
        }
      }

      if (window.location.pathname.indexOf('/sysmaps_os.html') === 0) {
        if (inDom()) { return }
      }

      if (inLocationSearch()) { return }

      reject()
    }
})

extractors.push({
  host: 'wikipedia.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const geo = document.evaluate('//*[@id="coordinates"]//*[@class="geo"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
      const coordArray = geo.split(';')
      if (coordArray.length === 2) {
        sourceMapData.centreCoords = { lat: coordArray[0].trim(), lng: coordArray[1].trim() }
        sourceMapData.locationDescr = 'primary article coordinates'
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'opencyclemap.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const href = document.evaluate('//*[@id="permalink"]/@href',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
      const re = /zoom=([0-9]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/
      const dataArray = href.match(re)
      if (dataArray && dataArray.length > 3) {
        sourceMapData.centreCoords = { lat: dataArray[2], lng: dataArray[3] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(dataArray[1], dataArray[2])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'facebook.com',
  extract:
    function (resolve) {
      let sourceMapData = {}

      // we rely on this obfuscated class name continuing to be used
      const mapImages = document.evaluate('//*[@class="_a3f img"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

      if (mapImages && mapImages.currentSrc && mapImages.currentSrc.length > 0) {
        const re1 = /markers=([-0-9.]+)%2C([-0-9.]+)/
        let coordArr = mapImages.currentSrc.match(re1)
        if (coordArr && coordArr.length > 2) {
          sourceMapData.centreCoords = { lat: coordArr[1], lng: coordArr[2] }
          const zoomRe = /zoom=([0-9]+)/
          const zoomArr = mapImages.currentSrc.match(zoomRe)
          if (zoomArr && zoomArr.length > 1) {
            sourceMapData.resolution =
              calculateResolutionFromStdZoom(zoomArr[1], coordArr[1])
          } else {
            // hacky way to find zoom for pages - could maybe use bounding box instead
            const zoomUrl = document.evaluate('//*[@class="_3n4p"]',
              document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
            const zoomArr = zoomUrl.getAttribute('ajaxify').match(zoomRe)
            if (zoomArr && zoomArr.length > 1) {
              sourceMapData.resolution =
                calculateResolutionFromStdZoom(zoomArr[1], coordArr[1])
            }
          }
        }
        sourceMapData.locationDescr = 'primary identified location'
      }

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'yandex.',
  extract:
    function (resolve, reject) {
      const coordRe = /ll=([-0-9.]+)%2C([-0-9.]+)/
      const coordArray = window.location.search.match(coordRe)
      if (coordArray && coordArray.length > 2) {
        let sourceMapData = {
          centreCoords: { lat: coordArray[2], lng: coordArray[1] }
        }
        const zoomArray = window.location.search.match(/z=([0-9]+)/)
        if (zoomArray && zoomArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[2])
        }
        const routeString = decodeURIComponent(window.location.search).match(/rtext=([-0-9.~,]+)/)
        if (routeString && routeString.length > 1) {
          sourceMapData.directions = {
            route: []
          }
          const routeCoordPairs = routeString[1].split('~')
          for (let coordPair of routeCoordPairs) {
            const [lat, lng] = coordPair.split(',')
            sourceMapData.directions.route.push({ coords: { lat, lng } })
          }
          const mode = window.location.search.match(/rtt=([a-z]+)/)
          if (mode && mode.length > 1) {
            switch (mode[1]) {
              case 'auto':
                sourceMapData.directions.mode = 'car'
                break
              case 'bc':
                sourceMapData.directions.mode = 'bike'
                break
              case 'pd':
                sourceMapData.directions.mode = 'foot'
                break
              case 'mt':
                sourceMapData.directions.mode = 'transit'
                break
            }
          }
        }
        resolve(sourceMapData)
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'caltopo.com',
  extract:
    function (resolve, reject) {
      const re = /ll=([-0-9.]+),([-0-9.]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 2) {
        let sourceMapData = {
          centreCoords: { lat: coordArray[1], lng: coordArray[2] },
          locationDescr: 'map centre specified in URL'
        }
        const zoomArray = window.location.hash.match(/z=([0-9]+)/)
        if (zoomArray && zoomArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[1])
        }
        resolve(sourceMapData)
      } else {
        reject()
      }
    }
})

extractors.push({
  host: 'strava.com',
  extract:
    function (resolve, reject) {
      function urlMethod () {
        const re = /#([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
        const coordArray = window.location.hash.match(re)
        if (coordArray && coordArray.length > 3) {
          resolve({
            centreCoords: { lat: coordArray[3], lng: coordArray[2] },
            resolution: calculateResolutionFromStdZoom(coordArray[1], coordArray[3])
          })
          return true
        }
      }
      if (urlMethod()) { return }

      function tileMethod () {
        const container = document.querySelector('.leaflet-container')
        if (!container) { return false }
        const containerRect = container.getBoundingClientRect()

        const tile = container.querySelector('.leaflet-tile')
        if (!tile) { return false }
        const tileRect = tile.getBoundingClientRect()

        const re = /tiles\/([0-9]+)\/([0-9]+)\/([0-9]+)/
        const coordArray = tile.src.match(re)
        if (!coordArray) { return false }
        const z = +coordArray[1]
        const tx = +coordArray[2]
        const ty = +coordArray[3]

        // tx & ty represent the top left of the tile. We now find the center of the map.
        const cx = tx + ((containerRect.left + containerRect.right) / 2 - tileRect.left) / tileRect.width
        const cy = ty + ((containerRect.top + containerRect.bottom) / 2 - tileRect.top) / tileRect.height
        const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (cy / 2 ** z)))) / Math.PI * 180
        const lng = (cx / 2 ** z) * 360 - 180
        resolve({
          centreCoords: { lat, lng },
          resolution: calculateResolutionFromStdZoom(z, lat)
        })
        return true
      }
      if (tileMethod()) { return }

      reject()
    }
})

extractors.push({
  host: 'f4map.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /#lat=([-0-9.]+)&lon=([-0-9.]+)&zoom=([0-9.]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'opentopomap.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /#map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[2], lng: coordArray[3] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'qwant.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /#map=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[2], lng: coordArray[3] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(+coordArray[1] + 1, coordArray[2])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'mapillary.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re1 = /lat=([-0-9.]+)&lng=([-0-9.]+)/
      const coordArray = window.location.search.match(re1)
      if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
      }
      const re2 = /z=([0-9]+)/
      const zoomArray = window.location.search.match(re2)
      if (zoomArray && zoomArray.length > 1) {
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          +zoomArray[1] + 1, sourceMapData.centreCoords.lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'komoot.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /@([-0-9.]+),([-0-9.]+),([0-9]+)z/
      const coordArray = window.location.pathname.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'waymarkedtrails.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /map=([0-9]+)!([-0-9.]+)!([-0-9.]+)/
      const coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[2], lng: coordArray[3] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'rightmove',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const latlon = document.evaluate('//script[contains(.,"postcode")  and contains(.,"location")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
      const lat = latlon.text.match(/.latitude.:([0-9.-]+)/)[1]
      const lon = latlon.text.match(/.longitude.:([0-9.-]+)/)[1]

      if (lat.length > 3 && lon.length > 3) {
        sourceMapData.centreCoords = { lat: lat, lng: lon }
      }
      sourceMapData.resolution = calculateResolutionFromStdZoom(
        17, sourceMapData.centreCoords.lat)

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'onthemarket',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const latlon = document.evaluate('//script[contains(.,"MEDIA_PREFIX")  and contains(.,"location")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
      const lat = latlon.text.match(/lat:[ ']+([0-9.-]+)/)[1]
      const lon = latlon.text.match(/lon:[ ']+([0-9.-]+)/)[1]

      if (lat.length > 3 && lon.length > 3) {
        sourceMapData.centreCoords = { lat: lat, lng: lon }
      }
      sourceMapData.resolution = calculateResolutionFromStdZoom(
        17, sourceMapData.centreCoords.lat)

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'zoopla',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const latlon = document.evaluate('//script[contains(.,"mapData ")  and contains(.,"bounding_box")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
      const lat = latlon.text.match(/latitude.:([0-9.-]+)/)[1]
      const lon = latlon.text.match(/longitude.:([0-9.-]+)/)[1]

      if (lat.length > 3 && lon.length > 3) {
        sourceMapData.centreCoords = { lat: lat, lng: lon }
      }
      sourceMapData.resolution = calculateResolutionFromStdZoom(
        17, sourceMapData.centreCoords.lat)

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'primelocation',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const lat = document.evaluate('/html/head/meta[@property="og:latitude"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.content
      const lon = document.evaluate('/html/head/meta[@property="og:longitude"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.content

      if (lat.length > 3 && lon.length > 3) {
        sourceMapData.centreCoords = { lat: lat, lng: lon }
      }
      sourceMapData.resolution = calculateResolutionFromStdZoom(
        17, sourceMapData.centreCoords.lat)

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'peakbagger',
  extract:
    function (resolve, reject) {
      function singlePeak () {
        let sourceMapData = {}
        const gmap = document.evaluate('//*[@id="Gmap"]/@src',
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        try {
          const cx = gmap.value.match(/cx=([-0-9.]+)/)[1]
          const cy = gmap.value.match(/cy=([-0-9.]+)/)[1]
          const z = gmap.value.match(/z=([-0-9.]+)/)[1]
          sourceMapData.centreCoords = { lat: cy, lng: cx }
          sourceMapData.resolution = calculateResolutionFromStdZoom(z, cy)
          resolve(sourceMapData)
          return true
        } catch (err) {
          return false
        }
      }
      if (singlePeak()) { return }

      function listOfPeaks () {
        let sourceMapData = {}

        const iframe = document.querySelector('iframe')

        const re = /miny=([-0-9.]+)&maxy=([-0-9.]+)&minx=([-0-9.]+)&maxx=([-0-9.]+)/
        const limitsArray = iframe.src.match(re)
        // these values are the min and max lats & lngs of the list of peaks - not the map limits
        const [miny, maxy, minx, maxx] = limitsArray.slice(1)
        const centreLat = (+miny + +maxy) / 2
        const centreLng = (+minx + +maxx) / 2

        const vert = getDistanceFromLatLonInKm(maxy, centreLng, miny, centreLng)
        const horiz = getDistanceFromLatLonInKm(centreLat, minx, centreLat, maxx)

        const vertMetresPerPixel = vert * 1000 / +iframe.height
        const horizMetresPerPixel = horiz * 1000 / +iframe.width

        const maxMPP = vertMetresPerPixel > horizMetresPerPixel ? vertMetresPerPixel : horizMetresPerPixel

        // use max mpp, increased by a trial-and-error factor to approximate the full map extent shown (not just the bounds of the peaks)
        const resnMPP = maxMPP * 1.4

        sourceMapData.centreCoords = { lat: centreLat, lng: centreLng }
        sourceMapData.resolution = resnMPP // calculateResolutionFromStdZoom(5, centreLat)
        resolve(sourceMapData)
      }
      if (listOfPeaks()) { return }

      reject()
    }
})

extractors.push({
  host: 'osmaps.ordnancesurvey.',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /([-0-9.]+),([-0-9.]+),([0-9]+)/
      const coordArray = window.location.pathname.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'windy.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /([-0-9.]+),([-0-9.]+),([0-9]+)$/
      const [, lat, lng, zoom] = window.location.search.match(re)
      if (lat && lng && zoom) {
        sourceMapData.centreCoords = { lat, lng }
        sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'flightradar24.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /([-0-9.]+),([-0-9.]+)\/([0-9]+)$/
      const [, lat, lng, zoom] = window.location.pathname.match(re)
      if (lat && lng && zoom) {
        sourceMapData.centreCoords = { lat, lng }
        sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
      }
      resolve(sourceMapData)
    }
})

function ignngiExtractor (resolve) {
  let sourceMapData = {}
  const re = /x=([0-9.]+)&y=([0-9.]+)&zoom=([0-9]+)/
  const [, easting, northing, zoom] = window.location.search.match(re)
  if (easting && northing && zoom) {
    sourceMapData.lambertCentreCoords = { e: easting, n: northing }
    sourceMapData.resolution = calculateResolutionFromStdZoom(+zoom + 7, 50.8)
  }
  resolve(sourceMapData)
}

extractors.push({
  host: '.ign.be',
  extract: ignngiExtractor
})

extractors.push({
  host: '.ngi.be',
  extract: ignngiExtractor
})

var runDataExtraction = function () {
  // default null extractor
  let extractor = {
    extract: resolve => { resolve(null) }
  }
  // we iterate through our extractors to find a matching host
  for (let extr of extractors) {
    if (window.location.hostname.indexOf(extr.host) >= 0) {
      extractor = extr
      break
    }
  }
  // execute the extraction and send the result to the main script
  new Promise(extractor.extract).then(function (sourceMapData) {
    browserRoot.runtime.sendMessage({ sourceMapData: sourceMapData })
  }).catch(function () {
    // if an extractor fails, just send a null message to the main script to indicate failure
    browserRoot.runtime.sendMessage({})
  })
}

extractors.push({
  host: 'cyclosm.org',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /map=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
      const [, zoom, lat, lng] = window.location.hash.match(re)
      if (lat && lng && zoom) {
        sourceMapData.centreCoords = { lat, lng }
        sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'nakarte.me',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /m=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
      const [, zoom, lat, lng] = window.location.hash.match(re)
      if (lat && lng && zoom) {
        sourceMapData.centreCoords = { lat, lng }
        sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'mapmyindia.com',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /@([-a-z]+),([-a-z]+),([a-z]+)/
      const matchArr = window.location.pathname.match(re)
      if (matchArr && matchArr.length > 3) {
        // digits are encoded via a simple substitution cipher
        const translateToNumber = function (str) {
          const input = 'fljtaseoqvi'
          const output = '0123456789.'
          const index = x => input.indexOf(x)
          const translate = x => index(x) > -1 ? output[index(x)] : x
          return +str.split('').map(translate).join('')
        }
        const [lat, lng, zoom] = matchArr.slice(1).map(translateToNumber)
        sourceMapData.centreCoords = { lat, lng }
        sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'brouter.de',
  extract:
    function (resolve) {
      let sourceMapData = {}
      const re = /map=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
      const [, zoom, lat, lng] = window.location.hash.match(re)
      if (lat && lng && zoom) {
        sourceMapData.centreCoords = { lat, lng }
        sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
      }

      const routeRe = /lonlats=([-0-9.,;]+)/
      const routeReArr = window.location.hash.match(routeRe)
      if (routeReArr && routeReArr.length > 1) {
        sourceMapData.directions = {}
        sourceMapData.directions.route = []
        routeReArr[1].split(';').forEach(lonlat => {
          const [lng, lat] = lonlat.split(',')
          sourceMapData.directions.route.push({ coords: { lat, lng } })
        })
      }

      resolve(sourceMapData)
    }
})

runDataExtraction()
