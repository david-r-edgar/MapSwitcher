/* global
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const mapCentreRe = /map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/
  const [, zoom, lat, lng] = window.location.hash.match(mapCentreRe)
  if (zoom && lat && lng) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }

  try {
    const routeRe = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/
    const [, lat1, lng1, lat2, lng2] = window.location.search.match(routeRe)

    if (lat1 && lng1 && lat2 && lng2) {
      const routeFrom = document.getElementById('route_from').value
      const routeTo = document.getElementById('route_to').value
      sourceMapData.directions = {
        route: [
          { address: routeFrom },
          { address: routeTo }
        ]
      }

      sourceMapData.directions.route[0].coords =
        {
          lat: lat1,
          lng: lng1
        }
      sourceMapData.directions.route[1].coords =
        {
          lat: lat2,
          lng: lng2
        }
    }
  } catch (err) {
    // if we can't extract directions, ignore
  }

  if (sourceMapData.directions) {
    const [, mode] = window.location.search.match(/engine=[a-zA-Z_]+_([a-z]+)&/)
    switch (mode) {
      case 'bicycle':
      case 'bike':
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
    sourceMapData.resolution = calculateResolutionFromStdZoom(8, calcCentreLat)
  }

  resolve(sourceMapData)
})
