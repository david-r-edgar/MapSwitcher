export default {
  generate: function (sourceMapData, view) {
    const base = 'https://brouter.de/brouter-web'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const mapLinksBasic = [
      {
        name: 'OpenStreetMap',
        url: base + '#map=' + zoom + '/' + mapCentre + '/standard'
      },
      {
        name: 'OpenTopoMap',
        url: base + '#map=' + zoom + '/' + mapCentre + '/OpenTopoMap'
      }
    ]
    view.addMapServiceLinks(this, mapLinksBasic)
  }
}
