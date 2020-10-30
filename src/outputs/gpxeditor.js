export default {
  site: 'GPX Editor',
  image: 'gpxed16x16.png',
  id: 'gpxeditor',
  generate: function (sourceMapData, view) {
    const gpxEditorBase = 'http://www.gpxeditor.co.uk/?'
    const mapCentre = 'location=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    const zoom = 'zoom=' + sourceMapData.getStandardZoom({ min: 1 })

    const mapLinks = [
      {
        name: 'Map',
        url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=roadmap'
      },
      {
        name: 'Satellite',
        url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=satellite'
      },
      {
        name: 'OSM',
        url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OSM'
      }
    ]

    if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
      mapLinks.push({
        name: 'OS',
        url: gpxEditorBase + mapCentre + '&' + zoom + '&mapType=OS'
      })
    }

    view.addMapServiceLinks(this, mapLinks, this.note)
  }
}
