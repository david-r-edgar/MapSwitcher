export default {
  generate: function (sourceMapData, view) {
    const stamenBase = 'http://maps.stamen.com/'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom({ min: 0, max: 17 })

    const mapLinks = [
      {
        name: 'Watercolor',
        url: stamenBase + 'watercolor/#' + zoom + '/' + mapCentre
      },
      {
        name: 'Toner',
        url: stamenBase + 'toner/#' + zoom + '/' + mapCentre
      },
      {
        name: 'Terrain',
        url: stamenBase + 'terrain/#' + zoom + '/' + mapCentre
      }
    ]
    view.addMapServiceLinks(this, mapLinks)
  }
}
