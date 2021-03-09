export default {
  generate: function (sourceMapData, view) {
    const owmBase = 'https://openweathermap.org/weathermap?'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
    const zoom = 'zoom=' + sourceMapData.getStandardZoom({ default: 6, min: 1 })

    const mapLinks = [{
      name: 'Weather Map',
      url: owmBase + zoom + '&' + mapCentre
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
