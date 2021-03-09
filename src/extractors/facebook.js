/* global
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor(resolve => {
  // this is pretty similar to the 'event' code - we could probably get away with using that instead - not sure about centre vs. marker_list
  function fbPage () {
    try {
      const mapView = document.querySelector('*[aria-label="Map view"]')
      const bgImageElem = mapView.querySelector('*[style*="background-image"]')
      const bgImageString = bgImageElem?.style?.backgroundImage
      const [, lat, lng] = bgImageString.match(/center=([-0-9.]+)%2C([-0-9.]+)/)
      const [, zoom] = bgImageString.match(/zoom=([0-9]+)/)
      if (lat && lng && zoom) {
        return {
          centreCoords: { lat, lng },
          resolution: calculateResolutionFromStdZoom(zoom, lat),
          locationDescr: 'map displayed on page'
        }
      }
    } catch (err) {
      return null
    }
  }

  function fbEvent () {
    try {
      const bgImageElems = document.querySelectorAll('*[style*="background-image"]')
      const mapElems = Array.from(bgImageElems).map(elem => {
        const bgImageUrl = elem?.style?.backgroundImage
        return (bgImageUrl && bgImageUrl.indexOf('static_map') > 0) ? bgImageUrl : ''
      })
      const bgImageString = mapElems[0]
      const [, lat, lng] = bgImageString.match(/marker_list\[0\]=([-0-9.]+)%2C([-0-9.]+)/)
      const [, zoom] = bgImageString.match(/zoom=([0-9]+)/)
      if (lat && lng && zoom) {
        return {
          centreCoords: { lat, lng },
          resolution: calculateResolutionFromStdZoom(zoom, lat),
          locationDescr: 'map displayed on page'
        }
      }
    } catch (err) {
      return null
    }
  }

  function fbPlace () {
    // similar to strava extractor
    try {
      const mapIframe = document.querySelector('iframe[src*=place]')
      const container = mapIframe.contentWindow.document.querySelector('.leaflet-container')
      const containerRect = container.getBoundingClientRect()

      const tile = container.querySelector('.leaflet-tile')
      const tileRect = tile.getBoundingClientRect()

      const re = /x=([0-9]+)&y=([0-9]+)&z=([0-9]+)/
      const [, tx, ty, z] = tile.src.match(re)
      if (!(tx && ty && z)) {
        return null
      }

      const cx = +tx + ((containerRect.left + containerRect.right) / 2 - tileRect.left) / tileRect.width
      const cy = +ty + ((containerRect.top + containerRect.bottom) / 2 - tileRect.top) / tileRect.height
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (cy / 2 ** z)))) / Math.PI * 180
      const lng = (cx / 2 ** z) * 360 - 180

      return {
        centreCoords: { lat, lng },
        resolution: calculateResolutionFromStdZoom(z, lat),
        locationDescr: 'mapped location'
      }
    } catch (err) {
      return null
    }
  }

  resolve(fbPage() || fbEvent() || fbPlace())
})
