export default {
  site: 'Strava',
  image: 'stravaLogo16x16.png',
  id: 'strava',
  generate: function (sourceMapData, view) {
    const siteBase = 'https://www.strava.com/heatmap#'
    const mapCentre = sourceMapData.centreCoords.lng + '/' + sourceMapData.centreCoords.lat
    const zoom = sourceMapData.getStandardZoom({ min: 1 })

    const mapLinks = [{
      name: 'Global Heatmap',
      url: siteBase + zoom + '/' + mapCentre + '/hot/all'
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
