/* global
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor((resolve, reject) => {
  const re = /ll=([-0-9.]+),([-0-9.]+)/
  const coordArray = window.location.hash.match(re)
  if (coordArray && coordArray.length > 2) {
    const sourceMapData = {
      centreCoords: { lat: coordArray[1], lng: coordArray[2] },
      locationDescr: 'map centre specified in URL'
    }
    const zoomArray = window.location.hash.match(/z=([0-9]+)/)
    if (zoomArray && zoomArray.length > 1) {
      sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[1])
    }
    resolve(sourceMapData)
  } else {
    reject()
  }
})
