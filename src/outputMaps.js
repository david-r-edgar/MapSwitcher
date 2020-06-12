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
    utility: 4
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
    mapLinksWithDirns:
    {
      googlemapsDirns: {
        name: 'Maps'
      },
      googleterrainDirns: {
        name: 'Terrain'
      },
      googleearthDirns: {
        name: 'Earth'
      },
      googletrafficDirns: {
        name: 'Traffic'
      },
      googlebikeDirns: {
        name: 'Cycling'
      }
    },
    basicMapLinks:
    {
      googlemaps: {
        name: 'Maps'
      },
      googleterrain: {
        name: 'Terrain'
      },
      googleearth: {
        name: 'Earth'
      },
      googletraffic: {
        name: 'Traffic'
      },
      googlebike: {
        name: 'Cycling'
      }
    },
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

      this.mapLinksWithDirns.googlemapsDirns['link'] = googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions
      this.mapLinksWithDirns.googleterrainDirns['link'] = googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e4'
      this.mapLinksWithDirns.googleearthDirns['link'] = googleBase + directions + mapCentre + zoom + '/data=!3m1!1e3' + dataDirnOptions
      this.mapLinksWithDirns.googletrafficDirns['link'] = googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e1'
      this.mapLinksWithDirns.googlebikeDirns['link'] = googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e3'

      this.basicMapLinks.googlemaps['link'] = googleBase + mapCentre + zoom + '/data='
      this.basicMapLinks.googleterrain['link'] = googleBase + mapCentre + zoom + '/data=' + '!5m1!1e4'
      this.basicMapLinks.googleearth['link'] = googleBase + mapCentre + zoom + '/data=!3m1!1e3'
      this.basicMapLinks.googletraffic['link'] = googleBase + mapCentre + zoom + '/data=' + '!5m1!1e1'
      this.basicMapLinks.googlebike['link'] = googleBase + mapCentre + zoom + '/data=' + '!5m1!1e3'

      if (directions.length > 0) {
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.mapLinksWithDirns)
      }
      view.addMapServiceLinks(OutputMaps.category.plain, this, this.basicMapLinks)
    }
  },
  {
    site: 'Bing',
    prio: 2,
    image: 'bingLogo16x16.png',
    id: 'bing',
    cat: OutputMaps.category.multidirns,
    maplinksDirns:
    {
      bingroadDirns: {
        name: 'Road'
      },
      bingaerialDirns: {
        name: 'Aerial'
      },
      bingbirdseyeDirns: {
        name: "Bird's eye"
      }
    },
    maplinksBasic:
    {
      bingroad: {
        name: 'Road'
      },
      bingaerial: {
        name: 'Aerial'
      },
      bingbirdseye: {
        name: "Bird's eye"
      }
    },
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

      this.maplinksDirns.bingroadDirns['link'] =
            bingBase + directions + '&' + mapCentre + zoom
      this.maplinksDirns.bingaerialDirns['link'] =
            bingBase + directions + '&' + mapCentre + zoom + '&sty=h'
      this.maplinksDirns.bingbirdseyeDirns['link'] =
            bingBase + directions + '&' + mapCentre + zoom + '&sty=b'

      this.maplinksBasic.bingroad['link'] =
            bingBase + '&' + mapCentre + zoom
      this.maplinksBasic.bingaerial['link'] =
            bingBase + '&' + mapCentre + zoom + '&sty=h'
      this.maplinksBasic.bingbirdseye['link'] =
            bingBase + '&' + mapCentre + zoom + '&sty=b'

      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        this.maplinksDirns.bingosDirns = { name: 'Ordnance Survey',
          link: (bingBase + directions + '&' + mapCentre + zoom + '&sty=s') }
        this.maplinksBasic.bingos = { name: 'Ordnance Survey',
          link: (bingBase + '&' + mapCentre + zoom + '&sty=s') }
      }
      if (directions.length > 0) {
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinksDirns)
      }
      view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinksBasic)
    }
  },
  {
    site: 'OpenStreetMap',
    prio: 3,
    image: 'osmLogo16x16.png',
    id: 'osm',
    cat: OutputMaps.category.singledirns,
    note: '',
    maplinksDirns:
    {
      osmStandardDirns: {
        name: 'Standard'
      },
      osmCycleDirns: {
        name: 'Cycle Map'
      },
      osmTransportDirns: {
        name: 'Transport'
      },
      osmHumanitarianDirns: {
        name: 'Humanitarian'
      }
    },
    maplinksBasic:
    {
      osmStandard: {
        name: 'Standard'
      },
      osmCycle: {
        name: 'Cycle Map'
      },
      osmTransport: {
        name: 'Transport'
      },
      osmHumanitarian: {
        name: 'Humanitarian'
      }
    },
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

      this.maplinksDirns.osmStandardDirns['link'] = coreDirnsLink
      this.maplinksDirns.osmCycleDirns['link'] = coreDirnsLink + '&layers=C'
      this.maplinksDirns.osmTransportDirns['link'] = coreDirnsLink + '&layers=T'
      this.maplinksDirns.osmHumanitarianDirns['link'] = coreDirnsLink + '&layers=H'

      this.maplinksBasic.osmStandard['link'] = coreBasicLink
      this.maplinksBasic.osmCycle['link'] = coreBasicLink + '&layers=C'
      this.maplinksBasic.osmTransport['link'] = coreBasicLink + '&layers=T'
      this.maplinksBasic.osmHumanitarian['link'] = coreBasicLink + '&layers=H'

      if (directions.length > 0) {
        view.addMapServiceLinks(OutputMaps.category.singledirns, this, this.maplinksDirns, this.note)
      }
      view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinksBasic, this.note)
    }
  },
  {
    site: 'Wikimedia Labs',
    image: 'wmLabsLogo16x16.png',
    id: 'wmLabs',
    cat: OutputMaps.category.misc,
    prio: 4,
    maplinks:
    {
      wmGeoHack: {
        name: 'GeoHack'
      },
      wikiminiatlas: {
        name: 'Wiki Mini Atlas'
      }
    },
    generate: function (sourceMapData, view) {
      const geohackBase = 'https://tools.wmflabs.org/geohack/geohack.php?params='
      let mapCentre = sourceMapData.centreCoords.lat + '_N_' + sourceMapData.centreCoords.lng + '_E'
      const region = (sourceMapData.countryCode.length > 0)
        ? '_region:' + sourceMapData.countryCode : ''

      const scale = calculateScaleFromResolution(sourceMapData.resolution)
      this.maplinks.wmGeoHack['link'] = geohackBase + mapCentre + region + '_scale:' + scale

      const wikiminiatlasBase = 'https://wma.wmflabs.org/iframe.html?'
      mapCentre = sourceMapData.centreCoords.lat + '_' + sourceMapData.centreCoords.lng
      // FIXME this is an approximation of zoom - it's not completely accurate
      const zoom = calculateStdZoomFromResolution(
        sourceMapData.resolution, sourceMapData.centreCoords.lat, 4, 16) - 1
      this.maplinks.wikiminiatlas['link'] = wikiminiatlasBase + mapCentre + '_0_0_en_' + zoom + '_englobe=Earth'

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Wikimapia',
    image: 'wikimapiaLogo16x16.png',
    id: 'wikimapia',
    prio: 10,
    cat: OutputMaps.category.plain,
    maplinks:
    {
      wikimapiaMap: {
        name: 'Maps'
      }
    },
    generate: function (sourceMapData, view) {
      const wikimapiaBase = 'http://wikimapia.org/#lang=en&'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'z=12'

      if ('resolution' in sourceMapData) {
        zoom = 'z=' +
                calculateStdZoomFromResolution(
                  sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      this.maplinks.wikimapiaMap['link'] = wikimapiaBase + mapCentre + '&' + zoom + '&m=w'

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Geocaching',
    image: 'geocachingLogo16x16.png',
    id: 'geocaching',
    note: 'geocaching.com requires login to see the map (free sign-up)',
    cat: OutputMaps.category.special,
    maplinks:
    {
      geocaching: {
        name: 'Map'
      }
    },
    generate: function (sourceMapData, view) {
      const geocachingBase = 'https://www.geocaching.com/map/#?'
      const mapCentre = 'll=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = 'z=14'

      if ('resolution' in sourceMapData) {
        zoom = 'z=' +
                calculateStdZoomFromResolution(
                  sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }
      this.maplinks.geocaching['link'] = geocachingBase + mapCentre + '&' + zoom

      view.addMapServiceLinks(this.cat, this, this.maplinks, this.note)
    }
  },
  {
    site: 'what3words',
    image: 'w3wLogo.png',
    id: 'w3w',
    cat: OutputMaps.category.special,
    maplinks:
    {
      what3words: {
        name: 'Map'
      }
    },
    generate: function (sourceMapData, view) {
      const w3wBase = 'https://map.what3words.com/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      this.maplinks.what3words['link'] = w3wBase + mapCentre

      view.addMapServiceLinks(this.cat, this, this.maplinks)
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
    maplinksDirns:
    {
      livemapDirns: {
        name: 'Livemap'
      }
    },
    maplinksBasic:
    {
      livemap: {
        name: 'Livemap'
      }
    },
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
        this.maplinksDirns.livemapDirns['link'] = wazeBase + '/livemap/directions?' + directions
        view.addMapServiceLinks(OutputMaps.category.singledirns, this, this.maplinksDirns, this.note)
      }
      this.maplinksBasic.livemap['link'] = wazeBase + '/ul?' + mapCentre + '&' + zoom
      view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinksBasic, this.note)
    }
  },
  {
    site: 'OpenSeaMap',
    image: 'openSeaMapLogo16x16.png',
    id: 'openseamap_map',
    prio: 8,
    cat: OutputMaps.category.plain,
    maplinks:
    {
      openSeaMap: {
        name: 'Map'
      }
    },
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

      this.maplinks.openSeaMap['link'] = openSeaMapBase + zoom + '&' + mapCentre + '&' + layers

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Stamen',
    image: 'greyMarker.png',
    id: 'stamen',
    cat: OutputMaps.category.special,
    maplinks:
    {
      stamenWatercolor: {
        name: 'Watercolor'
      },
      stamenToner: {
        name: 'Toner'
      },
      stamenTerrain: {
        name: 'Terrain'
      }
    },
    generate: function (sourceMapData, view) {
      const stamenBase = 'http://maps.stamen.com/'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 17)
        zoom = '' + zoom
      }

      this.maplinks.stamenWatercolor['link'] = stamenBase + 'watercolor/#' + zoom + '/' + mapCentre
      this.maplinks.stamenToner['link'] = stamenBase + 'toner/#' + zoom + '/' + mapCentre
      this.maplinks.stamenTerrain['link'] = stamenBase + 'terrain/#' + zoom + '/' + mapCentre

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Here',
    image: 'hereLogo16x16.png',
    id: 'here',
    prio: 5,
    cat: OutputMaps.category.multidirns,
    maplinksDirns:
    {
      hereMapDirns: {
        name: 'Map'
      },
      hereTerrainDirns: {
        name: 'Terrain'
      },
      hereSatelliteDirns: {
        name: 'Satellite'
      },
      hereTrafficDirns: {
        name: 'Traffic'
      },
      herePublicTransportDirns: {
        name: 'Public Transport'
      }
    },
    maplinksBasic:
    {
      hereMap: {
        name: 'Map'
      },
      hereTerrain: {
        name: 'Terrain'
      },
      hereSatellite: {
        name: 'Satellite'
      },
      hereTraffic: {
        name: 'Traffic'
      },
      herePublicTransport: {
        name: 'Public Transport'
      }
    },
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

      this.maplinksDirns.hereMapDirns['link'] = hereBase + directions + mapCentre + ',' + zoom + ',' + 'normal'
      this.maplinksDirns.hereTerrainDirns['link'] = hereBase + directions + mapCentre + ',' + zoom + ',' + 'terrain'
      this.maplinksDirns.hereSatelliteDirns['link'] = hereBase + directions + mapCentre + ',' + zoom + ',' + 'satellite'
      this.maplinksDirns.hereTrafficDirns['link'] = hereBase + directions + mapCentre + ',' + zoom + ',' + 'traffic'
      this.maplinksDirns.herePublicTransportDirns['link'] = hereBase + directions + mapCentre + ',' + zoom + ',' + 'public_transport'

      this.maplinksBasic.hereMap['link'] = hereBase + mapCentre + ',' + zoom + ',' + 'normal'
      this.maplinksBasic.hereTerrain['link'] = hereBase + mapCentre + ',' + zoom + ',' + 'terrain'
      this.maplinksBasic.hereSatellite['link'] = hereBase + mapCentre + ',' + zoom + ',' + 'satellite'
      this.maplinksBasic.hereTraffic['link'] = hereBase + mapCentre + ',' + zoom + ',' + 'traffic'
      this.maplinksBasic.herePublicTransport['link'] = hereBase + mapCentre + ',' + zoom + ',' + 'public_transport'

      if (directions.length > 0) {
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinksDirns, note)
      }
      view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinksBasic)
    }
  },
  {
    site: 'Streetmap',
    image: 'streetmapLogo16x16.png',
    id: 'streetmap',
    prio: 11,
    cat: OutputMaps.category.plain,
    maplinks:
    {
      streetmap: {
        name: 'Map'
      }
    },
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

        this.maplinks.streetmap['link'] = streetmapMapBase + mapCentre + '&A=Y&' + zoomArg

        view.addMapServiceLinks(this.cat, this, this.maplinks)
      }
    }
  },
  {
    site: 'GPX Editor',
    image: 'gpxed16x16.png',
    id: 'gpxeditor',
    cat: OutputMaps.category.special,
    maplinks:
    {
      gpxedmap: {
        name: 'Street Map'
      },
      gpxedsatellite: {
        name: 'Satellite'
      },
      gpxedosm: {
        name: 'OpenStreetMap'
      },
      gpxedocm: {
        name: 'OpenCycleMap'
      }
    },
    generate: function (sourceMapData, view) {
      const gpxEditorBase = 'http://www.gpxeditor.co.uk/?'
      const mapCentre = 'location=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1)
        zoom = 'zoom=' + zoom
      }
      this.maplinks.gpxedmap['link'] = gpxEditorBase + mapCentre + '&' + zoom + '&mapType=roadmap'
      this.maplinks.gpxedsatellite['link'] = gpxEditorBase + mapCentre + '&' + zoom + '&mapType=satellite'
      this.maplinks.gpxedosm['link'] = gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OSM'
      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        this.maplinks.gpxedos = {
          name: 'Ordnance Survey',
          link: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OS'
        }
      }
      this.maplinks.gpxedocm['link'] = gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OCM'

      view.addMapServiceLinks(this.cat, this, this.maplinks, this.note)
    }
  },
  {
    site: 'NGI/IGN',
    image: 'ngi_ign_Logo16x16.png',
    id: 'ngi_ign',
    prio: 13,
    cat: OutputMaps.category.plain,
    maplinks: {
      ngitopo: {
        name: 'CartoWeb topo'
      },
      ngiclassic: {
        name: 'Classic topo'
      },
      ngiaerial: {
        name: 'Aerial'
      }
    },
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

            that.maplinks.ngitopo.link = commonLink + '&baseLayer=ngi.cartoweb.topo.be'
            that.maplinks.ngiclassic.link = commonLink + '&baseLayer=classic.maps'
            that.maplinks.ngiaerial.link = commonLink + '&baseLayer=ngi.ortho'

            view.addMapServiceLinks(this.cat, that, that.maplinks)
          })
        })
    }
  },
  {
    site: 'SunCalc',
    image: 'suncalc_org16x16.png',
    id: 'suncalc',
    cat: OutputMaps.category.misc,
    maplinks:
    {
      suncalc: {
        name: 'Sunrise + sunset times'
      }
    },
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

      this.maplinks.suncalc['link'] = suncalcBase + mapCentre + ',' + zoom + '/' + date + '/' + time + '/1/0'

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'TopoZone',
    image: 'topozone16x16.png',
    id: 'topozone',
    prio: 12,
    cat: OutputMaps.category.plain,
    maplinks:
    {
      topozoneMap: {
        name: 'Topographic'
      }
    },
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

        this.maplinks.topozoneMap['link'] = topozoneBase + 'map/?' + mapCentre + zoom

        view.addMapServiceLinks(this.cat, this, this.maplinks)
      }
    }
  },
  {
    site: 'SysMaps',
    image: 'sysmaps16x16.png',
    id: 'sysmaps',
    prio: 14,
    cat: OutputMaps.category.plain,
    maplinks: {},
    generate: function (sourceMapData, view) {
      const base = 'http://www.sysmaps.co.uk/'
      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        const osBase = base + 'sysmaps_os.html?'
        const mapCentre = '!' + sourceMapData.centreCoords.lat + '~' + sourceMapData.centreCoords.lng

        this.maplinks.sysmapsOS = {
          name: 'OS',
          link: osBase + mapCentre
        }
      } else if (sourceMapData.countryCode === 'de') {
        const deTopoBase = base + 'sysmaps_bkg.html?layers=B00000000000000000000000FFFFFTFFFTFFTTTTT'
        const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng

        this.maplinks.sysmapsDETopo = {
          name: 'DE Topo',
          link: deTopoBase + '&' + mapCentre
        }
      }
      if (Object.keys(this.maplinks).length > 0) {
        view.addMapServiceLinks(this.cat, this, this.maplinks)
      }
    }
  },
  {
    site: 'Boulter',
    image: 'boulterIcon.png',
    id: 'boulter',
    cat: OutputMaps.category.misc,
    maplinks:
    {
      boulterConverter: {
        name: 'Coordinate Converter'
      }
    },
    generate: function (sourceMapData, view) {
      const boulterBase = 'http://boulter.com/gps/'
      const mapCentre = '#' + sourceMapData.centreCoords.lat + '%2C' + sourceMapData.centreCoords.lng

      this.maplinks.boulterConverter['link'] = boulterBase + mapCentre

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'OpenCycleMap',
    image: 'openCycleMapLogo.png',
    id: 'openCycleMap',
    prio: 8,
    cat: OutputMaps.category.plain,
    maplinks:
    {
      ocmOpenCycleMap: {
        name: 'OpenCycleMap'
      },
      ocmTransport: {
        name: 'Transport'
      },
      ocmLandscape: {
        name: 'Landscape'
      },
      ocmOutdoors: {
        name: 'Outdoors'
      },
      ocmTransportDark: {
        name: 'Transport Dark'
      }
    },
    generate: function (sourceMapData, view) {
      const openCycleMapBase = 'http://www.opencyclemap.org/?'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 18)
        zoom = 'zoom=' + zoom
      }

      this.maplinks.ocmOpenCycleMap['link'] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=B0000'
      this.maplinks.ocmTransport['link'] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=0B000'
      this.maplinks.ocmLandscape['link'] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=00B00'
      this.maplinks.ocmOutdoors['link'] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=000B0'
      this.maplinks.ocmTransportDark['link'] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=0000B'

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'OpenWeatherMap',
    image: 'openWeatherMap16x16.png',
    id: 'openweathermap',
    prio: 12,
    cat: OutputMaps.category.misc,
    maplinks:
    {
      owmWeatherMap: {
        name: 'Weather Map'
      }
    },
    generate: function (sourceMapData, view) {
      const owmBase = 'https://openweathermap.org/weathermap?'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=6'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1)
        zoom = 'zoom=' + zoom
      }

      this.maplinks.owmWeatherMap['link'] = owmBase + zoom + '&' + mapCentre

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Flickr',
    image: 'flickr16x16.png',
    id: 'flickr',
    cat: OutputMaps.category.misc,
    maplinks:
    {
      flickr: {
        name: 'World map'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'http://www.flickr.com/map/'
      const mapCentre = 'fLat=' + sourceMapData.centreCoords.lat + '&fLon=' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }
      zoom = 'zl=' + zoom

      this.maplinks.flickr['link'] = base + '?' + mapCentre + '&' + zoom + '&everyone_nearby=1'

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Strava',
    image: 'stravaLogo16x16.png',
    id: 'strava',
    cat: OutputMaps.category.special,
    maplinks:
    {
      stravaBike: {
        name: 'Global Heatmap'
      }
    },
    generate: function (sourceMapData, view) {
      const siteBase = 'https://www.strava.com/heatmap#'
      let zoom = '12'
      const mapCentre = sourceMapData.centreCoords.lng + '/' + sourceMapData.centreCoords.lat

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1)
      }

      this.maplinks.stravaBike['link'] = siteBase + zoom + '/' + mapCentre + '/hot/all'

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Yandex',
    image: 'yandex16x16.png',
    id: 'yandex',
    prio: 7,
    cat: OutputMaps.category.multidirns,
    maplinksDirns:
    {
      yandexMapDirns: {
        name: 'Maps'
      },
      yandexSatelliteDirns: {
        name: 'Satellite'
      },
      yandexHybridDirns: {
        name: 'Hybrid'
      }
    },
    maplinksBasic:
    {
      yandexMap: {
        name: 'Maps'
      },
      yandexSatellite: {
        name: 'Satellite'
      },
      yandexHybrid: {
        name: 'Hybrid'
      }
    },
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

      this.maplinksDirns.yandexMapDirns['link'] = yandexBase + '?' + mapCentre + directions + '&' + zoom
      this.maplinksDirns.yandexSatelliteDirns['link'] = yandexBase + '?l=sat&' + mapCentre + directions + '&' + zoom
      this.maplinksDirns.yandexHybridDirns['link'] = yandexBase + '?l=sat%2Cskl&' + mapCentre + directions + '&' + zoom

      this.maplinksBasic.yandexMap['link'] = yandexBase + '?' + mapCentre + '&' + zoom
      this.maplinksBasic.yandexSatellite['link'] = yandexBase + '?l=sat&' + mapCentre + '&' + zoom
      this.maplinksBasic.yandexHybrid['link'] = yandexBase + '?l=sat%2Cskl&' + mapCentre + '&' + zoom

      if (directions.length > 0) {
        view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinksDirns)
      }
      view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinksBasic)
    }
  },
  {
    site: 'F4map',
    image: 'f4logo16x16.png',
    id: 'F4map',
    prio: 12,
    cat: OutputMaps.category.plain,
    maplinks:
    {
      f4reg: {
        name: 'Regular'
      },
      f4_3d: {
        name: '3d'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'https://demo.f4map.com/'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      let zoom = 'zoom=12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 21)
        zoom = 'zoom=' + zoom
      }
      this.maplinks.f4reg['link'] = base + '#' + mapCentre + '&' + zoom + '&3d=false&camera.theta=0.9'
      this.maplinks.f4_3d['link'] = base + '#' + mapCentre + '&' + zoom

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'OpenTopoMap',
    image: 'opentopomap16x16.png',
    id: 'opentopomap',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      opentopomap: {
        name: 'Topographic map'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'https://opentopomap.org/#map='
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
        zoom = '' + zoom
      }

      this.maplinks.opentopomap['link'] = base + zoom + '/' + mapCentre

      view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks)
    }
  },
  {
    site: 'CalTopo',
    image: 'caltopoLogo16x16.png',
    id: 'caltopo',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      caltopo_mbt: {
        name: 'MapBuilderTopo'
      },
      caltopo_7_5: {
        name: "7.5' Topo"
      },
      caltopo_fs: {
        name: 'Forest Service'
      },
      caltopo_aerial_topo: {
        name: 'Aerial Topo'
      },
      caltopo_hybrid_sat: {
        name: 'Hybrid Satellite'
      }
    },
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

        this.maplinks.caltopo_mbt['link'] = base + '#' + mapCentre + '&' + zoom + '&b=mbt'
        this.maplinks.caltopo_7_5['link'] = base + '#' + mapCentre + '&' + zoom + '&b=t&o=r&n=0.25'
        this.maplinks.caltopo_fs['link'] = base + '#' + mapCentre + '&' + zoom + '&b=t&o=f16a%2Cr&n=1,0.25'
        this.maplinks.caltopo_aerial_topo['link'] = base + '#' + mapCentre + '&' + zoom + '&b=sat&o=t&n=0.5'
        this.maplinks.caltopo_hybrid_sat['link'] = base + '#' + mapCentre + '&' + zoom + '&b=sat&o=r&n=0.3&a=c,mba'

        view.addMapServiceLinks(this.cat, this, this.maplinks)
      }
    }
  },
  {
    site: 'Qwant',
    image: 'qwantLogo16x16.png',
    id: 'qwant',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      qwantmap: {
        name: 'Map'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'https://www.qwant.com/maps'
      const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat) - 1
        zoom = '' + zoom
      }

      this.maplinks.qwantmap['link'] = base + '/#map=' + zoom + '/' + mapCentre

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Mapillary',
    image: 'mapillary16x16.png',
    id: 'mapillary',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      mapillarymap: {
        name: 'Map'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'https://www.mapillary.com/app/'
      const mapCentre = sourceMapData.centreCoords.lat + '&lng=' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat) - 1
        zoom = '' + zoom
      }

      this.maplinks.mapillarymap['link'] = base + '?lat=' + mapCentre + '&z=' + zoom

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Komoot',
    image: 'komootLogo16x16.png',
    id: 'komoot',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      komootMap: {
        name: 'Map'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'https://www.komoot.com/plan/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 1, 18)
        zoom = zoom + 'z'
      }

      this.maplinks.komootMap['link'] = base + '@' + mapCentre + ',' + zoom

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Waymarked Trails',
    image: 'waymarkedtrailshiking16x16.png',
    id: 'waymarkedtrails',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      waymkHiking: {
        name: 'Hiking'
      },
      waymkCycling: {
        name: 'Cycling'
      },
      waymMTB: {
        name: 'MTB'
      },
      waymRiding: {
        name: 'Riding'
      },
      waymkSkating: {
        name: 'Skating'
      },
      waymkSlopes: {
        name: 'Slopes'
      }
    },
    generate: function (sourceMapData, view) {
      const domain = 'waymarkedtrails.org'
      let zoom = '12'
      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 18)
      }
      const location = zoom + '!' + sourceMapData.centreCoords.lat + '!' + sourceMapData.centreCoords.lng

      this.maplinks.waymkHiking['link'] = 'https://hiking.' + domain + '/#?map=' + location
      this.maplinks.waymkCycling['link'] = 'https://cycling.' + domain + '/#?map=' + location
      this.maplinks.waymMTB['link'] = 'https://mtb.' + domain + '/#?map=' + location
      this.maplinks.waymRiding['link'] = 'https://riding.' + domain + '/#?map=' + location
      this.maplinks.waymkSkating['link'] = 'https://skating.' + domain + '/#?map=' + location
      this.maplinks.waymkSlopes['link'] = 'https://slopes.' + domain + '/#?map=' + location

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'OS Maps',
    image: 'osLogo16x16.png',
    id: 'ordnancesurvey',
    cat: OutputMaps.category.plain,
    maplinks:
    {
      ordnancesurvey: {
        name: 'Map'
      }
    },
    generate: function (sourceMapData, view) {
      if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
        const base = 'https://osmaps.ordnancesurvey.co.uk/'
        const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
        let zoom = '12'

        if ('resolution' in sourceMapData) {
          zoom = calculateStdZoomFromResolution(
            sourceMapData.resolution, sourceMapData.centreCoords.lat, 1, 18)
        }

        this.maplinks.ordnancesurvey['link'] = base + mapCentre + ',' + zoom

        view.addMapServiceLinks(this.cat, this, this.maplinks)
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
    maplinks:
    {
      windywind: {
        name: 'Wind'
      },
      windyradar: {
        name: 'Weather radar'
      },
      windyclouds: {
        name: 'Clouds'
      }
    },
    generate: function (sourceMapData, view) {
      const base = 'https://www.windy.com/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      let zoom = '12'

      if ('resolution' in sourceMapData) {
        zoom = calculateStdZoomFromResolution(
          sourceMapData.resolution, sourceMapData.centreCoords.lat)
      }

      this.maplinks.windywind['link'] = base + '?' + mapCentre + ',' + zoom
      this.maplinks.windyradar['link'] = base + '-Weather-radar-radar?radar,' + mapCentre + ',' + zoom
      this.maplinks.windyclouds['link'] = base + '-Clouds-clouds?clouds,' + mapCentre + ',' + zoom

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  },
  {
    site: 'Flightradar24',
    image: 'flightradar24.png',
    id: 'flightradar24',
    cat: OutputMaps.category.misc,
    maplinks:
    {
      flightradar24: {
        name: 'Live Flight Tracker'
      }
    },
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

      this.maplinks.flightradar24['link'] = base + mapCentre + '/' + zoom

      view.addMapServiceLinks(this.cat, this, this.maplinks)
    }
  }
]

export default OutputMaps
