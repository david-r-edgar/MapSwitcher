export default {
  generate: function (sourceMapData, view) {
    const osmBase = 'https://www.openstreetmap.org/'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    let directions = ''
    const zoom = sourceMapData.getStandardZoom({ min: 0, max: 19 })
    let note = ''

    if (sourceMapData.directions?.route) {
      let mode = ''
      if (sourceMapData.directions.mode) {
        switch (sourceMapData.directions.mode) {
          case 'foot':
            mode = 'engine=graphhopper_foot&'
            break
          case 'car':
            mode = 'engine=graphhopper_car&'
            break
          case 'bike':
            mode = 'engine=graphhopper_bicycle&'
            break
        }
      }

      // OSM appears to only handle single-segment routes.
      // So we choose to use the first and last point of the route from the source map.

      const firstElem = sourceMapData.directions.route[0]
      const lastElem = sourceMapData.directions.route[sourceMapData.directions.route.length - 1]

      if ('coords' in firstElem && 'coords' in lastElem) {
        directions = 'directions?' + mode + 'route=' +
                  firstElem.coords.lat + ',' + firstElem.coords.lng + ';' +
                  lastElem.coords.lat + ',' + lastElem.coords.lng
      } else {
        view.addMapServiceLinks(this, [],
          'OpenStreetMap directions unavailable because waypoints are not ' +
          'all specified as coordinates.'
        )
      }
      if (sourceMapData.directions.route.length > 2) {
        note = 'OpenStreetMap does not support multi-waypoint routing. ' +
          'Directions from first to last waypoints only.'
      }
    }

    const coreDirnsLink = osmBase + directions + '#map=' + zoom + '/' + mapCentre

    if (directions.length > 0) {
      const mapLinksWithDirns = [
        {
          name: 'Standard',
          url: coreDirnsLink
        },
        {
          name: 'Cycle Map',
          url: coreDirnsLink + '&layers=C'
        },
        {
          name: 'Transport',
          url: coreDirnsLink + '&layers=T'
        },
        {
          name: 'Humanitarian',
          url: coreDirnsLink + '&layers=H'
        }
      ]
      view.addMapServiceLinks(this, mapLinksWithDirns, note)
    }
  }
}
