/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /x=([0-9.]+)&y=([0-9.]+)&zoom=([0-9]+)/
  const [, easting, northing, zoom] = window.location.search.match(re)
  if (easting && northing && zoom) {
    sourceMapData.lambertCentreCoords = { e: easting, n: northing }
    sourceMapData.resolution = calculateResolutionFromStdZoom(+zoom + 7, 50.8)
  }
  resolve(sourceMapData)
})
