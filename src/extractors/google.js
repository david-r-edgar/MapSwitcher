/* global
  calculateResolutionFromStdZoom,
  getDistanceFromLatLonInKm,
  Gmdp, GmdpException,
  registerExtractor */

registerExtractor((resolve, reject) => {
  function customMap () {
    const sourceMapData = {}
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
    const sourceMapData = {}
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
      for (const arrWpt of wholeRouteArray[1].split('/')) {
        if (arrWpt.length > 0) {
          const wptObj = { address: arrWpt }
          // check if the address looks like a coordinate
          // if so, we put it in the coords sub-object too
          const coordRe = /([-0-9.]+),[+]?([-0-9.]+)/
          const addrIsCoordArr = arrWpt.match(coordRe)
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
      for (const gmdpWpt of gmdpRoute.getAllWaypoints()) {
        if (gmdpWpt.primary) {
          const mapDataWptCoords = sourceMapData.directions.route[mapDataWptIndex].coords
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
          const newSecondaryWpt = { coords: { lat: gmdpWpt.lat, lng: gmdpWpt.lng } }
          sourceMapData.directions.route.splice(mapDataWptIndex, 0, newSecondaryWpt)
          mapDataWptIndex++
        }
      }

      sourceMapData.directions.mode = gmdpRoute.getTransportation()
    } catch (ex) {
      if (ex instanceof GmdpException) {}
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
})
