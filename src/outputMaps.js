/* global
  globalThis,
  calculateStdZoomFromResolution,
  calculateScaleFromResolution,
  CoordTransform, OsGridRef, LatLon */

/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

let OutputMaps = {

  /** Enumeration of the type of map service */
  category: {
    multidirns: 2,
    singledirns: 1,
    plain: 0,
    special: 5,
    misc: 3,
    utility: 4,
    regional: 6
  }

}

function copyTextToClipboard (text) {
  // create a temporary textbox field into which we can insert text
  const copyFrom = document.createElement('textarea')
  copyFrom.textContent = text
  document.body.appendChild(copyFrom)

  copyFrom.select()
  document.execCommand('copy')

  copyFrom.blur()
  document.body.removeChild(copyFrom)
}

/**
 * Array of all output map services
 *
 * The most important item for each service is the `generate()` function which accepts
 * as input an object containing the data from the source map, plus a view object
 * (representing the extension popup). Each service uses the source map data to
 * generate appropriate links, and calls the relevant functions on the view object
 * to render those links to the view.
 */
OutputMaps.services = [
  {
    site: 'Google',
    prio: 1,
    image: 'googleMapsLogo16x16.png',
    id: 'google',
    cat: OutputMaps.category.multidirns,
    generate: function (sourceMapData, view) {
      const googleBase = 'https://www.google.com/maps/'
      let directions = ''
      const mapCentre = '@' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng + ','
      let zoom = '13z'
      var dataWpts = ''
      var dataDirnOptions = ''

      if ('directions' in sourceMapData && 'route' in sourceMapData.directions) {
        directions = 'dir/'

        for (let rteWpt of sourceMapData.directions.route) {
          if ('address' in rteWpt) {
            // if address specified, add to directions
            directions += rteWpt.address + '/'

            if ('coords' in rteWpt) {
              // if coord also specified, add to data
              dataWpts += '!1m5!1m1!1s0x0:0x0!2m2!1d' +
                            rteWpt.coords.lng + '!2d' + rteWpt.coords.lat
            } else {
              dataWpts += '!1m0'
            }
          } else if ('coords' in rteWpt) {
            // else if coord specified, add to directions
            directions += rteWpt.coords.lat + ',' + rteWpt.coords.lng + '/'
            dataWpts += '!1m0'
          }
        }

        let mode = ''
        if (sourceMapData.directions.mode) {
          switch (sourceMapData.directions.mode) {
            case 'foot':
              mode = '!3e2'
              break
            case 'bike':
              mode = '!3e1'
              break
            case 'car':
              mode = '!3e0'
              break
            case 'transit':
              mode = '!3e3'
              break
          }
        }

        dataDirnOptions = dataWpts + mode

        // add elements identifying directions, with counts of all following sub-elements
        var exclMarkCount = (dataDirnOptions.match(/!/g) || []).length
        dataDirnOptions = '!4m' + (exclMarkCount + 1) + '!4m' + exclMarkCount + dataDirnOptions
      }

      if ('resolution' in sourceMapData) {
        // google minimum zoom is 3
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 3) + 'z'
      }

      if (directions.length > 0) {
        const mapLinksWithDirns = [
          {
            name: 'Maps',
            url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions
          },
          {
            name: 'Terrain',
            url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e4'
          },
          {
            name: 'Earth',
            url: googleBase + directions + mapCentre + zoom + '/data=!3m1!1e3' + dataDirnOptions
          },
          {
            name: 'Traffic',
            url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e1'
          },
          {
            name: 'Cycling',
            url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e3'
          }
        ]
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, mapLinksWithDirns)
      }

      const mapLinksBasic = [
        {
          name: 'Maps',
          url: googleBase + mapCentre + zoom + '/data='
        },
        {
          name: 'Terrain',
          url: googleBase + mapCentre + zoom + '/data=' + '!5m1!1e4'
        },
        {
          name: 'Earth',
          url: googleBase + mapCentre + zoom + '/data=!3m1!1e3'
        },
        {
          name: 'Traffic',
          url: googleBase + mapCentre + zoom + '/data=' + '!5m1!1e1'
        },
        {
          name: 'Cycling',
          url: googleBase + mapCentre + zoom + '/data=' + '!5m1!1e3'
        }
      ]
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinksBasic)
    }
  },
  {
    site: 'Bing',
    prio: 2,
    image: 'bingLogo16x16.png',
    id: 'bing',
    cat: OutputMaps.category.multidirns,
    generate: function (sourceMapData, view) {
      const bingBase = 'https://www.bing.com/maps/?'
      let directions = ''
      const mapCentre = 'cp=' + sourceMapData.centreCoords.lat + '~' +
                                sourceMapData.centreCoords.lng
      let zoom = '&lvl=10'

      if ('resolution' in sourceMapData) {
        // 3 <= zoom <=20
        zoom = '&lvl=' + calculateStdZoomFromResolution(
          sourceMapData.resolution,
          sourceMapData.centreCoords.lat,
          3, 20)
      }

      if ('directions' in sourceMapData &&
                'route' in sourceMapData.directions) {
        directions = 'rtp='
        for (let rteWpt of sourceMapData.directions.route) {
          if ('coords' in rteWpt) {
            directions += 'pos.' + rteWpt.coords.lat + '_' + rteWpt.coords.lng
            if ('address' in rteWpt) {
              directions += '_' + rteWpt.address
            }
            directions += '~'
          } else if ('address' in rteWpt) {
            directions += 'adr.' + rteWpt.address + '~'
          }
        }

        let mode = ''
        if (sourceMapData.directions.mode) {
          switch (sourceMapData.directions.mode) {
            case 'foot':
              mode = '&mode=w'
              break
            case 'car':
              mode = '&mode=d'
              break
            case 'transit':
              mode = '&mode=t'
              break
          }
        }

        directions += mode
      }

      const mapLinksWithDirns = [
        {
          name: 'Road',
          url: bingBase + directions + '&' + mapCentre + zoom
        },
        {
          name: 'Aerial',
          url: bingBase + directions + '&' + mapCentre + zoom + '&sty=h'
        },
        {
          name: "Bird's eye",
          url: bingBase + directions + '&' + mapCentre + zoom + '&sty=b'
        }
      ]

      const mapLinksBasic = [
        {
          name: 'Road',
          url: bingBase + '&' + mapCentre + zoom
        },
        {
          name: 'Aerial',
          url: bingBase + '&' + mapCentre + zoom + '&sty=h'
        },
        {
          name: "Bird's eye",
          url: bingBase + '&' + mapCentre + zoom + '&sty=b'
        }
      ]

      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        mapLinksWithDirns.push({
          name: 'Ordnance Survey',
          url: bingBase + directions + '&' + mapCentre + zoom + '&sty=s'
        })
        mapLinksBasic.push({
          name: 'Ordnance Survey',
          url: bingBase + '&' + mapCentre + zoom + '&sty=s'
        })
      }

      if (directions.length > 0) {
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, mapLinksWithDirns)
      }
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinksBasic)
    }
  },
  {
    site: 'OpenStreetMap',
    prio: 3,
    image: 'osmLogo16x16.png',
    id: 'osm',
    cat: OutputMaps.category.singledirns,
    note: '',
    generate: function (sourceMapData, view) {
      const osmBase = 'https://www.openstreetmap.org/'
      let zoom = '12/'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let directions = ''

      if ('resolution' in sourceMapData) {
        // osm max zoom 19
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 19) + '/'
      }

      if (sourceMapData.directions &&
                'route' in sourceMapData.directions) {
        let mode = ''
        if (sourceMapData.directions.mode) {
          switch (sourceMapData.directions.mode) {
            case 'foot':
              mode = 'engine=mapzen_foot&'
              break
            case 'car':
              mode = 'engine=osrm_car&'
              break
            case 'bike':
              mode = 'engine=graphhopper_bicycle&'
              break
          }
        }

        // OSM appears to only handle single-segment routes.
        // So we choose to use the first and last point of the route from the source map.

        const firstElem = sourceMapData.directions.route[0]
        const lastElem = sourceMapData.directions.route[sourceMapData.directions.route.length - 1]

        if ('coords' in firstElem && 'coords' in lastElem) {
          directions = 'directions?' + mode + 'route=' +
                    firstElem.coords.lat + ',' + firstElem.coords.lng + ';' +
                    lastElem.coords.lat + ',' + lastElem.coords.lng
        } else {
          this.note = 'OSM directions unavailable because waypoints are not ' +
                            'all specified as coordinates.'
        }
      }

      const coreDirnsLink = osmBase + directions + '#map=' + zoom + mapCentre
      const coreBasicLink = osmBase + '#map=' + zoom + mapCentre

      if (directions.length > 0) {
        const mapLinksWithDirns = [
          {
            name: 'Standard',
            url: coreDirnsLink
          },
          {
            name: 'Cycle Map',
            url: coreDirnsLink + '&layers=C'
          },
          {
            name: 'Transport',
            url: coreDirnsLink + '&layers=T'
          },
          {
            name: 'Humanitarian',
            url: coreDirnsLink + '&layers=H'
          }
        ]
        view.addMapServiceLinks(OutputMaps.category.singledirns, this, mapLinksWithDirns, this.note)
      }

      const mapLinksBasic = [
        {
          name: 'Standard',
          url: coreBasicLink
        },
        {
          name: 'Cycle Map',
          url: coreBasicLink + '&layers=C'
        },
        {
          name: 'Transport',
          url: coreBasicLink + '&layers=T'
        },
        {
          name: 'Humanitarian',
          url: coreBasicLink + '&layers=H'
        }
      ]
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinksBasic, this.note)
    }
  },
  {
    site: 'Wikimedia Labs',
    image: 'wmLabsLogo16x16.png',
    id: 'wmLabs',
    cat: OutputMaps.category.misc,
    prio: 4,
    generate: function (sourceMapData, view) {
      const mapLinks = []
      const geohackBase = 'https://tools.wmflabs.org/geohack/geohack.php?params='
      let mapCentre = sourceMapData.centreCoords.lat + '_N_' + sourceMapData.centreCoords.lng + '_E'
      const region = (sourceMapData.countryCode.length > 0)
        ? '_region:' + sourceMapData.countryCode : ''

      const scale = calculateScaleFromResolution(sourceMapData.resolution)
      mapLinks.push({
        name: 'GeoHack',
        url: geohackBase + mapCentre + region + '_scale:' + scale
      })

      const wikiminiatlasBase = 'https://wma.wmflabs.org/iframe.html?'
      mapCentre = sourceMapData.centreCoords.lat + '_' + sourceMapData.centreCoords.lng
      // FIXME this is an approximation of zoom - it's not completely accurate
      const zoom = calculateStdZoomFromResolution(
        sourceMapData.resolution, sourceMapData.centreCoords.lat, 4, 16) - 1
      mapLinks.push({
        name: 'Wiki Mini Atlas',
        url: wikiminiatlasBase + mapCentre + '_0_0_en_' + zoom + '_englobe=Earth'
      })
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Wikimapia',
    image: 'wikimapiaLogo16x16.png',
    id: 'wikimapia',
    prio: 10,
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const wikimapiaBase = 'http://wikimapia.org/#lang=en&'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'z=12'

      if ('resolution' in sourceMapData) {
        zoom = 'z=' +
                calculateStdZoomFromResolution(
                  sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      const mapLinks = [{
        name: 'Maps',
        url: wikimapiaBase + mapCentre + '&' + zoom + '&m=w'
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Geocaching',
    image: 'geocachingLogo16x16.png',
    id: 'geocaching',
    note: 'geocaching.com requires login to see the map (free sign-up)',
    cat: OutputMaps.category.special,
    generate: function (sourceMapData, view) {
      const geocachingBase = 'https://www.geocaching.com/map/#?'
      const mapCentre = 'll=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = 'z=14'

      if ('resolution' in sourceMapData) {
        zoom = 'z=' +
                calculateStdZoomFromResolution(
                  sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }
      const mapLinks = [{
        name: 'Map',
        url: geocachingBase + mapCentre + '&' + zoom
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks, this.note)
    }
  },
  {
    site: 'what3words',
    image: 'w3wLogo.png',
    id: 'w3w',
    cat: OutputMaps.category.special,
    generate: function (sourceMapData, view) {
      const w3wBase = 'https://map.what3words.com/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng

      const mapLinks = [{
        name: 'Map',
        url: w3wBase + mapCentre
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'GPX',
    image: 'gpxFile16x16.png',
    id: 'dl_gpx',
    cat: OutputMaps.category.utility,
    generate: function (sourceMapData, view) {
      view.addFileDownload(this, 'gpx_map_centre', 'Download map centre waypoint', function () {
        var fileData = {
          name: 'MapSwitcher.gpx',
          type: 'text/xml;charset=utf-8',
          content:
            '<?xml version="1.1"?>\n' +
            '<gpx creator="MapSwitcher" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">\n' +
              '\t<author>MapSwitcher</author>\n' +
              '\t<wpt lat="' + sourceMapData.centreCoords.lat +
                '" lon="' + sourceMapData.centreCoords.lng + '">\n' +
                '\t\t<name>Centre of map</name>\n' +
                '\t\t<desc>' + sourceMapData.centreCoords.lat + ', ' + sourceMapData.centreCoords.lng + '</desc>\n' +
              '\t</wpt>\n' +
            '</gpx>\n'
        }
        return fileData
      })
      if ('directions' in sourceMapData && 'route' in sourceMapData.directions) {
        var firstPoint = sourceMapData.directions.route[0]
        var lastPoint = sourceMapData.directions.route[sourceMapData.directions.route.length - 1]

        let routePoints = ''
        let pointsWithCoords = 0
        for (let rteIndex in sourceMapData.directions.route) {
          var rteWpt = sourceMapData.directions.route[rteIndex]

          if ('coords' in rteWpt) {
            routePoints +=
              '\t\t<rtept lat="' + rteWpt.coords.lat + '" lon="' + rteWpt.coords.lng + '">\n' +
              '\t\t\t<name>' + (rteWpt.address || 'Unnamed waypoint') + '</name>\n' +
              '\t\t</rtept>\n'
            pointsWithCoords++
          }
        }
        // only provide a gpx route download if all the points in the route have coordinates
        if (pointsWithCoords === sourceMapData.directions.route.length) {
          view.addFileDownload(this, 'gpx_rte', 'Download route', function () {
            var fileData = {
              name: 'MapSwitcherRoute.gpx',
              type: 'text/xml;charset=utf-8',
              content:
                '<?xml version="1.1"?>\n' +
                '<gpx creator="MapSwitcher" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">\n' +
                  '\t<author>MapSwitcher</author>\n' +
                  '\t<rte>\n' +
                    '\t\t<name>Map Switcher Route</name>\n' +
                    '\t\t<desc>From ' + firstPoint.coords.lat + ', ' + firstPoint.coords.lng + ' to ' +
                      lastPoint.coords.lat + ', ' + lastPoint.coords.lng + '</desc>\n' +
                      routePoints +
                    '\t</rte>\n' +
                '</gpx>\n'
            }
            return fileData
          })
        } else {
          view.addNote(this,
            'GPX directions unavailable because waypoints are not all specified as coordinates.')
        }
      }
    }
  },
  {
    site: 'Waze',
    image: 'wazeLogo16x16.png',
    id: 'waze',
    prio: 6,
    cat: OutputMaps.category.singledirns,
    generate: function (sourceMapData, view) {
      const wazeBase = 'https://www.waze.com'
      const mapCentre = 'll=' + sourceMapData.centreCoords.lat + '%2C' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'
      let directions = ''

      if ('resolution' in sourceMapData) {
        // FIXME waze zoom doesn't seem to work anymore?
        zoom = 'zoom=' +
          calculateStdZoomFromResolution(
            sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      if ('directions' in sourceMapData &&
          'route' in sourceMapData.directions) {
        // Waze appears to only handle single-segment routes.
        // So we choose to use the first and last point of the route from the source map.

        var firstElem = sourceMapData.directions.route[0]
        var lastElem = sourceMapData.directions.route[sourceMapData.directions.route.length - 1]

        if ('coords' in firstElem && 'coords' in lastElem) {
          directions +=
            'from=ll.' + firstElem.coords.lat + ',' + firstElem.coords.lng +
            '&to=ll.' + lastElem.coords.lat + ',' + lastElem.coords.lng +
            '&at_req=0&at_text=Now'
        } else {
          this.note = 'Waze directions unavailable because waypoints are not ' +
                            'all specified as coordinates.'
        }
      }
      if (directions.length > 0) {
        const mapLinksWithDirns = [{
          name: 'Livemap',
          url: wazeBase + '/livemap/directions?' + directions
        }]
        view.addMapServiceLinks(OutputMaps.category.singledirns, this, mapLinksWithDirns, this.note)
      }
      const mapLinksBasic = [{
        name: 'Livemap',
        url: wazeBase + '/ul?' + mapCentre + '&' + zoom
      }]
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinksBasic, this.note)
    }
  },
  {
    site: 'OpenSeaMap',
    image: 'openSeaMapLogo16x16.png',
    id: 'openseamap',
    prio: 8,
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const openSeaMapBase = 'http://map.openseamap.org/?'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 18)
        zoom = 'zoom=' + zoom
      }

      const layers = 'layers=BFTFFTTFFTF0FFFFFFFFFF'

      const mapLinks = [{
        name: 'Map',
        url: openSeaMapBase + zoom + '&' + mapCentre + '&' + layers
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Stamen',
    image: 'greyMarker.png',
    id: 'stamen',
    cat: OutputMaps.category.special,
    generate: function (sourceMapData, view) {
      const stamenBase = 'http://maps.stamen.com/'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 17)
        zoom = '' + zoom
      }

      const mapLinks = [
        {
          name: 'Watercolor',
          url: stamenBase + 'watercolor/#' + zoom + '/' + mapCentre
        },
        {
          name: 'Toner',
          url: stamenBase + 'toner/#' + zoom + '/' + mapCentre
        },
        {
          name: 'Terrain',
          url: stamenBase + 'terrain/#' + zoom + '/' + mapCentre
        }
      ]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Here',
    image: 'hereLogo16x16.png',
    id: 'here',
    prio: 5,
    cat: OutputMaps.category.multidirns,
    generate: function (sourceMapData, view) {
      const hereBase = 'https://wego.here.com/'
      const mapCentre = '?map=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = '12'
      let directions = ''
      let note = ''

      if ('resolution' in sourceMapData) {
        zoom = '' +
          calculateStdZoomFromResolution(
            sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      if ('directions' in sourceMapData &&
                'route' in sourceMapData.directions) {
        let route = ''
        for (let rteWpt of sourceMapData.directions.route) {
          route += '/'
          if ('address' in rteWpt) {
            route += rteWpt.address
          }
          if ('coords' in rteWpt) {
            route += ':' + rteWpt.coords.lat + ',' + rteWpt.coords.lng
          }
        }

        let mode = 'mix'
        if (sourceMapData.directions.mode) {
          switch (sourceMapData.directions.mode) {
            case 'foot':
              mode = 'walk'
              break
            case 'car':
              mode = 'drive'
              break
            case 'transit':
              mode = 'publicTransport'
              break
            case 'bike':
              mode = 'bicycle'
          }
        }

        directions = 'directions/' + mode + route

        if (sourceMapData.directions.route.length > 10) {
          note = 'Here limited to 10 waypoints'
        }
      }

      if (directions.length > 0) {
        const mapLinksDirns = [
          {
            name: 'Map',
            url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'normal'
          },
          // FIXME do all the rest of these actually still work?
          {
            name: 'Terrain',
            url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'terrain'
          },
          {
            name: 'Satellite',
            url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'satellite'
          },
          {
            name: 'Traffic',
            url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'traffic'
          },
          {
            name: 'Public Transport',
            url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'public_transport'
          }
        ]
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, mapLinksDirns, note)
      }

      const mapLinksBasic = [
        {
          name: 'Map',
          url: hereBase + mapCentre + ',' + zoom + ',' + 'normal'
        },
        {
          name: 'Terrain',
          url: hereBase + mapCentre + ',' + zoom + ',' + 'terrain'
        },
        {
          name: 'Satellite',
          url: hereBase + mapCentre + ',' + zoom + ',' + 'satellite'
        },
        {
          name: 'Traffic',
          url: hereBase + mapCentre + ',' + zoom + ',' + 'traffic'
        },
        {
          name: 'Public Transport',
          url: hereBase + mapCentre + ',' + zoom + ',' + 'public_transport'
        }
      ]
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinksBasic)
    }
  },
  {
    site: 'Streetmap',
    image: 'streetmapLogo16x16.png',
    id: 'streetmap',
    prio: 11,
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        const streetmapMapBase = 'http://www.streetmap.co.uk/map.srf?'

        const ll = new LatLon(sourceMapData.centreCoords.lat, sourceMapData.centreCoords.lng)
        const osLL = CoordTransform.convertWGS84toOSGB36(ll)
        const osGR = OsGridRef.latLongToOsGrid(osLL)
        const mapCentre = 'X=' + osGR.easting + '&Y=' + osGR.northing

        let zoom = 120
        if ('resolution' in sourceMapData) {
          const scale = calculateScaleFromResolution(sourceMapData.resolution)
          if (scale < 4000) {
            zoom = 106
          } else if (scale < 15000) {
            zoom = 110
          } else if (scale < 40000) {
            zoom = 115
          } else if (scale < 80000) {
            zoom = 120
          } else if (scale < 160000) {
            zoom = 126
          } else if (scale < 400000) {
            zoom = 130
          } else if (scale < 900000) {
            zoom = 140
          } else {
            zoom = 150
          }
        }
        const zoomArg = 'Z=' + zoom

        const mapLinks = [{
          name: 'Map',
          url: streetmapMapBase + mapCentre + '&A=Y&' + zoomArg
        }]
        view.addMapServiceLinks(this.cat, this, mapLinks)
      }
    }
  },
  {
    site: 'GPX Editor',
    image: 'gpxed16x16.png',
    id: 'gpxeditor',
    cat: OutputMaps.category.special,
    generate: function (sourceMapData, view) {
      const gpxEditorBase = 'http://www.gpxeditor.co.uk/?'
      const mapCentre = 'location=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1)
        zoom = 'zoom=' + zoom
      }

      const mapLinks = [
        {
          name: 'Street Map',
          url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=roadmap'
        },
        {
          name: 'Satellite',
          url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=satellite'
        },
        {
          name: 'OpenStreetMap',
          url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OSM'
        },
        {
          name: 'OpenCycleMap',
          url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OCM'
        }
      ]

      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        mapLinks.push({
          name: 'Ordnance Survey',
          url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OS'
        })
      }

      view.addMapServiceLinks(this.cat, this, mapLinks, this.note)
    }
  },
  {
    site: 'NGI/IGN',
    image: 'ngi_ign_Logo16x16.png',
    id: 'ngi_ign',
    prio: 13,
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      if (sourceMapData.countryCode !== 'be') {
        return
      }

      const ngiBase = 'https://topomapviewer.ngi.be/'
      const that = this
      let zoom = 6

      // NGI uses the Lambert 2008 projection, grs80 ellipsoid
      // We use an external service to calculate coordinates from the regular WGS84 lat & long
      const request = new window.Request(`http://www.loughrigg.org/wgs84Lambert/wgs84_lambert/${sourceMapData.centreCoords.lat}/${sourceMapData.centreCoords.lng}`)
      window.fetch(request)
        .then(response => response.json())
        .then(data => {
          const mapCentre = 'x=' + data.easting + '&y=' + data.northing

          if ('resolution' in sourceMapData) {
            // available zooms appear to go from 0 to 12
            zoom = calculateStdZoomFromResolution(
              sourceMapData.resolution, sourceMapData.centreCoords.lat, 7, 19) - 7
          }

          var lang = ''
          // extract the highest priority language (fr or nl) from browser preferences
          browser.i18n.getAcceptLanguages(function (list) {
            for (let listLang of list) {
              if (listLang.match(/^en/)) {
                lang = 'l=en'
                break
              } else if (listLang.match(/^fr/)) {
                lang = 'l=fr'
                break
              } else if (listLang.match(/^nl/)) {
                lang = 'l=nl'
                break
              } else if (listLang.match(/^de/)) {
                lang = 'l=de'
                break
              }
            }

            const commonLink = ngiBase + '?' + mapCentre + '&' + 'zoom=' + zoom + '&' + lang

            const mapLinks = [
              {
                name: 'CartoWeb topo',
                url: commonLink + '&baseLayer=ngi.cartoweb.topo.be'
              },
              {
                name: 'Classic topo',
                url: commonLink + '&baseLayer=classic.maps'
              },
              {
                name: 'Aerial',
                url: commonLink + '&baseLayer=ngi.ortho'
              }
            ]
            view.addMapServiceLinks(this.cat, that, mapLinks)
          })
        })
    }
  },
  {
    site: 'SunCalc',
    image: 'suncalc_org16x16.png',
    id: 'suncalc',
    cat: OutputMaps.category.misc,
    generate: function (sourceMapData, view) {
      const suncalcBase = 'http://suncalc.org/#/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = '12'

      var now = new Date()
      var year = now.getFullYear()
      var month = now.getMonth() + 1
      var dayOfMonth = now.getDate()
      var hours = now.getHours()
      var mins = now.getMinutes()
      var date = year + '.' + month + '.' + dayOfMonth
      var time = hours + ':' + mins

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      const mapLinks = [{
        name: 'Sunrise + sunset times',
        url: suncalcBase + mapCentre + ',' + zoom + '/' + date + '/' + time + '/1/0'
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'TopoZone',
    image: 'topozone16x16.png',
    id: 'topozone',
    prio: 12,
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      if (sourceMapData.countryCode === 'us') {
        const topozoneBase = 'http://www.topozone.com/'
        const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
        let zoom = '&zoom=12'

        if ('resolution' in sourceMapData) {
          zoom = calculateStdZoomFromResolution(
            sourceMapData.resolution, sourceMapData.centreCoords.lat, 1, 16)
          zoom = '&zoom=' + zoom
        }

        const mapLinks = [{
          name: 'Topographic',
          url: topozoneBase + 'map/?' + mapCentre + zoom
        }]
        view.addMapServiceLinks(this.cat, this, mapLinks)
      }
    }
  },
  {
    site: 'SysMaps',
    image: 'sysmaps16x16.png',
    id: 'sysmaps',
    prio: 14,
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      const mapLinks = []
      const base = 'http://www.sysmaps.co.uk/'
      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        const osBase = base + 'sysmaps_os.html?'
        const mapCentre = '!' + sourceMapData.centreCoords.lat + '~' + sourceMapData.centreCoords.lng
        mapLinks.push({
          name: 'OS',
          url: osBase + mapCentre
        })
      } else if (sourceMapData.countryCode === 'de') {
        const deTopoBase = base + 'sysmaps_bkg.html?layers=B00000000000000000000000FFFFFTFFFTFFTTTTT'
        const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
        mapLinks.push({
          name: 'DE Topo',
          url: deTopoBase + '&' + mapCentre
        })
      }
      if (mapLinks.length > 0) {
        view.addMapServiceLinks(this.cat, this, mapLinks)
      }
    }
  },
  {
    site: 'Boulter',
    image: 'boulterIcon.png',
    id: 'boulter',
    cat: OutputMaps.category.misc,
    generate: function (sourceMapData, view) {
      const boulterBase = 'http://boulter.com/gps/'
      const mapCentre = '#' + sourceMapData.centreCoords.lat + '%2C' + sourceMapData.centreCoords.lng

      const mapLinks = [{
        name: 'Coordinate Converter',
        url: boulterBase + mapCentre
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'OpenCycleMap',
    image: 'openCycleMapLogo.png',
    id: 'openCycleMap',
    prio: 8,
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const openCycleMapBase = 'http://www.opencyclemap.org/?'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 18)
        zoom = 'zoom=' + zoom
      }

      const mapLinks = [
        {
          name: 'OpenCycleMap',
          url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=B0000'
        },
        {
          name: 'Transport',
          url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=0B000'
        },
        {
          name: 'Landscape',
          url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=00B00'
        },
        {
          name: 'Outdoors',
          url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=000B0'
        },
        {
          name: 'Transport Dark',
          url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=0000B'
        }
      ]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'OpenWeatherMap',
    image: 'openWeatherMap16x16.png',
    id: 'openweathermap',
    prio: 12,
    cat: OutputMaps.category.misc,
    generate: function (sourceMapData, view) {
      const owmBase = 'https://openweathermap.org/weathermap?'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=6'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1)
        zoom = 'zoom=' + zoom
      }

      const mapLinks = [{
        name: 'Weather Map',
        url: owmBase + zoom + '&' + mapCentre
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Flickr',
    image: 'flickr16x16.png',
    id: 'flickr',
    cat: OutputMaps.category.misc,
    generate: function (sourceMapData, view) {
      const base = 'http://www.flickr.com/map/'
      const mapCentre = 'fLat=' + sourceMapData.centreCoords.lat + '&fLon=' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }
      zoom = 'zl=' + zoom

      const mapLinks = [{
        name: 'World map',
        url: base + '?' + mapCentre + '&' + zoom + '&everyone_nearby=1'
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Strava',
    image: 'stravaLogo16x16.png',
    id: 'strava',
    cat: OutputMaps.category.special,
    generate: function (sourceMapData, view) {
      const siteBase = 'https://www.strava.com/heatmap#'
      let zoom = '12'
      const mapCentre = sourceMapData.centreCoords.lng + '/' + sourceMapData.centreCoords.lat

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1)
      }

      const mapLinks = [{
        name: 'Global Heatmap',
        url: siteBase + zoom + '/' + mapCentre + '/hot/all'
      }]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Yandex',
    image: 'yandex16x16.png',
    id: 'yandex',
    prio: 7,
    cat: OutputMaps.category.multidirns,
    generate: function (sourceMapData, view) {
      const yandexBase = 'https://yandex.com/maps/'
      const mapCentre = 'll=' + sourceMapData.centreCoords.lng + ',' + sourceMapData.centreCoords.lat
      let zoom = 'z=6'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
        zoom = 'z=' + zoom
      }

      let directions = ''
      if ('directions' in sourceMapData && 'route' in sourceMapData.directions) {
        const sourceWaypoints = sourceMapData.directions.route.filter((wpt) => {
          return ('coords' in wpt)
        })
        const waypointPairs = sourceWaypoints.map(wpt => {
          return wpt.coords.lat + ',' + wpt.coords.lng
        })
        const routeCoords = waypointPairs.join('~')
        let mode = 'auto'
        if (sourceMapData.directions.mode) {
          switch (sourceMapData.directions.mode) {
            case 'car':
              mode = 'auto'
              break
            case 'bike':
              mode = 'bc'
              break
            case 'foot':
              mode = 'pd'
              break
            case 'transit':
              mode = 'mt'
              break
          }
        }
        directions = '&mode=routes&rtext=' + routeCoords + '&rtt=' + mode
      }

      if (directions.length > 0) {
        const mapLinksWithDirns = [
          {
            name: 'Maps',
            url: yandexBase + '?' + mapCentre + directions + '&' + zoom
          },
          {
            name: 'Satellite',
            url: yandexBase + '?l=sat&' + mapCentre + directions + '&' + zoom
          },
          {
            name: 'Hybrid',
            url: yandexBase + '?l=sat%2Cskl&' + mapCentre + directions + '&' + zoom
          }
        ]
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, mapLinksWithDirns)
      }

      const mapLinksBasic = [
        {
          name: 'Maps',
          url: yandexBase + '?' + mapCentre + '&' + zoom
        },
        {
          name: 'Satellite',
          url: yandexBase + '?l=sat&' + mapCentre + '&' + zoom
        },
        {
          name: 'Hybrid',
          url: yandexBase + '?l=sat%2Cskl&' + mapCentre + '&' + zoom
        }
      ]
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinksBasic)
    }
  },
  {
    site: 'F4map',
    image: 'f4logo16x16.png',
    id: 'F4map',
    prio: 12,
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://demo.f4map.com/'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 21)
        zoom = 'zoom=' + zoom
      }
      const mapLinks = [
        {
          name: 'Regular',
          url: base + '#' + mapCentre + '&' + zoom + '&3d=false&camera.theta=0.9'
        },
        {
          name: '3d',
          url: base + '#' + mapCentre + '&' + zoom
        }
      ]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'OpenTopoMap',
    image: 'opentopomap16x16.png',
    id: 'opentopomap',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://opentopomap.org/#map='
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
        zoom = '' + zoom
      }

      const mapLinks = [{
        name: 'Topographic map',
        url: base + zoom + '/' + mapCentre
      }]
      view.addMapServiceLinks(OutputMaps.category.plain, this, mapLinks)
    }
  },
  {
    site: 'CalTopo',
    image: 'caltopoLogo16x16.png',
    id: 'caltopo',
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      if ((sourceMapData.countryCode === 'us') || (sourceMapData.countryCode === 'ca')) {
        const base = 'http://caltopo.com/map.html'
        const mapCentre = 'll=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
        let zoom = 'z=12'

        if ('resolution' in sourceMapData) {
          zoom = calculateStdZoomFromResolution(
            sourceMapData.resolution, sourceMapData.centreCoords.lat)
          zoom = 'z=' + zoom
        }

        const mapLinks = [
          {
            name: 'MapBuilderTopo',
            url: base + '#' + mapCentre + '&' + zoom + '&b=mbt'
          },
          {
            name: "7.5' Topo",
            url: base + '#' + mapCentre + '&' + zoom + '&b=t&o=r&n=0.25'
          },
          {
            name: 'Forest Service',
            url: base + '#' + mapCentre + '&' + zoom + '&b=t&o=f16a%2Cr&n=1,0.25'
          },
          {
            name: 'Aerial Topo',
            url: base + '#' + mapCentre + '&' + zoom + '&b=sat&o=t&n=0.5'
          },
          {
            name: 'Hybrid Satellite',
            url: base + '#' + mapCentre + '&' + zoom + '&b=sat&o=r&n=0.3&a=c,mba'
          }
        ]
        view.addMapServiceLinks(this.cat, this, mapLinks)
      }
    }
  },
  {
    site: 'Qwant',
    image: 'qwantLogo16x16.png',
    id: 'qwant',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://www.qwant.com/maps'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat) - 1
        zoom = '' + zoom
      }

      const mapLinks = [{
        name: 'Map',
        url: base + '/#map=' + zoom + '/' + mapCentre
      }]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Mapillary',
    image: 'mapillary16x16.png',
    id: 'mapillary',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://www.mapillary.com/app/'
      const mapCentre = sourceMapData.centreCoords.lat + '&lng=' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat) - 1
        zoom = '' + zoom
      }

      const mapLinks = [{
        name: 'Map',
        url: base + '?lat=' + mapCentre + '&z=' + zoom
      }]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Komoot',
    image: 'komootLogo16x16.png',
    id: 'komoot',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://www.komoot.com/plan/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1, 18)
        zoom = zoom + 'z'
      }

      const mapLinks = [{
        name: 'Map',
        url: base + '@' + mapCentre + ',' + zoom
      }]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Waymarked Trails',
    image: 'waymarkedtrailshiking16x16.png',
    id: 'waymarkedtrails',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const domain = 'waymarkedtrails.org'
      let zoom = '12'
      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 18)
      }
      const location = zoom + '!' + sourceMapData.centreCoords.lat + '!' + sourceMapData.centreCoords.lng

      const mapLinks = [
        {
          name: 'Hiking',
          url: 'https://hiking.' + domain + '/#?map=' + location
        },
        {
          name: 'Cycling',
          url: 'https://cycling.' + domain + '/#?map=' + location
        },
        {
          name: 'MTB',
          url: 'https://mtb.' + domain + '/#?map=' + location
        },
        {
          name: 'Riding',
          url: 'https://riding.' + domain + '/#?map=' + location
        },
        {
          name: 'Skating',
          url: 'https://skating.' + domain + '/#?map=' + location
        },
        {
          name: 'Slopes',
          url: 'https://slopes.' + domain + '/#?map=' + location
        }
      ]
      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'OS Maps',
    image: 'osLogo16x16.png',
    id: 'ordnancesurvey',
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        const base = 'https://osmaps.ordnancesurvey.co.uk/'
        const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
        let zoom = '12'

        if ('resolution' in sourceMapData) {
          zoom = calculateStdZoomFromResolution(
            sourceMapData.resolution, sourceMapData.centreCoords.lat, 1, 18)
        }

        const mapLinks = [{
          name: 'Map',
          url: base + mapCentre + ',' + zoom
        }]

        view.addMapServiceLinks(this.cat, this, mapLinks)
      }
    }
  },
  {
    site: 'Clipboard',
    image: 'clipboard16x16.png',
    id: 'clipboard',
    cat: OutputMaps.category.utility,
    generate: function (sourceMapData, view) {
      view.addUtilityLink(this, 'copyToClipboard', 'Copy map centre coordinates', function () {
        copyTextToClipboard(sourceMapData.centreCoords.lat + ', ' + sourceMapData.centreCoords.lng)
      })
    }
  },
  {
    site: 'Windy',
    image: 'windyLogo16x16.png',
    id: 'windy',
    cat: OutputMaps.category.misc,
    generate: function (sourceMapData, view) {
      const base = 'https://www.windy.com/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      const mapLinks = [
        {
          name: 'Wind',
          url: base + '?' + mapCentre + ',' + zoom
        },
        {
          name: 'Weather radar',
          url: base + '-Weather-radar-radar?radar,' + mapCentre + ',' + zoom
        },
        {
          name: 'Clouds',
          url: base + '-Clouds-clouds?clouds,' + mapCentre + ',' + zoom
        }
      ]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Flightradar24',
    image: 'flightradar24.png',
    id: 'flightradar24',
    cat: OutputMaps.category.misc,
    generate: function (sourceMapData, view) {
      const base = 'https://www.flightradar24.com/'
      const roundedLat = Math.round(sourceMapData.centreCoords.lat * 100) / 100
      const roundedLng = Math.round(sourceMapData.centreCoords.lng * 100) / 100

      const mapCentre = roundedLat + ',' + roundedLng
      let zoom = '6'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 2, 20)
      }

      const mapLinks = [{
        name: 'Live Flight Tracker',
        url: base + mapCentre + '/' + zoom
      }]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'CyclOSM',
    image: 'cyclosm16x16.png',
    id: 'cyclosm',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://www.cyclosm.org/'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
        zoom = '' + zoom
      }

      const mapLinks = [
        {
          name: 'CyclOSM',
          url: base + '#map=' + zoom + '/' + mapCentre + '/cyclosm'
        },
        {
          name: 'OSM Piano',
          url: base + '#map=' + zoom + '/' + mapCentre + '/piano'
        }
      ]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'nakarte.me',
    image: 'nakarte16x16.png',
    id: 'nakarte',
    cat: OutputMaps.category.plain,
    generate: function (sourceMapData, view) {
      const base = 'https://www.nakarte.me/'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
        zoom = '' + zoom
      }

      const mapLinks = [
        {
          name: 'OpenStreetMap',
          url: base + '#m=' + zoom + '/' + mapCentre + '&l=O'
        },
        {
          name: 'mapy.cz tourist',
          url: base + '#m=' + zoom + '/' + mapCentre + '&l=Czt'
        },
        {
          name: 'ESRI Satellite',
          url: base + '#m=' + zoom + '/' + mapCentre + '&l=E'
        },
        {
          name: 'Topomapper 1km',
          url: base + '#m=' + zoom + '/' + mapCentre + '&l=T'
        }
      ]

      view.addMapServiceLinks(this.cat, this, mapLinks)
    }
  },
  {
    site: 'Mapmyindia',
    image: 'mapmyindia.png',
    id: 'mapmyindia',
    cat: OutputMaps.category.regional,
    generate: function (sourceMapData, view) {
      const base = 'https://maps.mapmyindia.com/'
      let zoom = 12
      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      const substituteEncode = function (num) {
        const input = '0123456789.'
        const output = 'fljtaseoqvi'
        const index = x => input.indexOf(x)
        const translate = x => index(x) > -1 ? output[index(x)] : x
        return ('' + num).split('').map(translate).join('')
      }
      const [latAlpha, lngAlpha, zoomAlpha] = [
        sourceMapData.centreCoords.lat,
        sourceMapData.centreCoords.lng,
        zoom
      ].map(substituteEncode)

      const mapLinks = [{
        name: 'Default',
        url: base + '@' + latAlpha + ',' + lngAlpha + ',' + zoomAlpha + ',l,j,fzdata'
      }]

      if (sourceMapData.countryCode === 'in') {
        view.addMapServiceLinks(this.cat, this, mapLinks)
      }
    }
  }
]

export default OutputMaps
