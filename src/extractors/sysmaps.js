/* global
  registerExtractor,
  calculateResolutionFromStdZoom,
  XPathResult */

registerExtractor((resolve, reject) => {
  function inDom () {
    try {
      const locationText = document.evaluate('//*[@class="style1"][contains(text(),"Map Centre")]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
      const re = /East: ([0-9.]+) : North: ([0-9.]+)/
      const mapCentreArr = locationText.match(re)
      if (mapCentreArr && mapCentreArr.length > 2) {
        const sourceMapData = {
          osgbCentreCoords: { e: mapCentreArr[1], n: mapCentreArr[2] },
          locationDescr: 'map centre'
        }
        resolve(sourceMapData)
        return true
      }
    } catch (err) {
    }
    return false
  }

  function inLocationSearch () {
    const re = /!([-0-9.]+)~([-0-9.]+)/
    const mapCentreArr = window.location.search.match(re)
    if (mapCentreArr && mapCentreArr.length > 2) {
      resolve({
        centreCoords: { lat: mapCentreArr[1], lng: mapCentreArr[2] },
        nonUpdating: window.location.hostname,
        locationDescr: 'non-updating URL'
      })
      return true
    }
  }

  function leafletExtractor () {
    // similar to strava extractor
    try {
      const container = document.querySelector('.leaflet-container')
      const containerRect = container.getBoundingClientRect()

      const tile = container.querySelector('.leaflet-tile')
      const tileRect = tile.getBoundingClientRect()

      const re = /([0-9]+)\/([0-9]+)\/([0-9]+)/
      const [, z, tx, ty] = tile.src.match(re)
      if (!(tx && ty && z)) {
        return null
      }

      const cx = +tx + ((containerRect.left + containerRect.right) / 2 - tileRect.left) / tileRect.width
      const cy = +ty + ((containerRect.top + containerRect.bottom) / 2 - tileRect.top) / tileRect.height
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (cy / 2 ** z)))) / Math.PI * 180
      const lng = (cx / 2 ** z) * 360 - 180

      return {
        centreCoords: { lat, lng },
        resolution: calculateResolutionFromStdZoom(z, lat)
      }
    } catch (err) {
      return null
    }
  }

  if (window.location.pathname.indexOf('/sysmaps_os.html') === 0) {
    if (inDom()) { return }
  }

  if (inLocationSearch()) { return }

  const leafletExtrResult = leafletExtractor()
  if (leafletExtrResult) { return resolve(leafletExtrResult) }

  reject()
})
