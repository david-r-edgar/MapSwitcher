export default {
  id: 'MapWithAIRapiD',
  generate: function (sourceMapData, view) {
    const base = 'https://mapwith.ai/rapid'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const mapLinks = [
      {
        name: 'Maxar Premium',
        url: base + '#background=Maxar-Premium&map=' + zoom + '/' + mapCentre
      }
    ]

    view.addMapServiceLinks(this, mapLinks)
  }
}
