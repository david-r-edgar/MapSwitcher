/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  const re = /lat=([-0-9.]+)&lon=([-0-9.]+)/
  const coordArray = window.location.search.match(re)
  if (coordArray && coordArray.length > 2) {
    const sourceMapData = {
      centreCoords: { lat: coordArray[1], lng: coordArray[2] },
      nonUpdating: window.location.hostname,
      locationDescr: 'non-updating URL'
    }
    const zoomArray = window.location.search.match(/zoom=([0-9]+)/)
    if (zoomArray && zoomArray.length > 1) {
      sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[1])
    }
    resolve(sourceMapData)
  } else {
    reject()
  }
})
