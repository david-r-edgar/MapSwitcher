export default {
  id: 'here',
  generate: function (sourceMapData, view) {
    const hereBase = 'https://wego.here.com/'
    const mapCentre = '?map=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const mapLinksBasic = [
      {
        name: 'Map',
        url: hereBase + mapCentre + ',' + zoom + ',' + 'normal'
      },
      {
        name: 'Terrain',
        url: hereBase + mapCentre + ',' + zoom + ',' + 'terrain'
      },
      {
        name: 'Satellite',
        url: hereBase + mapCentre + ',' + zoom + ',' + 'satellite'
      },
      {
        name: 'Traffic',
        url: hereBase + mapCentre + ',' + zoom + ',' + 'traffic'
      },
      {
        name: 'Public Transport',
        url: hereBase + mapCentre + ',' + zoom + ',' + 'public_transport'
      }
    ]
    view.addMapServiceLinks(this, mapLinksBasic)
  }
}
