export default {
  id: 'flightradar24',
  generate: function (sourceMapData, view) {
    const base = 'https://www.flightradar24.com/'
    const roundedLat = Math.round(sourceMapData.centreCoords.lat * 100) / 100
    const roundedLng = Math.round(sourceMapData.centreCoords.lng * 100) / 100

    const mapCentre = roundedLat + ',' + roundedLng
    const zoom = sourceMapData.getStandardZoom({
      default: 6,
      min: 2,
      max: 20
    })

    const mapLinks = [{
      name: 'Live Flight Tracker',
      url: base + mapCentre + '/' + zoom
    }]

    view.addMapServiceLinks(this, mapLinks)
  }
}
