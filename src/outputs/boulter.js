export default {
  generate: function (sourceMapData, view) {
    const boulterBase = 'http://boulter.com/gps/'
    const mapCentre = '#' + sourceMapData.centreCoords.lat + '%2C' + sourceMapData.centreCoords.lng

    const mapLinks = [{
      name: 'Coordinate Converter',
      url: boulterBase + mapCentre
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
