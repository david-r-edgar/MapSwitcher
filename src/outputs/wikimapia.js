export default {
  site: 'Wikimapia',
  image: 'wikimapiaLogo16x16.png',
  id: 'wikimapia',
  generate: function (sourceMapData, view) {
    const wikimapiaBase = 'http://wikimapia.org/#lang=en&'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
    const zoom = 'z=' + sourceMapData.getStandardZoom()

    const mapLinks = [{
      name: 'Maps',
      url: wikimapiaBase + mapCentre + '&' + zoom + '&m=w'
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
