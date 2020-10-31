export default {
  id: 'bingDirections',
  generate: function (sourceMapData, view) {
    const bingBase = 'https://www.bing.com/maps/?'
    let directions = ''
    const mapCentre = 'cp=' + sourceMapData.centreCoords.lat + '~' +
                              sourceMapData.centreCoords.lng
    const zoom = '&lvl=' + sourceMapData.getStandardZoom({
      default: 10,
      min: 3,
      max: 20
    })

    if ('directions' in sourceMapData &&
              'route' in sourceMapData.directions) {
      directions = 'rtp='
      for (const rteWpt of sourceMapData.directions.route) {
        if ('coords' in rteWpt) {
          directions += 'pos.' + rteWpt.coords.lat + '_' + rteWpt.coords.lng
          if ('address' in rteWpt) {
            directions += '_' + rteWpt.address
          }
          directions += '~'
        } else if ('address' in rteWpt) {
          directions += 'adr.' + rteWpt.address + '~'
        }
      }

      let mode = ''
      if (sourceMapData.directions.mode) {
        switch (sourceMapData.directions.mode) {
          case 'foot':
            mode = '&mode=w'
            break
          case 'car':
            mode = '&mode=d'
            break
          case 'transit':
            mode = '&mode=t'
            break
        }
      }

      directions += mode
    }

    const mapLinksWithDirns = [
      {
        name: 'Road',
        url: bingBase + directions + '&' + mapCentre + zoom
      },
      {
        name: 'Aerial',
        url: bingBase + directions + '&' + mapCentre + zoom + '&sty=h'
      },
      {
        name: "Bird's eye",
        url: bingBase + directions + '&' + mapCentre + zoom + '&sty=b'
      }
    ]

    if (sourceMapData.countryCode === 'gb' || sourceMapData.countryCode === 'im') {
      mapLinksWithDirns.push({
        name: 'Ordnance Survey',
        url: bingBase + directions + '&' + mapCentre + zoom + '&sty=s'
      })
    }

    if (directions.length > 0) {
      view.addMapServiceLinks(this, mapLinksWithDirns)
    }
  }
}
