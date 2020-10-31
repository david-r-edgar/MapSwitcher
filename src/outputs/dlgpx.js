export default {
  id: 'dlgpx',
  generate: function (sourceMapData, view) {
    view.addFileDownload(this, 'gpx_map_centre', 'Download map centre waypoint', function () {
      const fileData = {
        name: 'MapSwitcher.gpx',
        type: 'application/gpx+xml;charset=utf-8',
        content:
          '<?xml version="1.1"?>\n' +
          '<gpx creator="MapSwitcher" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">\n' +
            '\t<author>MapSwitcher</author>\n' +
            `\t<wpt lat="${sourceMapData.centreCoords.lat}"` +
              ` lon="${sourceMapData.centreCoords.lng}">\n` +
              '\t\t<name>Centre of map</name>\n' +
              `\t\t<desc>${sourceMapData.centreCoords.lat}, ${sourceMapData.centreCoords.lng}</desc>\n` +
            '\t</wpt>\n' +
          '</gpx>\n'
      }
      return fileData
    })
    const route = sourceMapData?.directions?.route
    if (route) {
      const firstPoint = route[0]
      const lastPoint = route[route.length - 1]

      let routePoints = ''
      let pointsWithCoords = 0
      for (const rteIndex in route) {
        const rteWpt = route[rteIndex]

        if ('coords' in rteWpt) {
          routePoints +=
            `\t\t<rtept lat="${rteWpt.coords.lat}" lon="${rteWpt.coords.lng}">\n` +
            `\t\t\t<name>${rteWpt.address || 'Unnamed waypoint'}</name>\n` +
            '\t\t</rtept>\n'
          pointsWithCoords++
        }
      }
      // only provide a gpx route download if all the points in the route have coordinates
      if (pointsWithCoords === route.length) {
        view.addFileDownload(this, 'gpx_rte', 'Download route', function () {
          var fileData = {
            name: 'MapSwitcherRoute.gpx',
            type: 'application/gpx+xml;charset=utf-8',
            content:
              '<?xml version="1.1"?>\n' +
              '<gpx creator="MapSwitcher" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">\n' +
                '\t<author>MapSwitcher</author>\n' +
                '\t<rte>\n' +
                  '\t\t<name>Map Switcher Route</name>\n' +
                  `\t\t<desc>From ${firstPoint.coords.lat}, ${firstPoint.coords.lng} to ${lastPoint.coords.lat}, ${lastPoint.coords.lng}</desc>\n` +
                  routePoints +
                  '\t</rte>\n' +
              '</gpx>\n'
          }
          return fileData
        })
      } else {
        view.addNote(this,
          'GPX directions unavailable because waypoints are not all specified as coordinates.')
      }
    }
  }
}
