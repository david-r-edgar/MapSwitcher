export default {
  site: 'OpenCycleMap',
  image: 'openCycleMapLogo.png',
  id: 'openCycleMap',
  generate: function (sourceMapData, view) {
    const openCycleMapBase = 'http://www.opencyclemap.org/?'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
    const zoom = 'zoom=' + sourceMapData.getStandardZoom({ min: 0, max: 18 })

    const mapLinks = [
      {
        name: 'OpenCycleMap',
        url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=B0000'
      },
      {
        name: 'Transport',
        url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=0B000'
      },
      {
        name: 'Landscape',
        url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=00B00'
      },
      {
        name: 'Outdoors',
        url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=000B0'
      },
      {
        name: 'Transport Dark',
        url: openCycleMapBase + zoom + '&' + mapCentre + '&layers=0000B'
      }
    ]

    view.addMapServiceLinks(this, mapLinks)
  }
}
