/* global
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /([-0-9.]+)%2C([-0-9.]+)/
  const [, lat, lng] = window.location.hash.match(re)
  if (lat && lng) {
    sourceMapData.centreCoords = { lat, lng }
  }
  resolve(sourceMapData)
})
