export default {
  id: 'waze',
  generate: function (sourceMapData, view) {
    const wazeBase = 'https://www.waze.com'
    const mapCentre = 'll=' + sourceMapData.centreCoords.lat + '%2C' + sourceMapData.centreCoords.lng
    // FIXME waze zoom doesn't seem to work anymore?
    const zoom = 'zoom=' + sourceMapData.getStandardZoom()

    // FIXME waze directions don't work properly any more when passing two sets of coords
    // let directions = ''

    // if ('directions' in sourceMapData &&
    //     'route' in sourceMapData.directions) {
    //   // Waze appears to only handle single-segment routes.
    //   // So we choose to use the first and last point of the route from the source map.

    //   var firstElem = sourceMapData.directions.route[0]
    //   var lastElem = sourceMapData.directions.route[sourceMapData.directions.route.length - 1]

    //   if ('coords' in firstElem && 'coords' in lastElem) {
    //     directions +=
    //       'from=ll.' + firstElem.coords.lat + ',' + firstElem.coords.lng +
    //       '&to=ll.' + lastElem.coords.lat + ',' + lastElem.coords.lng +
    //       '&at_req=0&at_text=Now'
    //   } else {
    //     this.note = 'Waze directions unavailable because waypoints are not ' +
    //                       'all specified as coordinates.'
    //   }
    // }
    // if (directions.length > 0) {
    //   const mapLinksWithDirns = [{
    //     name: 'Livemap',
    //     url: wazeBase + '/livemap/directions?' + directions
    //   }]
    //   view.addMapServiceLinks(this, mapLinksWithDirns, this.note)
    // }

    const mapLinksBasic = [{
      name: 'Livemap',
      url: wazeBase + '/ul?' + mapCentre + '&' + zoom
    }]
    view.addMapServiceLinks(this, mapLinksBasic, this.note)
  }
}
