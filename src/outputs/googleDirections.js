export default {
  generate: function (sourceMapData, view) {
    const googleBase = 'https://www.google.com/maps/'
    let directions = ''
    const mapCentre = '@' + sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng + ','
    let dataWpts = ''
    let dataDirnOptions = ''

    if ('directions' in sourceMapData && 'route' in sourceMapData.directions) {
      directions = 'dir/'

      for (const rteWpt of sourceMapData.directions.route) {
        if ('address' in rteWpt) {
          // if address specified, add to directions
          directions += rteWpt.address + '/'

          if ('coords' in rteWpt) {
            // if coord also specified, add to data
            dataWpts += '!1m5!1m1!1s0x0:0x0!2m2!1d' +
                          rteWpt.coords.lng + '!2d' + rteWpt.coords.lat
          } else {
            dataWpts += '!1m0'
          }
        } else if ('coords' in rteWpt) {
          // else if coord specified, add to directions
          directions += rteWpt.coords.lat + ',' + rteWpt.coords.lng + '/'
          dataWpts += '!1m0'
        }
      }

      let mode = ''
      if (sourceMapData.directions.mode) {
        switch (sourceMapData.directions.mode) {
          case 'foot':
            mode = '!3e2'
            break
          case 'bike':
            mode = '!3e1'
            break
          case 'car':
            mode = '!3e0'
            break
          case 'transit':
            mode = '!3e3'
            break
        }
      }

      dataDirnOptions = dataWpts + mode

      // add elements identifying directions, with counts of all following sub-elements
      const exclMarkCount = (dataDirnOptions.match(/!/g) || []).length
      dataDirnOptions = '!4m' + (exclMarkCount + 1) + '!4m' + exclMarkCount + dataDirnOptions
    }

    const zoom = sourceMapData.getStandardZoom({ min: 3 }) + 'z'

    if (directions.length > 0) {
      const mapLinksWithDirns = [
        {
          name: 'Maps',
          url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions
        },
        {
          name: 'Terrain',
          url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e4'
        },
        {
          name: 'Satellite',
          url: googleBase + directions + mapCentre + zoom + '/data=!3m1!1e3' + dataDirnOptions
        },
        {
          name: 'Traffic',
          url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e1'
        },
        {
          name: 'Cycling',
          url: googleBase + directions + mapCentre + zoom + '/data=' + dataDirnOptions + '!5m1!1e3'
        }
      ]
      view.addMapServiceLinks(this, mapLinksWithDirns)
    }
  }
}
