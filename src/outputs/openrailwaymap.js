export default {
  generate: function (sourceMapData, view) {
    const base = 'https://www.openrailwaymap.org'
    const mapCentre = `lat=${sourceMapData.centreCoords.lat}&lon=${sourceMapData.centreCoords.lng}`
    const zoom = 'zoom=' + sourceMapData.getStandardZoom({ min: 1 })

    const mapLinks = [{
      name: 'Infrastructure',
      url: `${base}/?style=standard&lang=en&${mapCentre}&${zoom}`
    }]

    view.addMapServiceLinks(this, mapLinks)
  }
}
