/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /@([-0-9.]+),([-0-9.]+),([0-9]+)z/
  const coordArray = window.location.pathname.match(re)
  if (coordArray && coordArray.length > 3) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
    sourceMapData.resolution =
      calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
  }
  resolve(sourceMapData)
})
