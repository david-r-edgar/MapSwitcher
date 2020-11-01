/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const href = document.evaluate('//*[@id="permalink"]/@href',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
  const re = /zoom=([0-9]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/
  const dataArray = href.match(re)
  if (dataArray && dataArray.length > 3) {
    sourceMapData.centreCoords = { lat: dataArray[2], lng: dataArray[3] }
    sourceMapData.resolution =
      calculateResolutionFromStdZoom(dataArray[1], dataArray[2])
  }
  resolve(sourceMapData)
})
