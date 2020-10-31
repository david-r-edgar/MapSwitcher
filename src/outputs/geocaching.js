export default {
  generate: function (sourceMapData, view) {
    const geocachingBase = 'https://www.geocaching.com/'
    const note = 'geocaching.com requires login to see the map (free sign-up)'
    const { lat, lng } = sourceMapData.centreCoords
    const zoom = sourceMapData.getStandardZoom({ default: 14 })
    const mapLinks = [
      {
        name: 'Browse Map',
        url: `${geocachingBase}map/#?ll=${lat},${lng}&z=${zoom}`
      },
      {
        name: 'Search Map',
        url: `${geocachingBase}play/map/?lat=${lat}&lng=${lng}&zoom=${zoom}`
      }
    ]
    view.addMapServiceLinks(this, mapLinks, note)
  }
}
