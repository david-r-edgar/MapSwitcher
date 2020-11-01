/* global
  calculateResolutionFromStdZoom,
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  if (window.location.pathname.indexOf('/map/') >= 0) {
    const re1 = /ll=([-0-9.]+),([-0-9.]+)&z=([0-9.]+)/
    const coordArray = window.location.hash.match(re1)
    if (coordArray && coordArray.length > 3) {
      sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
      sourceMapData.resolution =
        calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
    }
  } else if (window.location.pathname.endsWith('/map')) {
    const re2 = /lat=([-0-9.]+)&lng=([-0-9.]+)&zoom=([0-9.]+)/
    const coordArray = window.location.search.match(re2)
    if (coordArray && coordArray.length > 3) {
      sourceMapData.centreCoords = { lat: coordArray[1], lng: coordArray[2] }
      sourceMapData.resolution =
        calculateResolutionFromStdZoom(coordArray[3], coordArray[1])
    }
  } else if (window.location.pathname.indexOf('/geocache/') === 0) {
    const dmLatLng = document.getElementById('uxLatLon').innerText
    const re3 = /([NS])\s+([0-9]+)[^0-9]\s+([0-9.]+)\s+([EW])\s+([0-9]+)[^0-9]\s+([0-9.]+)/
    const dmCoordArray = dmLatLng.match(re3)
    if (dmCoordArray && dmCoordArray.length > 6) {
      let lat = parseInt(dmCoordArray[2]) + (dmCoordArray[3] / 60)
      let lng = parseInt(dmCoordArray[5]) + (dmCoordArray[6] / 60)
      if (dmCoordArray[1] === 'S') {
        lat = -lat
      }
      if (dmCoordArray[4] === 'W') {
        lng = -lng
      }
      Object.assign(sourceMapData, {
        centreCoords: { lat, lng },
        resolution: calculateResolutionFromStdZoom(15, lat),
        locationDescr: 'primary geocache coordinates'
      })
    }
  }
  resolve(sourceMapData)
})
