/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const coordRe = /lat=([-0-9.]+)&lon=([-0-9.]+)/
  const [, lat, lng] = window.location.search.match(coordRe)
  if (lat && lng) {
    sourceMapData.centreCoords = { lat, lng }
  }
  const zoomRe = /zoom=([0-9]+)/
  const [, zoom] = window.location.search.match(zoomRe)
  if (zoom) {
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }
  sourceMapData.nonUpdating = window.location.hostname
  sourceMapData.locationDescr = 'last searched location'
  resolve(sourceMapData)
})
