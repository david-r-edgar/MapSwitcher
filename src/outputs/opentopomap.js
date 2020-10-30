export default {
  site: 'OpenTopoMap',
  image: 'opentopomap16x16.png',
  id: 'opentopomap',
  generate: function (sourceMapData, view) {
    const base = 'https://opentopomap.org/#map='
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const mapLinks = [{
      name: 'Topographic map',
      url: base + zoom + '/' + mapCentre
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
