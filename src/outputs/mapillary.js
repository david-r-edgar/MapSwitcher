export default {
  site: 'Mapillary',
  image: 'mapillary16x16.png',
  id: 'mapillary',
  generate: function (sourceMapData, view) {
    const base = 'https://www.mapillary.com/app/'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lng=' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom() - 1

    const mapLinks = [{
      name: 'Map',
      url: base + '?' + mapCentre + '&z=' + zoom
    }]

    view.addMapServiceLinks(this, mapLinks)
  }
}
