/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /#map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
  const coordArray = window.location.hash.match(re)
  if (coordArray && coordArray.length > 3) {
    sourceMapData.centreCoords = { lat: coordArray[2], lng: coordArray[3] }
    sourceMapData.resolution =
      calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
  }
  resolve(sourceMapData)
})
