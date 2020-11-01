/* global
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /map=([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
  const [, zoom, lat, lng] = window.location.hash.match(re)
  if (lat && lng && zoom) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }

  const routeRe = /lonlats=([-0-9.,;]+)/
  const routeReArr = window.location.hash.match(routeRe)
  if (routeReArr && routeReArr.length > 1) {
    sourceMapData.directions = {}
    sourceMapData.directions.route = []
    routeReArr[1].split(';').forEach(lonlat => {
      const [lng, lat] = lonlat.split(',')
      sourceMapData.directions.route.push({ coords: { lat, lng } })
    })
  }

  resolve(sourceMapData)
})
