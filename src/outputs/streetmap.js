/* global
  calculateScaleFromResolution,
  CoordTransform, OsGridRef, LatLon */

export default {
  site: 'Streetmap',
  image: 'streetmapLogo16x16.png',
  id: 'streetmap',
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
      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
