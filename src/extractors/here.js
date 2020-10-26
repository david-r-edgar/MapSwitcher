/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /map=([-0-9.]+),([-0-9.]+),([0-9]+),/
  const coordArray = window.location.search.match(re)
  if (coordArray && coordArray.length > 3) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
    sourceMapData.resolution = calculateResolutionFromStdZoom(
      coordArray[3], sourceMapData.centreCoords.lat)
  }

  // check if pathname contains directions
  let state = -1
  for (const directions of window.location.pathname.split('/')) {
    if (state < 0) {
      if (directions === 'directions') {
        sourceMapData.directions = {}
        state = 0
      }
    } else if (state === 0) {
      switch (directions) {
        case 'mix':
          break
        case 'walk':
          sourceMapData.directions.mode = 'foot'
          break
        case 'bicycle':
          sourceMapData.directions.mode = 'bike'
          break
        case 'drive':
          sourceMapData.directions.mode = 'car'
          break
        case 'publicTransport':
          sourceMapData.directions.mode = 'transit'
          break
      }
      state = 1
      sourceMapData.directions.route = []
    } else if (state > 0) {
      let wptObj
      const re1 = /^([^:]+):/
      const addrArray = directions.match(re1)
      if (addrArray && addrArray.length > 1) {
        const addr = addrArray[1].replace(/-/g, ' ')
        wptObj = { address: addr }

        const re2 = /:loc-([^:]+)/
        const dirArray = directions.match(re2)
        if (dirArray && dirArray.length > 1) {
          const locnFromB64 = window.atob(dirArray[1])
          const re3 = /lat=([-0-9.]+);lon=([-0-9.]+)/
          const coordsArr = locnFromB64.match(re3)
          if (coordsArr.length > 2) {
            wptObj.coords = { lat: coordsArr[1], lng: coordsArr[2] }
          }
        }
        const re4 = /:([-0-9.]+),([-0-9.]+)/
        const coordsArray = directions.match(re4)
        if (coordsArray && coordsArray.length > 2) {
          wptObj.coords =
                        { lat: coordsArray[1], lng: coordsArray[2] }
        }
      }
      sourceMapData.directions.route.push(wptObj)
    }
  }
  if (sourceMapData.directions && sourceMapData.directions.route) {
    for (const wptIndex in sourceMapData.directions.route) {
      // URL can contain empty waypoints, when locations have not yet been entered
      // into the search box. So we need to do a bit of clean-up.
      if (undefined === sourceMapData.directions.route[wptIndex]) {
        sourceMapData.directions.route.splice(wptIndex, 1)
      }
    }
    if (sourceMapData.directions.route.length < 2) {
      // if directions don't contain at least two points, they are considered invalid
      delete sourceMapData.directions
    }
  }
  resolve(sourceMapData)
})
