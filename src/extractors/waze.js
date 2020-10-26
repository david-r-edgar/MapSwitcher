/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const centrePermalink = document.evaluate('//*[@class="wm-permalink-control__link"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.href

  const lonArray = centrePermalink.match(/lon=([-0-9.]+)/)
  const latArray = centrePermalink.match(/lat=([-0-9.]+)/)
  if (lonArray && lonArray.length > 1 && latArray && latArray.length > 1) {
    sourceMapData.centreCoords = { lat: latArray[1], lng: lonArray[1] }
    const zoomArray = centrePermalink.match(/zoom=([0-9]+)/)
    if (zoomArray && zoomArray.length > 1) {
      sourceMapData.resolution =
        calculateResolutionFromStdZoom(zoomArray[1], latArray[1])
    }
  }

  const re2 = /from_lat=([-0-9.]+)&from_lon=([-0-9.]+)&to_lat=([-0-9.]+)&to_lon=([-0-9.]+)/
  const routeCoordsArray = centrePermalink.match(re2)
  if (routeCoordsArray && routeCoordsArray.length > 4) {
    sourceMapData.directions = {
      route: [
        {
          coords: {
            lat: routeCoordsArray[1],
            lng: routeCoordsArray[2]
          }
        },
        {
          coords: {
            lat: routeCoordsArray[3],
            lng: routeCoordsArray[4]
          }
        }
      ]
    }
  }
  resolve(sourceMapData)
})
