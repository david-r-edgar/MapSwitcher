/* global
  registerExtractor,
  XPathResult */

registerExtractor(resolve => {
  const sourceMapData = {}
  const geo = document.evaluate('//*[@id="coordinates"]//*[@class="geo"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
  const coordArray = geo.split(';')
  if (coordArray.length === 2) {
    sourceMapData.centreCoords = { lat: coordArray[0].trim(), lng: coordArray[1].trim() }
    sourceMapData.locationDescr = 'primary article coordinates'
  }
  resolve(sourceMapData)
})
