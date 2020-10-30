export default {
  site: 'F4map',
  image: 'f4logo16x16.png',
  id: 'f4map',
  generate: function (sourceMapData, view) {
    const base = 'https://demo.f4map.com/'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
    const zoom = 'zoom=' + sourceMapData.getStandardZoom({ min: 0, max: 21 })

    const mapLinks = [
      {
        name: 'Regular',
        url: base + '#' + mapCentre + '&' + zoom + '&3d=false&camera.theta=0.9'
      },
      {
        name: '3d',
        url: base + '#' + mapCentre + '&' + zoom
      }
    ]
    view.addMapServiceLinks(this, mapLinks)
  }
}
