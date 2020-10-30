export default {
  site: 'nakarte.me',
  image: 'nakarte16x16.png',
  id: 'nakarte',
  generate: function (sourceMapData, view) {
    const base = 'https://www.nakarte.me/'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const mapLinks = [
      {
        name: 'OpenStreetMap',
        url: base + '#m=' + zoom + '/' + mapCentre + '&l=O'
      },
      {
        name: 'mapy.cz tourist',
        url: base + '#m=' + zoom + '/' + mapCentre + '&l=Czt'
      },
      {
        name: 'ESRI Satellite',
        url: base + '#m=' + zoom + '/' + mapCentre + '&l=E'
      },
      {
        name: 'Topomapper 1km',
        url: base + '#m=' + zoom + '/' + mapCentre + '&l=T'
      }
    ]

    view.addMapServiceLinks(this, mapLinks)
  }
}
