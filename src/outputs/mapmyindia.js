export default {
  id: 'mapmyindia',
  generate: function (sourceMapData, view) {
    const base = 'https://maps.mapmyindia.com/'
    const zoom = sourceMapData.getStandardZoom()

    const substituteEncode = function (num) {
      const input = '0123456789.'
      const output = 'fljtaseoqvi'
      const index = x => input.indexOf(x)
      const translate = x => index(x) > -1 ? output[index(x)] : x
      return ('' + num).split('').map(translate).join('')
    }
    const [latAlpha, lngAlpha, zoomAlpha] = [
      sourceMapData.centreCoords.lat,
      sourceMapData.centreCoords.lng,
      zoom
    ].map(substituteEncode)

    const mapLinks = [{
      name: 'Default',
      url: base + '@' + latAlpha + ',' + lngAlpha + ',' + zoomAlpha + ',l,j,fzdata'
    }]

    if (sourceMapData.countryCode === 'in') {
      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
