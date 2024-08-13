export default {
  generate: function (sourceMapData, view) {
    const base = 'https://www.komoot.com/plan/'
    const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom({ min: 1, max: 18 }) + 'z'

    const mapLinks = [{
      name: 'Map',
      url: base + '@' + mapCentre + ',' + zoom
    }]

    view.addMapServiceLinks(this, mapLinks)
  }
}
