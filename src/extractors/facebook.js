/* global
  calculateResolutionFromStdZoom,
  XPathResult,
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}

  // we rely on this obfuscated class name continuing to be used
  const mapImages = document.evaluate('//*[@class="_a3f img"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue

  if (mapImages && mapImages.currentSrc && mapImages.currentSrc.length > 0) {
    const re1 = /markers=([-0-9.]+)%2C([-0-9.]+)/
    const coordArr = mapImages.currentSrc.match(re1)
    if (coordArr && coordArr.length > 2) {
      sourceMapData.centreCoords = { lat: coordArr[1], lng: coordArr[2] }
      const zoomRe = /zoom=([0-9]+)/
      const zoomArr = mapImages.currentSrc.match(zoomRe)
      if (zoomArr && zoomArr.length > 1) {
        sourceMapData.resolution =
          calculateResolutionFromStdZoom(zoomArr[1], coordArr[1])
      } else {
        // hacky way to find zoom for pages - could maybe use bounding box instead
        const zoomUrl = document.evaluate('//*[@class="_3n4p"]',
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        const zoomArr = zoomUrl.getAttribute('ajaxify').match(zoomRe)
        if (zoomArr && zoomArr.length > 1) {
          sourceMapData.resolution =
            calculateResolutionFromStdZoom(zoomArr[1], coordArr[1])
        }
      }
    }
    sourceMapData.locationDescr = 'primary identified location'
  }

  resolve(sourceMapData)
})
