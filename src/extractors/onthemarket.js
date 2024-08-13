/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const latlon = document.evaluate('//script[contains(.,"MEDIA_PREFIX")  and contains(.,"location")]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  const lat = latlon.text.match(/lat:[ ']+([0-9.-]+)/)[1]
  const lon = latlon.text.match(/lon:[ ']+([0-9.-]+)/)[1]

  if (lat.length > 3 && lon.length > 3) {
    sourceMapData.centreCoords = { lat: lat, lng: lon }
  }
  sourceMapData.resolution = calculateResolutionFromStdZoom(
    17, sourceMapData.centreCoords.lat)

  resolve(sourceMapData)
})
