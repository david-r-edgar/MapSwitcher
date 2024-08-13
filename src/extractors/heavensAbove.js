/* global
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /lat=([-0-9.]+)&lng=([-0-9.]+)/
  const [, lat, lng] = window.location.search.match(re)
  if (lat && lng) {
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.locationDescr = 'location currently set'
  }
  resolve(sourceMapData)
})
