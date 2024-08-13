/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const href = document.getElementById('permalinkButton').href
  const re = /lat=([-0-9.]+)&lon=([-0-9.]+)&zoom=([0-9]+)/
  const [, lat, lng, zoom] = href.match(re)
  if (lat && lng && zoom) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }
  resolve(sourceMapData)
})
