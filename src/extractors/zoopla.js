/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const mapsrc = document.querySelector('*[data-testid="static-map-container"] picture source')
  console.log(mapsrc.srcset)

  const re1 = /center=([-0-9.]+),([-0-9.]+)/
  const coordArray = mapsrc.srcset.match(re1)

  if (coordArray?.length > 2) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
  }
  sourceMapData.resolution = calculateResolutionFromStdZoom(
    17, coordArray[1])

  resolve(sourceMapData)
})
