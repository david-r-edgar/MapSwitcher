/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  const re = /\?(?:wma=)?([-0-9.]+)_([-0-9.]+)_[0-9]+_[0-9]+_[a-z]{0,3}_([0-9]+)/
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
