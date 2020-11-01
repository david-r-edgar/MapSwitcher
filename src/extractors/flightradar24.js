/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /([-0-9.]+),([-0-9.]+)\/([0-9]+)$/
  const [, lat, lng, zoom] = window.location.pathname.match(re)
  if (lat && lng && zoom) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }
  resolve(sourceMapData)
})
