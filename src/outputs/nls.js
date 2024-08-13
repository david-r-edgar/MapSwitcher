export default {
  generate: function (sourceMapData, view) {
    const base = 'https://maps.nls.uk/geo/explore/'
    const mapCentre = `lat=${sourceMapData.centreCoords.lat}&lon=${sourceMapData.centreCoords.lng}`
    const zoom = `zoom=${sourceMapData.getStandardZoom()}`

    const mapLinks = [
      {
        name: 'Explore',
        url: `${base}#${zoom}&${mapCentre}&layers=6&b=1`
      },
      {
        name: 'Side by side',
        url: `${base}side-by-side/#${zoom}&${mapCentre}`
      }
    ]

    if (sourceMapData.countryCode === 'gb') {
      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
