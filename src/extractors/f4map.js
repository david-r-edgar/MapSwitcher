/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /#lat=([-0-9.]+)&lon=([-0-9.]+)&zoom=([0-9.]+)/
  const coordArray = window.location.hash.match(re)
  if (coordArray && coordArray.length > 3) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
    sourceMapData.resolution =
      calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
  }
  resolve(sourceMapData)
})
