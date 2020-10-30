export default {
  site: 'OS Maps',
  image: 'osLogo16x16.png',
  id: 'ordnancesurvey',
  generate: function (sourceMapData, view) {
    if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
      const base = 'https://osmaps.ordnancesurvey.co.uk/'
      const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      const zoom = sourceMapData.getStandardZoom({ min: 1, max: 18 })

      const mapLinks = [{
        name: 'Map',
        url: base + mapCentre + ',' + zoom
      }]

      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
