/* global
  browser, chrome,
  $,
  calculateResolutionFromScale,
  calculateResolutionFromStdZoom,
  Gmdp, GmdpException */

/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if (typeof browser === 'undefined') {
  browser = chrome // eslint-disable-line no-global-assign
}

var extractors = []

extractors.push({
  host: '.google.',
  extract:
    function (resolve, reject) {
      let sourceMapData = {}
      // exceptional case for custom maps
      if (window.location.pathname === '/maps/d/viewer') {
        const re1 = /ll=([-0-9.]+)%2C([-0-9.]+)&z=([0-9.]+)/
        var coordArray1 = window.location.search.match(re1)
        if (coordArray1 && coordArray1.length > 3) {
          sourceMapData.centreCoords = { 'lat': coordArray1[1], 'lng': coordArray1[2] }
          sourceMapData.resolution =
                    calculateResolutionFromStdZoom(coordArray1[3], coordArray1[1])
        }
        resolve(sourceMapData)
      } else if (window.location.pathname.indexOf('/maps/') === 0) {
        const re2 = /@([-0-9.]+),([-0-9.]+),([0-9.]+)([a-z])/
        var coordArray2 = window.location.pathname.match(re2)
        if (coordArray2 && coordArray2.length >= 3) {
          sourceMapData.centreCoords = { 'lat': coordArray2[1], 'lng': coordArray2[2] }
        }
        if (coordArray2 && coordArray2.length >= 5) {
          if (coordArray2[4] === 'z') {
            sourceMapData.resolution =
                        calculateResolutionFromStdZoom(coordArray2[3],
                          coordArray2[1])
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
        var wholeRouteArray = window.location.pathname.match(re3)
        if (wholeRouteArray && wholeRouteArray.length > 1) {
          sourceMapData.directions = {}
          sourceMapData.directions.route = []
          for (var arrWpt of wholeRouteArray[1].split('/')) {
            if (arrWpt.length > 0) {
              var wptObj = { address: arrWpt }
              // check if the address looks like a coordinate
              // if so, we put it in the coords sub-object too
              var coordRe = /([-0-9.]+),[+]?([-0-9.]+)/
              var addrIsCoordArr = arrWpt.match(coordRe)
              if (addrIsCoordArr && addrIsCoordArr.length > 2) {
                wptObj.coords =
                            { lat: addrIsCoordArr[1], lng: addrIsCoordArr[2] }
              }
              sourceMapData.directions.route.push(wptObj)
            }
          }
        }

        // we expect to have sub-objects for each waypoint now
        // But some of them may only have addresses, not coordinates.
        // So we must parse the data part of the URL to find the coords.
        try {
          var gmdp = new Gmdp(window.location.href)
          var gmdpRoute = gmdp.getRoute()
          var mapDataWptIndex = 0 // index into sourceMapData wpts
          // FIXME we should do a count here - number of gmdp primary wpts should be equal to
          // number of sourceMapData wpts
          for (var gmdpWpt of gmdpRoute.getAllWaypoints()) {
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
      } else if (window.location.pathname.indexOf('/search') === 0 ||
                window.location.pathname.indexOf('/webhp') === 0) {
        const re = /&rllag=([-0-9]+),([-0-9]+)/
        var coordArray = window.location.hash.match(re)
        if (coordArray && coordArray.length > 2) {
          resolve({
            centreCoords: { 'lat': coordArray[1] / 1000000, 'lng': coordArray[2] / 1000000 },
            locationDescr: 'default map of search results',
            nonUpdating: window.location.hostname + window.location.pathname
          })
        } else {
          resolve(null)
        }
      } else {
        reject(null)
      }
    }
})

extractors.push({
  host: '.bing.',
  extract:
    function (resolve) {
      let sourceMapData = {}
      // if there's no 'state', it means no scrolling has happened yet.
      // So we should extract the lat and lng from the window.location parameter
      if (window.history && !window.history.state) {
        const re1 = /cp=([-0-9.]+)~([-0-9.]+)/
        var coordArray = window.location.search.match(re1)
        if (coordArray && coordArray.length >= 3) {
          sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
        }
        const re2 = /lvl=([0-9]+)/
        var levelArray = window.location.search.match(re2)
        if (levelArray && levelArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(
            levelArray[1], sourceMapData.centreCoords.lat)
        }
      } else {
        // scrolling has happened, but bing doesn't update its URL. So we pull
        // the coords from the'MapModeStateHistory'
        sourceMapData.centreCoords = {
          'lat': window.history.state.MapModeStateHistory.centerPoint.latitude, 'lng': window.history.state.MapModeStateHistory.centerPoint.longitude }

        var level = window.history.state.MapModeStateHistory.level
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          level, sourceMapData.centreCoords.lat)
      }

      if ($('#directionsPanelRoot').length) {
        // we expect a single 'From' input, followed by one or more 'To' inputs
        sourceMapData.directions = {
          route: [ { address: $(".dirWaypoints input[title='From']").val() } ]
        }
        $(".dirWaypoints input[title='To']").each(function () {
          sourceMapData.directions.route.push({ address: $(this).val() })
        })

        const re3 = /([-0-9.]+)[ ]*,[ ]*([-0-9.]+)/
        for (let rteWptIndex in sourceMapData.directions.route) {
          var wptArray =
            sourceMapData.directions.route[rteWptIndex].address.match(re3)
          if (wptArray && wptArray.length > 2) {
            sourceMapData.directions.route[rteWptIndex].coords =
              { 'lat': wptArray[1], 'lng': wptArray[2] }
          }
        }

        switch ($('.dirBtnSelected')[0].classList[0]) {
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
      var sourceMapData = {}
      const re1 = /map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
      var coordArray = window.location.hash.match(re1)
      if (coordArray && coordArray.length >= 4) {
        sourceMapData.centreCoords = { 'lat': coordArray[2], 'lng': coordArray[3] }
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          coordArray[1], sourceMapData.centreCoords.lat)
      }

      if ($('.directions_form').is(':visible') &&
            ($('#route_from').val().length > 0) &&
            ($('#route_to').val().length > 0)) {
        sourceMapData.directions = {
          route: [
            { address: $('#route_from').val() },
            { address: $('#route_to').val() }
          ]
        }

        const re2 = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/
        var routeCoordsArray = window.location.search.match(re2)
        if (routeCoordsArray && routeCoordsArray.length > 4) {
          sourceMapData.directions.route[0].coords =
            { 'lat': routeCoordsArray[1],
              'lng': routeCoordsArray[2] }
          sourceMapData.directions.route[1].coords =
            { 'lat': routeCoordsArray[3],
              'lng': routeCoordsArray[4] }
        }

        const re3 = /engine=[a-zA-Z]+_([a-z]+)/
        var modeArray = window.location.search.match(re3)
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
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'tools.wmflabs.org',
  extract:
    function (resolve) {
      var sourceMapData = {}
      const re1 = /params=([-0-9.]+)_N_([-0-9.]+)_E/
      var coordArray = window.location.search.match(re1)
      if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
      }
      var scaleElem = $(".toccolours th:contains('Scale')").next()
      const re2 = /1:([0-9]+)/
      var scaleMatch = scaleElem[0].innerText.match(re2)
      if (scaleMatch && scaleMatch.length > 1) {
        sourceMapData.resolution = calculateResolutionFromScale(scaleMatch[1])
      }
      sourceMapData.locationDescr = 'primary page coordinates'
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'geocaching.',
  extract:
    function (resolve) {
      if (window.location.pathname.indexOf('/map/') === 0) {
        var sourceMapData = {}
        const re1 = /ll=([-0-9.]+),([-0-9.]+)/
        var coordArray = window.location.hash.match(re1)
        if (coordArray && coordArray.length >= 3) {
          sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
        }
        const re2 = /z=([0-9]+)/
        var zoomArray = window.location.hash.match(re2)
        if (zoomArray && zoomArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(
            zoomArray[1], sourceMapData.centreCoords.lat)
        }
        resolve(sourceMapData)
      } else if (window.location.pathname.indexOf('/geocache/') === 0) {
        var dmLatLng = document.getElementById('uxLatLon').innerText
        const re3 = /([NS])\s+([0-9]+)[^0-9]\s+([0-9.]+)\s+([EW])\s+([0-9]+)[^0-9]\s+([0-9.]+)/
        var dmCoordArray = dmLatLng.match(re3)
        if (dmCoordArray && dmCoordArray.length > 6) {
          var lat = parseInt(dmCoordArray[2]) + (dmCoordArray[3] / 60)
          var lng = parseInt(dmCoordArray[5]) + (dmCoordArray[6] / 60)
          if (dmCoordArray[1] === 'S') {
            lat = -lat
          }
          if (dmCoordArray[4] === 'W') {
            lng = -lng
          }
          resolve({
            centreCoords: { 'lat': lat, 'lng': lng },
            resolution: calculateResolutionFromStdZoom(15, lat),
            locationDescr: 'primary geocache coordinates'
          })
        }
      }
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
        sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
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
      var sourceMapData = {}
      var href = ''
      $('.leaflet-control-permalink .permalink').each(function () {
        href = $(this).attr('href')
        if (href.length > 0) {
          return false // break on first non-empty URL
        }
      })
      const re1 = /zoom=([0-9]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/
      var coordArray = href.match(re1)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { 'lat': coordArray[2], 'lng': coordArray[3] }
        sourceMapData.resolution =
                calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
      }

      var routesHref = ''
      $('.routes-list .permalink').each(function () {
        routesHref = $(this).attr('href')
        if (routesHref.length > 0) {
          return false // break on first non-empty URL
        }
      })

      const re2 = /from_lat=([-0-9.]+)&from_lon=([-0-9.]+)&to_lat=([-0-9.]+)&to_lon=([-0-9.]+)/
      var routeCoordsArray = routesHref.match(re2)
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
      var sourceMapData = {}
      var centrePermalink = ($('#OpenLayers_Control_Permalink_13 a').attr('href'))
      const re = /lat=([-0-9.]+)&lon=([-0-9.]+)/
      var coordArray = centrePermalink.match(re)
      if (coordArray && coordArray.length > 2) {
        sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
      }
      const re2 = /zoom=([0-9]+)/
      var zoomArray = centrePermalink.match(re2)
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
      var sourceMapData = {}
      const re = /map=([-0-9.]+),([-0-9.]+),([0-9]+),/
      var coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
        sourceMapData.resolution = calculateResolutionFromStdZoom(
          coordArray[3], sourceMapData.centreCoords.lat)
      }

      // check if pathname contains directions
      var state = -1
      for (var directions of window.location.pathname.split('/')) {
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
          var addrArray = directions.match(re1)
          if (addrArray && addrArray.length > 1) {
            var addr = addrArray[1].replace(/-/g, ' ')
            wptObj = { address: addr }

            const re2 = /:loc-([^:]+)/
            var dirArray = directions.match(re2)
            if (dirArray && dirArray.length > 1) {
              var locnFromB64 = window.atob(dirArray[1])
              const re3 = /lat=([-0-9.]+);lon=([-0-9.]+)/
              var coordsArr = locnFromB64.match(re3)
              if (coordsArr.length > 2) {
                wptObj.coords =
                                { lat: coordsArr[1], lng: coordsArr[2] }
              }
            }
            const re4 = /:([-0-9.]+),([-0-9.]+)/
            var coordsArray = directions.match(re4)
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
      var sourceMapData = {}
      var urlToShare = $('#LinkToInput')[0].innerHTML
      const re1 = /X=([0-9]+)&amp;Y=([0-9]+)/
      var osCoordArray = urlToShare.match(re1)
      if (osCoordArray && osCoordArray.length > 2) {
        sourceMapData.osgbCentreCoords = { 'e': osCoordArray[1], 'n': osCoordArray[2] }
      }
      const re2 = /Z=([0-9]+)/
      var zoomArray = urlToShare.match(re2)
      if (zoomArray && zoomArray.length > 1) {
        var scale = 50000
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
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        resolve({
          centreCoords: { 'lat': coordArray[2], 'lng': coordArray[3] },
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
      var coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 3) {
        resolve({
          centreCoords: { 'lat': coordArray[1], 'lng': coordArray[2] },
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
      var coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 3) {
        resolve({
          centreCoords: { 'lat': coordArray[1], 'lng': coordArray[2] },
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
      var coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 2) {
        var sourceMapData = {
          centreCoords: { 'lat': coordArray[1], 'lng': coordArray[2] },
          nonUpdating: window.location.hostname,
          locationDescr: 'non-updating URL'
        }
        var zoomRe = /zoom=([0-9]+)/
        var zoomArray = window.location.search.match(zoomRe)
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
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length >= 3) {
        resolve({
          centreCoords: { 'lat': coordArray[1], 'lng': coordArray[2] },
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
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length >= 3) {
        resolve({
          centreCoords: { 'lat': coordArray[1], 'lng': coordArray[2] },
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
    function (resolve) {
      var sourceMapData = {}
      if (window.location.pathname.indexOf('/sysmaps_os.html') === 0) {
        $('.style1').each(function () {
          const re = /Map Centre: East: ([0-9.]+) : North: ([0-9.]+)/
          var mapCentreArr = this.innerText.match(re)
          if (mapCentreArr && mapCentreArr.length > 2) {
            sourceMapData.osgbCentreCoords = { 'e': mapCentreArr[1], 'n': mapCentreArr[2] }
            sourceMapData.locationDescr = 'map centre'
            return false // just to break out of jquery each loop
          }
        })
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'wikipedia.org',
  extract:
    function (resolve) {
      var sourceMapData = {}
      $('#coordinates .geo').first().each(function () {
        var coordArray = this.innerText.split(';')
        if (coordArray.length === 2) {
          sourceMapData.centreCoords = { 'lat': coordArray[0].trim(), 'lng': coordArray[1].trim() }
          sourceMapData.locationDescr = 'primary article coordinates'
        }
      })
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'opencyclemap.org',
  extract:
    function (resolve) {
      var sourceMapData = {}
      var href = $('#permalink').attr('href')
      const re = /zoom=([0-9]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/
      var dataArray = href.match(re)
      if (dataArray && dataArray.length > 3) {
        sourceMapData.centreCoords = { 'lat': dataArray[2], 'lng': dataArray[3] }
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
      var sourceMapData = {}

      var mapImages = $('._a3f.img')
      if (mapImages.length > 0) {
        /// // Generic map image (relying on the obfuscated class name continuing to be used) /////
        if (mapImages[0].currentSrc) {
          const re1 = /zoom=([0-9]+)&markers=([-0-9.]+)%2C([-0-9.]+)/
          for (let imgEl of mapImages) {
            let matchArr = imgEl.currentSrc.match(re1)
            if (matchArr && matchArr.length > 3) {
              sourceMapData.centreCoords = { 'lat': matchArr[2], 'lng': matchArr[3] }
              sourceMapData.resolution =
                            calculateResolutionFromStdZoom(matchArr[1], matchArr[2])
              break
            }
          }
        }
      } else if (window.location.pathname.indexOf('/events/') === 0) {
        /// // Events /////
        var eventMapImages = $('.fbPlaceFlyoutWrap img')
        if (eventMapImages.length > 0) {
          const re2 = /center=([-0-9.]+)%2C([-0-9.]+)&zoom=([0-9]+)/
          for (let imgEl of eventMapImages) {
            let matchArr = imgEl.currentSrc.match(re2)
            // we expect there to be more than one image; we assume that only one will contain
            // coords (i.e. the map thumbnail), so use the first such one we find
            if (matchArr && matchArr.length > 3) {
              sourceMapData.centreCoords = { 'lat': matchArr[1], 'lng': matchArr[2] }
              sourceMapData.resolution =
                            calculateResolutionFromStdZoom(matchArr[3], matchArr[1])
              break
            }
          }
        }
      } else {
        /// // Pages /////
        var pageSidebarImages = $('#pages_side_column img')
        if (pageSidebarImages.length > 0) {
          const re3 = /zoom=([0-9]+)&markers=([-0-9.]+)%2C([-0-9.]+)/
          for (var imgEl of pageSidebarImages) {
            var matchArr = imgEl.currentSrc.match(re3)
            if (matchArr && matchArr.length > 3) {
              sourceMapData.centreCoords = { 'lat': matchArr[2], 'lng': matchArr[3] }
              sourceMapData.resolution =
                            calculateResolutionFromStdZoom(matchArr[1], matchArr[2])
              break
            }
          }
        }
      }

      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'yandex.com',
  extract:
    function (resolve, reject) {
      const re = /ll=([-0-9.]+)%2C([-0-9.]+)/
      var coordArray = window.location.search.match(re)
      if (coordArray && coordArray.length > 2) {
        var sourceMapData = {
          centreCoords: { 'lat': coordArray[2], 'lng': coordArray[1] },
          locationDescr: 'map centre specified in URL'
        }
        var zoomRe = /z=([0-9]+)/
        var zoomArray = window.location.search.match(zoomRe)
        if (zoomArray && zoomArray.length > 1) {
          sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[2])
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
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 2) {
        var sourceMapData = {
          centreCoords: { 'lat': coordArray[1], 'lng': coordArray[2] },
          locationDescr: 'map centre specified in URL'
        }
        var zoomRe = /z=([0-9]+)/
        var zoomArray = window.location.hash.match(zoomRe)
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
    function (resolve) {
      var sourceMapData = {}
      const re = /#([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { 'lat': coordArray[3], 'lng': coordArray[2] }
        sourceMapData.resolution =
                calculateResolutionFromStdZoom(coordArray[1], coordArray[3])
      }
      resolve(sourceMapData)
    }
})

extractors.push({
  host: 'f4map.com',
  extract:
    function (resolve) {
      var sourceMapData = {}
      const re = /#lat=([-0-9.]+)&lon=([-0-9.]+)&zoom=([0-9.]+)/
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { 'lat': coordArray[1], 'lng': coordArray[2] }
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
      var sourceMapData = {}
      const re = /#map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
      var coordArray = window.location.hash.match(re)
      if (coordArray && coordArray.length > 3) {
        sourceMapData.centreCoords = { 'lat': coordArray[2], 'lng': coordArray[3] }
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
          var sourceMapData = {}
          var re = /#map=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
          var coordArray = window.location.hash.match(re)
          if (coordArray && coordArray.length > 3) {
            sourceMapData.centreCoords = { 'lat': coordArray[2], 'lng': coordArray[3] }
            sourceMapData.resolution =
                    calculateResolutionFromStdZoom(+coordArray[1] + 1, coordArray[2])
          }
          resolve(sourceMapData)
        }
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
    browser.runtime.sendMessage({ sourceMapData: sourceMapData })
  }).catch(function () {
    // if an extractor fails, just send a null message to the main script to indicate failure
    browser.runtime.sendMessage({})
  })
}

runDataExtraction()
