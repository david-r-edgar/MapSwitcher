/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const re = /@([-a-z]+),([-a-z]+),([a-z]+)/
  const matchArr = window.location.pathname.match(re)
  if (matchArr && matchArr.length > 3) {
    // digits are encoded via a simple substitution cipher
    const translateToNumber = function (str) {
      const input = 'fljtaseoqvi'
      const output = '0123456789.'
      const index = x => input.indexOf(x)
      const translate = x => index(x) > -1 ? output[index(x)] : x
      return +str.split('').map(translate).join('')
    }
    const [lat, lng, zoom] = matchArr.slice(1).map(translateToNumber)
    sourceMapData.centreCoords = { lat, lng }
    sourceMapData.resolution = calculateResolutionFromStdZoom(zoom, lat)
  }
  resolve(sourceMapData)
})
