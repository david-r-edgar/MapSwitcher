/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re1 = /lat=([-0-9.]+)&lng=([-0-9.]+)/
  const coordArray = window.location.search.match(re1)
  if (coordArray && coordArray.length >= 3) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
  }
  const re2 = /z=([0-9]+)/
  const zoomArray = window.location.search.match(re2)
  if (zoomArray && zoomArray.length > 1) {
    sourceMapData.resolution = calculateResolutionFromStdZoom(
      +zoomArray[1] + 1, sourceMapData.centreCoords.lat)
  }
  resolve(sourceMapData)
})
