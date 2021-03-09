/* global
  registerExtractor,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  function urlMethod () {
    const re = /#([0-9.]+)\/([-0-9.]+)\/([-0-9.]+)/
    const coordArray = window.location.hash.match(re)
    if (coordArray && coordArray.length > 3) {
      resolve({
        centreCoords: { lat: coordArray[3], lng: coordArray[2] },
        resolution: calculateResolutionFromStdZoom(coordArray[1], coordArray[3])
      })
      return true
    }
  }
  if (urlMethod()) { return }

  function tileMethod () {
    const container = document.querySelector('.leaflet-container')
    if (!container) { return false }
    const containerRect = container.getBoundingClientRect()

    const tile = container.querySelector('.leaflet-tile')
    if (!tile) { return false }
    const tileRect = tile.getBoundingClientRect()

    const re = /tiles\/([0-9]+)\/([0-9]+)\/([0-9]+)/
    const coordArray = tile.src.match(re)
    if (!coordArray) { return false }
    const z = +coordArray[1]
    const tx = +coordArray[2]
    const ty = +coordArray[3]

    // tx & ty represent the top left of the tile. We now find the center of the map.
    const cx = tx + ((containerRect.left + containerRect.right) / 2 - tileRect.left) / tileRect.width
    const cy = ty + ((containerRect.top + containerRect.bottom) / 2 - tileRect.top) / tileRect.height
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (cy / 2 ** z)))) / Math.PI * 180
    const lng = (cx / 2 ** z) * 360 - 180
    resolve({
      centreCoords: { lat, lng },
      resolution: calculateResolutionFromStdZoom(z, lat)
    })
    return true
  }
  if (tileMethod()) { return }

  reject()
})
