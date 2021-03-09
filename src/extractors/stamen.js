/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  const re = /#[a-zA-Z]*\/?([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
  const coordArray = window.location.hash.match(re)
  if (coordArray && coordArray.length > 3) {
    resolve({
      centreCoords: { lat: coordArray[2], lng: coordArray[3] },
      resolution: calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
    })
  } else {
    reject()
  }
})
