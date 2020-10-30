/* global
  calculateScaleFromResolution */

export default {
  site: 'Wikimedia Labs',
  image: 'wmLabsLogo16x16.png',
  id: 'wmLabs',
  generate: function (sourceMapData, view) {
    const mapLinks = []
    const geohackBase = 'https://tools.wmflabs.org/geohack/geohack.php?params='
    let mapCentre = sourceMapData.centreCoords.lat + '_N_' + sourceMapData.centreCoords.lng + '_E'
    const region = (sourceMapData.countryCode.length > 0)
      ? '_region:' + sourceMapData.countryCode
      : ''

    const scale = calculateScaleFromResolution(sourceMapData.resolution)
    mapLinks.push({
      name: 'GeoHack',
      url: geohackBase + mapCentre + region + '_scale:' + scale
    })

    const wikiminiatlasBase = 'https://wma.wmflabs.org/iframe.html?'
    mapCentre = sourceMapData.centreCoords.lat + '_' + sourceMapData.centreCoords.lng
    // FIXME this is an approximation of zoom - it's not completely accurate
    const zoom = sourceMapData.getStandardZoom({ min: 4, max: 16 }) - 1

    mapLinks.push({
      name: 'Wiki Mini Atlas',
      url: wikiminiatlasBase + mapCentre + '_0_0_en_' + zoom + '_englobe=Earth'
    })
    view.addMapServiceLinks(this, mapLinks)
  }
}
