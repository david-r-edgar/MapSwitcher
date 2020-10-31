export default {
  id: 'sysmaps',
  generate: function (sourceMapData, view) {
    const mapLinks = []
    const base = 'http://www.sysmaps.co.uk/'
    if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
      const osBase = base + 'sysmaps_os.html?'
      const mapCentre = '!' + sourceMapData.centreCoords.lat + '~' + sourceMapData.centreCoords.lng
      mapLinks.push({
        name: 'OS',
        url: osBase + mapCentre
      })
    } else if (sourceMapData.countryCode === 'de') {
      const deTopoBase = base + 'sysmaps_bkg.html?layers=B00000000000000000000000FFFFFTFFFTFFTTTTT'
      const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lon=' + sourceMapData.centreCoords.lng
      mapLinks.push({
        name: 'DE Topo',
        url: deTopoBase + '&' + mapCentre
      })
    }
    if (mapLinks.length > 0) {
      view.addMapServiceLinks(this, mapLinks)
    }
  }
}
