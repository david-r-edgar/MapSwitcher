export default {
  site: 'Windy',
  image: 'windyLogo16x16.png',
  id: 'windy',
  generate: function (sourceMapData, view) {
    const base = 'https://www.windy.com/'
    const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const mapLinks = [
      {
        name: 'Wind',
        url: base + '?' + mapCentre + ',' + zoom
      },
      {
        name: 'Weather radar',
        url: base + '-Weather-radar-radar?radar,' + mapCentre + ',' + zoom
      },
      {
        name: 'Clouds',
        url: base + '-Clouds-clouds?clouds,' + mapCentre + ',' + zoom
      }
    ]

    view.addMapServiceLinks(this, mapLinks)
  }
}
