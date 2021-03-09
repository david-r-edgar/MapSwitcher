/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const lat = document.evaluate('/html/head/meta[@property="og:latitude"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.content
  const lon = document.evaluate('/html/head/meta[@property="og:longitude"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.content

  if (lat.length > 3 && lon.length > 3) {
    sourceMapData.centreCoords = { lat: lat, lng: lon }
  }
  sourceMapData.resolution = calculateResolutionFromStdZoom(
    17, sourceMapData.centreCoords.lat)

  resolve(sourceMapData)
})
