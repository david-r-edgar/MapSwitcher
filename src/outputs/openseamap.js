export default {
  site: 'OpenSeaMap',
  image: 'openSeaMapLogo16x16.png',
  id: 'openseamap',
  generate: function (sourceMapData, view) {
    const openSeaMapBase = 'http://map.openseamap.org/?'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
    const zoom = 'zoom=' + sourceMapData.getStandardZoom({ min: 0, max: 18 })

    const layers = 'layers=BFTFFTTFFTF0FFFFFFFFFF'

    const mapLinks = [{
      name: 'Map',
      url: openSeaMapBase + zoom + '&' + mapCentre + '&' + layers
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
