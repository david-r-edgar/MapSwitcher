export default {
  id: 'cyclosm',
  generate: function (sourceMapData, view) {
    const base = 'https://www.cyclosm.org/'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

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

    view.addMapServiceLinks(this, mapLinks)
  }
}
