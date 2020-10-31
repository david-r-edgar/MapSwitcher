export default {
  id: 'hereDirections',
  generate: function (sourceMapData, view) {
    const hereBase = 'https://wego.here.com/'
    const mapCentre = '?map=' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    let directions = ''
    let note = ''
    const zoom = sourceMapData.getStandardZoom()

    if ('directions' in sourceMapData &&
              'route' in sourceMapData.directions) {
      let route = ''
      for (const rteWpt of sourceMapData.directions.route) {
        route += '/'
        if ('address' in rteWpt) {
          route += rteWpt.address
        }
        if ('coords' in rteWpt) {
          route += ':' + rteWpt.coords.lat + ',' + rteWpt.coords.lng
        }
      }

      let mode = 'mix'
      if (sourceMapData.directions.mode) {
        switch (sourceMapData.directions.mode) {
          case 'foot':
            mode = 'walk'
            break
          case 'car':
            mode = 'drive'
            break
          case 'transit':
            mode = 'publicTransport'
            break
          case 'bike':
            mode = 'bicycle'
        }
      }

      directions = 'directions/' + mode + route

      if (sourceMapData.directions.route.length > 10) {
        note = 'Here limited to 10 waypoints'
      }
    }

    if (directions.length > 0) {
      const mapLinksDirns = [
        {
          name: 'Map',
          url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'normal'
        },
        // FIXME do all the rest of these actually still work?
        {
          name: 'Terrain',
          url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'terrain'
        },
        {
          name: 'Satellite',
          url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'satellite'
        },
        {
          name: 'Traffic',
          url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'traffic'
        },
        {
          name: 'Public Transport',
          url: hereBase + directions + mapCentre + ',' + zoom + ',' + 'public_transport'
        }
      ]
      view.addMapServiceLinks(this, mapLinksDirns, note)
    }
  }
}
