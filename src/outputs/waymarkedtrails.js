export default {
  generate: function (sourceMapData, view) {
    const domain = 'waymarkedtrails.org'
    const zoom = sourceMapData.getStandardZoom({ min: 0, max: 18 })
    const location = zoom + '!' + sourceMapData.centreCoords.lat + '!' + sourceMapData.centreCoords.lng

    const mapLinks = [
      {
        name: 'Hiking',
        url: 'https://hiking.' + domain + '/#?map=' + location
      },
      {
        name: 'Cycling',
        url: 'https://cycling.' + domain + '/#?map=' + location
      },
      {
        name: 'MTB',
        url: 'https://mtb.' + domain + '/#?map=' + location
      },
      {
        name: 'Riding',
        url: 'https://riding.' + domain + '/#?map=' + location
      },
      {
        name: 'Skating',
        url: 'https://skating.' + domain + '/#?map=' + location
      },
      {
        name: 'Slopes',
        url: 'https://slopes.' + domain + '/#?map=' + location
      }
    ]
    view.addMapServiceLinks(this, mapLinks)
  }
}
