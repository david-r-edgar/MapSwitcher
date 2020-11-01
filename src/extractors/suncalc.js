/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  const re = /#\/([-0-9.]+),([-0-9.]+),([0-9]+)/
  const coordArray = window.location.hash.match(re)
  if (coordArray && coordArray.length >= 3) {
    resolve({
      centreCoords: { lat: coordArray[1], lng: coordArray[2] },
      resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
      locationDescr: 'current pin location'
    })
  } else {
    reject()
  }
})
