export default {
  generate: function (sourceMapData, view) {
    const yandexBase = 'https://yandex.com/maps/'
    const mapCentre = 'll=' + sourceMapData.centreCoords.lng + ',' + sourceMapData.centreCoords.lat
    const zoom = 'z=' + sourceMapData.getStandardZoom({ default: 6 })

    const mapLinksBasic = [
      {
        name: 'Maps',
        url: yandexBase + '?' + mapCentre + '&' + zoom
      },
      {
        name: 'Satellite',
        url: yandexBase + '?l=sat&' + mapCentre + '&' + zoom
      },
      {
        name: 'Hybrid',
        url: yandexBase + '?l=sat%2Cskl&' + mapCentre + '&' + zoom
      }
    ]
    view.addMapServiceLinks(this, mapLinksBasic)
  }
}
