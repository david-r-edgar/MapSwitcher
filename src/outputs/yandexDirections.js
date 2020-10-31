export default {
  id: 'yandexDirections',
  generate: function (sourceMapData, view) {
    const yandexBase = 'https://yandex.com/maps/'
    const mapCentre = 'll=' + sourceMapData.centreCoords.lng + ',' + sourceMapData.centreCoords.lat
    const zoom = 'z=' + sourceMapData.getStandardZoom({ default: 6 })

    let directions = ''
    if ('directions' in sourceMapData && 'route' in sourceMapData.directions) {
      const sourceWaypoints = sourceMapData.directions.route.filter((wpt) => {
        return ('coords' in wpt)
      })
      const waypointPairs = sourceWaypoints.map(wpt => {
        return wpt.coords.lat + ',' + wpt.coords.lng
      })
      const routeCoords = waypointPairs.join('~')
      let mode = 'auto'
      if (sourceMapData.directions.mode) {
        switch (sourceMapData.directions.mode) {
          case 'car':
            mode = 'auto'
            break
          case 'bike':
            mode = 'bc'
            break
          case 'foot':
            mode = 'pd'
            break
          case 'transit':
            mode = 'mt'
            break
        }
      }
      directions = '&mode=routes&rtext=' + routeCoords + '&rtt=' + mode
    }

    if (directions.length > 0) {
      const mapLinksWithDirns = [
        {
          name: 'Maps',
          url: yandexBase + '?' + mapCentre + directions + '&' + zoom
        },
        {
          name: 'Satellite',
          url: yandexBase + '?l=sat&' + mapCentre + directions + '&' + zoom
        },
        {
          name: 'Hybrid',
          url: yandexBase + '?l=sat%2Cskl&' + mapCentre + directions + '&' + zoom
        }
      ]
      view.addMapServiceLinks(this, mapLinksWithDirns)
    }
  }
}
