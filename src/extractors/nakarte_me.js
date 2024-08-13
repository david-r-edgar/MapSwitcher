/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /m=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
  const [, zoom, lat, lng] = window.location.hash.match(re)
  if (lat && lng && zoom) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }
  resolve(sourceMapData)
})
