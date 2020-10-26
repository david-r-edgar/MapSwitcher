/* global
  XPathResult,
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re1 = /map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
  const coordArray = window.location.hash.match(re1)
  if (coordArray && coordArray.length >= 4) {
    sourceMapData.centreCoords = { lat: coordArray[2], lng: coordArray[3] }
    sourceMapData.resolution = calculateResolutionFromStdZoom(
      coordArray[1], sourceMapData.centreCoords.lat)
  }

  const re2 = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/
  const routeCoordsArray = window.location.search.match(re2)

  if (routeCoordsArray && routeCoordsArray.length > 4) {
    const routeFrom = document.evaluate('//*[@id="route_from"]',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
    const routeTo = document.evaluate('//*[@id="route_to"]',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
    sourceMapData.directions = {
      route: [
        { address: routeFrom },
        { address: routeTo }
      ]
    }

    sourceMapData.directions.route[0].coords =
      {
        lat: routeCoordsArray[1],
        lng: routeCoordsArray[2]
      }
    sourceMapData.directions.route[1].coords =
      {
        lat: routeCoordsArray[3],
        lng: routeCoordsArray[4]
      }
  }

  const re3 = /engine=[a-zA-Z_]+_([a-z]+)&/
  const modeArray = window.location.search.match(re3)

  if (modeArray && modeArray.length > 1) {
    switch (modeArray[1]) {
      case 'bicycle':
        sourceMapData.directions.mode = 'bike'
        break
      case 'car':
        sourceMapData.directions.mode = 'car'
        break
      case 'foot':
        sourceMapData.directions.mode = 'foot'
        break
    }
  }

  // sometimes (eg. after a search?) osm has directions but no centre coords
  if (!sourceMapData.centreCoords &&
      sourceMapData.directions.route.length >= 2) {
    const calcCentreLat = (+sourceMapData.directions.route[0].coords.lat +
      +sourceMapData.directions.route[1].coords.lat) / 2
    const calcCentreLng = (+sourceMapData.directions.route[0].coords.lng +
      +sourceMapData.directions.route[1].coords.lng) / 2
    sourceMapData.centreCoords = {
      lat: calcCentreLat,
      lng: calcCentreLng
    }
    sourceMapData.resolution = calculateResolutionFromStdZoom(
      8, calcCentreLat)
  }

  resolve(sourceMapData)
})
