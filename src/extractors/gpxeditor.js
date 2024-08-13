/* global
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor((resolve, reject) => {
  const re = /location=([-0-9.]+),([-0-9.]+)&zoom=([0-9]+)/
  const coordArray = window.location.search.match(re)
  if (coordArray && coordArray.length > 3) {
    resolve({
      centreCoords: { lat: coordArray[1], lng: coordArray[2] },
      resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
      nonUpdating: window.location.hostname,
      locationDescr: 'non-updating URL'
    })
  } else {
    reject()
  }
})
