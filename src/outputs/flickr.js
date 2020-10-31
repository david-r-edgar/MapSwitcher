export default {
  id: 'flickr',
  generate: function (sourceMapData, view) {
    const base = 'http://www.flickr.com/map/'
    const mapCentre = 'fLat=' + sourceMapData.centreCoords.lat + '&fLon=' + sourceMapData.centreCoords.lng
    const zoom = 'zl=' + sourceMapData.getStandardZoom({ min: 1 })

    const mapLinks = [{
      name: 'World map',
      url: base + '?' + mapCentre + '&' + zoom + '&everyone_nearby=1'
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
