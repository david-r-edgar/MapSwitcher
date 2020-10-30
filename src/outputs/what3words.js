export default {
  site: 'what3words',
  image: 'w3wLogo.png',
  id: 'what3words',
  generate: function (sourceMapData, view) {
    const w3wBase = 'https://map.what3words.com/'
    const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng

    const mapLinks = [{
      name: 'Map',
      url: w3wBase + mapCentre
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
