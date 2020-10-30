export default {
  site: 'Qwant',
  image: 'qwantLogo16x16.png',
  id: 'qwant',
  generate: function (sourceMapData, view) {
    const base = 'https://www.qwant.com/maps'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom() - 1

    const mapLinks = [{
      name: 'Map',
      url: base + '/#map=' + zoom + '/' + mapCentre
    }]

    view.addMapServiceLinks(this, mapLinks)
  }
}
