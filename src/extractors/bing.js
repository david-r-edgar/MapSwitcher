/* global
  calculateResolutionFromStdZoom,
  XPathResult,
  registerExtractor */

registerExtractor((resolve, reject) => {
  const sourceMapData = {}

  const re1 = /cp=([-0-9.]+)%7E([-0-9.]+)/
  const coordArray = window.location.search.match(re1)

  if (coordArray && coordArray.length >= 3) {
    sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
  }
  const re2 = /lvl=([0-9.]+)/
  const levelArray = window.location.search.match(re2)
  if (levelArray && levelArray.length > 1) {
    sourceMapData.resolution = calculateResolutionFromStdZoom(
      levelArray[1], sourceMapData.centreCoords.lat)
  }

  const directionsPanelRoot = document.evaluate('//*[@id="directionsPanelRoot"]',
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
  if (directionsPanelRoot.singleNodeValue &&
    directionsPanelRoot.singleNodeValue.children.length) {
    // we expect a single 'From' input, followed by one or more 'To' inputs
    const routeFrom = document.evaluate('//*[@class="dirWaypoints"]//input[contains(@title, "From")]',
      directionsPanelRoot.singleNodeValue, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value
    sourceMapData.directions = {
      route: [{ address: routeFrom }]
    }
    const routeTo = document.evaluate('//*[@class="dirWaypoints"]//input[contains(@title, "To")]',
      directionsPanelRoot.singleNodeValue, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)

    let routeToWpts
    while ((routeToWpts = routeTo.iterateNext())) {
      sourceMapData.directions.route.push({ address: routeToWpts.value })
    }

    const re3 = /([-0-9.]+)[ ]*,[ ]*([-0-9.]+)/
    for (const rteWptIndex in sourceMapData.directions.route) {
      const wptArray =
        sourceMapData.directions.route[rteWptIndex].address.match(re3)
      if (wptArray && wptArray.length > 2) {
        sourceMapData.directions.route[rteWptIndex].coords =
          { lat: wptArray[1], lng: wptArray[2] }
      }
    }

    const dirBtnSelected = document.evaluate('//*[contains(@class, "dirBtnSelected")]',
      directionsPanelRoot.singleNodeValue, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    switch (dirBtnSelected.singleNodeValue.classList[0]) {
      case 'dirBtnDrive':
        sourceMapData.directions.mode = 'car'
        break
      case 'dirBtnTransit':
        sourceMapData.directions.mode = 'transit'
        break
      case 'dirBtnWalk':
        sourceMapData.directions.mode = 'foot'
        break
    }
  }

  resolve(sourceMapData)
})
