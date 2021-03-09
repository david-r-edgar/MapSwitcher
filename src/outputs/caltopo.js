export default {
  generate: function (sourceMapData, view) {
    if ((sourceMapData.countryCode === 'us') || (sourceMapData.countryCode === 'ca')) {
      const base = 'http://caltopo.com/map.html'
      const mapCentre = 'll=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
      const zoom = 'z=' + sourceMapData.getStandardZoom()

      const mapLinks = [
        {
          name: 'MapBuilderTopo',
          url: base + '#' + mapCentre + '&' + zoom + '&b=mbt'
        },
        {
          name: "7.5' Topo",
          url: base + '#' + mapCentre + '&' + zoom + '&b=t&o=r&n=0.25'
        },
        {
          name: 'Forest Service',
          url: base + '#' + mapCentre + '&' + zoom + '&b=t&o=f16a%2Cr&n=1,0.25'
        },
        {
          name: 'Aerial Topo',
          url: base + '#' + mapCentre + '&' + zoom + '&b=sat&o=t&n=0.5'
        },
        {
          name: 'Hybrid Satellite',
          url: base + '#' + mapCentre + '&' + zoom + '&b=sat&o=r&n=0.3&a=c,mba'
        }
      ]
      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
