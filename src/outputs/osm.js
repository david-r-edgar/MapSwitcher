export default {
  id: 'osm',
  generate: function (sourceMapData, view) {
    const osmBase = 'https://www.openstreetmap.org/'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom({ min: 0, max: 19 })

    const coreBasicLink = osmBase + '#map=' + zoom + '/' + mapCentre

    const mapLinksBasic = [
      {
        name: 'Standard',
        url: coreBasicLink
      },
      {
        name: 'Cycle Map',
        url: coreBasicLink + '&layers=C'
      },
      {
        name: 'Transport',
        url: coreBasicLink + '&layers=T'
      },
      {
        name: 'Humanitarian',
        url: coreBasicLink + '&layers=H'
      }
    ]
    view.addMapServiceLinks(this, mapLinksBasic)
  }
}
