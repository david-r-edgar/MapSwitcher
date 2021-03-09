export default {
  generate: function (sourceMapData, view) {
    const base = 'https://brouter.de/brouter-web'
    const mapCentre = sourceMapData.centreCoords.lat + '/' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    if (sourceMapData.directions && sourceMapData.directions.route) {
      // first prepare pairs of waypoints which have coords, in a stringified format
      const coordPairArr = []
      sourceMapData.directions.route.forEach(wpt => {
        if ('coords' in wpt) {
          coordPairArr.push(wpt.coords.lng + ',' + wpt.coords.lat)
        }
      })

      if (coordPairArr.length < sourceMapData.directions.route.length) {
        // no directions at all, show note
        view.addMapServiceLinks(this, [],
          'BRouter directions unavailable because waypoints are not ' +
          'all available as coordinates.')
      } else {
        let directions = '&lonlats='
        directions += coordPairArr.join(';')

        let mode = ''
        if (sourceMapData.directions.mode) {
          switch (sourceMapData.directions.mode) {
            case 'car':
              mode = '&profile=car-eco'
              break
            case 'foot':
              mode = '&profile=hiking-beta'
              break
          }
        }

        directions += mode

        if (directions) {
          const mapLinksWithDirns = [
            {
              name: 'OpenStreetMap',
              url: base + '#map=' + zoom + '/' + mapCentre + '/standard' + directions
            },
            {
              name: 'OpenTopoMap',
              url: base + '#map=' + zoom + '/' + mapCentre + '/OpenTopoMap' + directions
            }
          ]
          view.addMapServiceLinks(this, mapLinksWithDirns, this.note)
        }
      }
    }
  }
}
