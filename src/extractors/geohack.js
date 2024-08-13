/* global
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const geoURIelem = document.querySelector('a[href^="geo:"')
  const [lat, lng] = geoURIelem.href.split(':')[1].split(',')
  if (lat && lng) {
    sourceMapData.centreCoords = { lat, lng }
  }
  resolve(sourceMapData)
})
