export default {
  id: 'suncalc',
  generate: function (sourceMapData, view) {
    const suncalcBase = 'http://suncalc.org/#/'
    const mapCentre = sourceMapData.centreCoords.lat + ',' + sourceMapData.centreCoords.lng
    const zoom = sourceMapData.getStandardZoom()

    var now = new Date()
    var year = now.getFullYear()
    var month = now.getMonth() + 1
    var dayOfMonth = now.getDate()
    var hours = now.getHours()
    var mins = now.getMinutes()
    var date = year + '.' + month + '.' + dayOfMonth
    var time = hours + ':' + mins

    const mapLinks = [{
      name: 'Sunrise + sunset times',
      url: suncalcBase + mapCentre + ',' + zoom + '/' + date + '/' + time + '/1/0'
    }]
    view.addMapServiceLinks(this, mapLinks)
  }
}
