export default {
  id: 'google',
  generate: function (sourceMapData, view) {
    const googleBase = 'https://www.google.com/maps/'
    const mapCentre = '@' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng + ','

    const zoom = sourceMapData.getStandardZoom({ min: 3 }) + 'z'

    const mapLinksBasic = [
      {
        name: 'Maps',
        url: googleBase + mapCentre + zoom + '/data='
      },
      {
        name: 'Terrain',
        url: googleBase + mapCentre + zoom + '/data=' + '!5m1!1e4'
      },
      {
        name: 'Earth',
        url: googleBase + mapCentre + zoom + '/data=!3m1!1e3'
      },
      {
        name: 'Traffic',
        url: googleBase + mapCentre + zoom + '/data=' + '!5m1!1e1'
      },
      {
        name: 'Cycling',
        url: googleBase + mapCentre + zoom + '/data=' + '!5m1!1e3'
      }
    ]
    view.addMapServiceLinks(this, mapLinksBasic)
  }
}
