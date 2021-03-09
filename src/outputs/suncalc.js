export default {
  generate: function (sourceMapData, view) {
    const suncalcBase = 'http://suncalc.org/#/'
    const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const dayOfMonth = now.getDate()
    const hours = now.getHours()
    const mins = now.getMinutes()
    const date = year + '.' + month + '.' + dayOfMonth
    const time = hours + ':' + mins

    const mapLinks = [{
      name: 'Sunrise + sunset times',
      url: suncalcBase + mapCentre + ',' + zoom + '/' + date + '/' + time + '/1/0'
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
