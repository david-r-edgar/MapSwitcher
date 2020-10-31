export default {
  id: 'bing',
  generate: function (sourceMapData, view) {
    const bingBase = 'https://www.bing.com/maps/?'
    const mapCentre = 'cp=' + sourceMapData.centreCoords.lat + '~' +
                              sourceMapData.centreCoords.lng
    const zoom = '&lvl=' + sourceMapData.getStandardZoom({
      default: 10,
      min: 3,
      max: 20
    })

    const mapLinksBasic = [
      {
        name: 'Road',
        url: bingBase + '&' + mapCentre + zoom
      },
      {
        name: 'Aerial',
        url: bingBase + '&' + mapCentre + zoom + '&sty=h'
      },
      {
        name: "Bird's eye",
        url: bingBase + '&' + mapCentre + zoom + '&sty=b'
      }
    ]

    if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
      mapLinksBasic.push({
        name: 'Ordnance Survey',
        url: bingBase + '&' + mapCentre + zoom + '&sty=s'
      })
    }

    view.addMapServiceLinks(this, mapLinksBasic)
  }
}
