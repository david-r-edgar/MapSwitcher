/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromScale */

registerExtractor(resolve => {
  const sourceMapData = {}
  const urlToShare = document.evaluate('//*[@id="LinkToInput"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
  const re1 = /X=([0-9]+)&Y=([0-9]+)/
  const osCoordArray = urlToShare.match(re1)
  if (osCoordArray && osCoordArray.length > 2) {
    sourceMapData.osgbCentreCoords = { e: osCoordArray[1], n: osCoordArray[2] }
  }
  const re2 = /Z=([0-9]+)/
  const zoomArray = urlToShare.match(re2)
  if (zoomArray && zoomArray.length > 1) {
    let scale = 50000
    switch (zoomArray[1]) {
      case '106':
        scale = 2500
        break
      case '110':
        scale = 5000
        break
      case '115':
        scale = 25000
        break
      case '120':
        scale = 50000
        break
      case '126':
        scale = 100000
        break
      case '130':
        scale = 200000
        break
      case '140':
        scale = 500000
        break
      case '150':
        scale = 1000000
        break
    }
    sourceMapData.resolution = calculateResolutionFromScale(scale)
  }
  resolve(sourceMapData)
})
