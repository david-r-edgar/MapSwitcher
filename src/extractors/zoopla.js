/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const latlon = document.evaluate('//script[contains(.,"mapData ")  and contains(.,"bounding_box")]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  const lat = latlon.text.match(/latitude.:([0-9.-]+)/)[1]
  const lon = latlon.text.match(/longitude.:([0-9.-]+)/)[1]

  if (lat.length > 3 && lon.length > 3) {
    sourceMapData.centreCoords = { lat: lat, lng: lon }
  }
  sourceMapData.resolution = calculateResolutionFromStdZoom(
    17, sourceMapData.centreCoords.lat)

  resolve(sourceMapData)
})
