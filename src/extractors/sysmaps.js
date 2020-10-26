/* global
  registerExtractor,
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

  if (window.location.pathname.indexOf('/sysmaps_os.html') === 0) {
    if (inDom()) { return }
  }

  if (inLocationSearch()) { return }

  reject()
})
