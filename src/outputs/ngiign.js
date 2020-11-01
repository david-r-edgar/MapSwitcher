/* global
  browser, chrome */

var browserRoot = chrome?.runtime ? chrome : browser // eslint-disable-line no-global-assign

export default {
  generate: function (sourceMapData, view) {
    if (sourceMapData.countryCode !== 'be') {
      return
    }

    const ngiBase = 'https://topomapviewer.ngi.be/'
    const that = this

    // NGI uses the Lambert 2008 projection, grs80 ellipsoid
    // We use an external service to calculate coordinates from the regular WGS84 lat & long
    const request = new window.Request(`http://www.loughrigg.org/wgs84Lambert/wgs84_lambert/${sourceMapData.centreCoords.lat}/${sourceMapData.centreCoords.lng}`)
    window.fetch(request)
      .then(response => response.json())
      .then(data => {
        const mapCentre = 'x=' + data.easting + '&y=' + data.northing

        const zoom = sourceMapData.getStandardZoom({
          default: 6,
          min: 7,
          max: 19
        }) - 7

        let lang = ''
        // extract the highest priority language (fr or nl) from browser preferences
        browserRoot.i18n.getAcceptLanguages(function (list) {
          for (const listLang of list) {
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
          view.addMapServiceLinks(that, mapLinks)
        })
      })
  }
}
