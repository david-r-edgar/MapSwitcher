/* global
  registerExtractor,
  XPathResult,
  getDistanceFromLatLonInKm,
  calculateResolutionFromStdZoom */

registerExtractor((resolve, reject) => {
  function singlePeak () {
    const sourceMapData = {}
    const gmap = document.evaluate('//*[@id="Gmap"]/@src',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    try {
      const cx = gmap.value.match(/cx=([-0-9.]+)/)[1]
      const cy = gmap.value.match(/cy=([-0-9.]+)/)[1]
      const z = gmap.value.match(/z=([-0-9.]+)/)[1]
      sourceMapData.centreCoords = { lat: cy, lng: cx }
      sourceMapData.resolution = calculateResolutionFromStdZoom(z, cy)
      resolve(sourceMapData)
      return true
    } catch (err) {
      return false
    }
  }
  if (singlePeak()) { return }

  function listOfPeaks () {
    const sourceMapData = {}

    const iframe = document.querySelector('iframe')

    const re = /miny=([-0-9.]+)&maxy=([-0-9.]+)&minx=([-0-9.]+)&maxx=([-0-9.]+)/
    const limitsArray = iframe.src.match(re)
    // these values are the min and max lats & lngs of the list of peaks - not the map limits
    const [miny, maxy, minx, maxx] = limitsArray.slice(1)
    const centreLat = (+miny + +maxy) / 2
    const centreLng = (+minx + +maxx) / 2

    const vert = getDistanceFromLatLonInKm(maxy, centreLng, miny, centreLng)
    const horiz = getDistanceFromLatLonInKm(centreLat, minx, centreLat, maxx)

    const vertMetresPerPixel = vert * 1000 / +iframe.height
    const horizMetresPerPixel = horiz * 1000 / +iframe.width

    const maxMPP = vertMetresPerPixel > horizMetresPerPixel ? vertMetresPerPixel : horizMetresPerPixel

    // use max mpp, increased by a trial-and-error factor to approximate the full map extent shown (not just the bounds of the peaks)
    const resnMPP = maxMPP * 1.4

    sourceMapData.centreCoords = { lat: centreLat, lng: centreLng }
    sourceMapData.resolution = resnMPP // calculateResolutionFromStdZoom(5, centreLat)
    resolve(sourceMapData)
  }
  if (listOfPeaks()) { return }

  reject()
})
