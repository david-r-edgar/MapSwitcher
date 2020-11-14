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

  try {
    const [, coordPairs] = window.location.hash.match(/lonlats=([-0-9.,;]+)/)
    if (coordPairs) {
      sourceMapData.directions = {
        mode: 'bike', // default (if no profile specified)
        route: []
      }
      coordPairs.split(';').forEach(coord => {
        const [lng, lat] = coord.split(',')
        sourceMapData.directions.route.push({ coords: { lat, lng } })
      })
      const profileMatch = window.location.hash.match(/profile=([a-zA-Z-]+)/)
      if (profileMatch) {
        const [, profile] = profileMatch
        if (profile.includes('bike')) {
          sourceMapData.directions.mode = 'bike'
        } else if (profile.includes('velomobile')) {
          sourceMapData.directions.mode = 'bike'
        } else if (profile.includes('hiking')) {
          sourceMapData.directions.mode = 'foot'
        } else if (profile.includes('rail')) {
          sourceMapData.directions.mode = 'transit'
        } else if (profile.includes('car')) {
          sourceMapData.directions.mode = 'car'
        }
      }
    }
  } catch (err) {
    // ignore
  }

  resolve(sourceMapData)
})
