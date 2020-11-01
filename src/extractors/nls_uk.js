/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /zoom=([0-9.]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/
  const [, zoom, lat, lng] = window.location.hash.match(re)
  if (lat && lng && zoom) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }
  resolve(sourceMapData)
})
