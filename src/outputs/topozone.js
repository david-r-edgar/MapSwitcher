export default {
  generate: function (sourceMapData, view) {
    if (sourceMapData.countryCode === 'us') {
      const topozoneBase = 'http://www.topozone.com/'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      const zoom = '&zoom=' + sourceMapData.getStandardZoom({ min: 1, max: 16 })

      const mapLinks = [{
        name: 'Topographic',
        url: topozoneBase + 'map/?' + mapCentre + zoom
      }]
      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
