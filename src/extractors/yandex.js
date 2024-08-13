/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  const coordRe = /ll=([-0-9.]+)%2C([-0-9.]+)/
  const coordArray = window.location.search.match(coordRe)
  if (coordArray && coordArray.length > 2) {
    const sourceMapData = {
      centreCoords: { lat: coordArray[2], lng: coordArray[1] }
    }
    const zoomArray = window.location.search.match(/z=([0-9]+)/)
    if (zoomArray && zoomArray.length > 1) {
      sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[2])
    }
    const routeString = decodeURIComponent(window.location.search).match(/rtext=([-0-9.~,]+)/)
    if (routeString && routeString.length > 1) {
      sourceMapData.directions = {
        route: []
      }
      const routeCoordPairs = routeString[1].split('~')
      for (const coordPair of routeCoordPairs) {
        const [lat, lng] = coordPair.split(',')
        sourceMapData.directions.route.push({ coords: { lat, lng } })
      }
      const mode = window.location.search.match(/rtt=([a-z]+)/)
      if (mode && mode.length > 1) {
        switch (mode[1]) {
          case 'auto':
            sourceMapData.directions.mode = 'car'
            break
          case 'bc':
            sourceMapData.directions.mode = 'bike'
            break
          case 'pd':
            sourceMapData.directions.mode = 'foot'
            break
          case 'mt':
            sourceMapData.directions.mode = 'transit'
            break
        }
      }
    }
    resolve(sourceMapData)
  } else {
    reject()
  }
})
