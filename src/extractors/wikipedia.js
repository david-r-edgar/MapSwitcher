/* global
  registerExtractor,
  XPathResult */

registerExtractor(resolve => {
  const titleCoords = () => {
    try {
      let sourceMapData
      const geo = document.evaluate('//*[@id="coordinates"]//*[@class="geo"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
      const coordArray = geo.split(';')
      if (coordArray.length === 2) {
        sourceMapData = {
          centreCoords: {
            lat: coordArray[0].trim(),
            lng: coordArray[1].trim()
          },
          locationDescr: 'primary article coordinates'
        }
      }
      return sourceMapData
    } catch (err) {
      return null
    }
  }

  const getDecimal = (mixedFormatString) => {
    try {
      const values = mixedFormatString.split('_')
      let result = +values[0]
      if (values[1]) { result += +values[1] / 60 }
      if (values[2]) { result += +values[2] / 3600 }
      return result
    } catch (err) {
      return NaN
    }
  }

  const findCentreCoords = (url) => {
    try {
      const paramsRe = /params=([0-9._]+)([NS])_([0-9._]+)([EW])/
      const [, mixedFormatLat, NorS, mixedFormatLng, EorW] = url.match(paramsRe)
      const decimalLat = getDecimal(mixedFormatLat)
      const decimalLng = getDecimal(mixedFormatLng)
      const lat = (NorS === 'N' ? +decimalLat : -decimalLat)
      const lng = (EorW === 'E' ? +decimalLng : -decimalLng)
      return { lat, lng }
    } catch (err) {
      return null
    }
  }

  const firstCoordsInArticle = () => {
    try {
      let sourceMapData
      const geohackLinks = document.querySelectorAll('a[href*="geohack"]')
      for (const geohackLink of geohackLinks) {
        const centreCoords = findCentreCoords(geohackLink.href)
        if (centreCoords) {
          sourceMapData = {
            centreCoords,
            locationDescr: 'first coords found in page'
          }
          break
        }
      }
      return sourceMapData
    } catch (err) {
      return null
    }
  }

  resolve(titleCoords() || firstCoordsInArticle())
})
