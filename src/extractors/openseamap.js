/* global
  registerExtractor,
  XPathResult,
  calculateResolutionFromStdZoom */

registerExtractor(resolve => {
  const sourceMapData = {}
  const centrePermalink = document.evaluate('//*[@id="OpenLayers_Control_Permalink_13"]//a/@href',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
  const re = /lat=([-0-9.]+)&lon=([-0-9.]+)/
  const coordArray = centrePermalink.match(re)
  if (coordArray && coordArray.length > 2) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
  }
  const re2 = /zoom=([0-9]+)/
  const zoomArray = centrePermalink.match(re2)
  if (zoomArray && zoomArray.length > 1) {
    sourceMapData.resolution = calculateResolutionFromStdZoom(
      zoomArray[1], sourceMapData.centreCoords.lat)
  }
  resolve(sourceMapData)
})
