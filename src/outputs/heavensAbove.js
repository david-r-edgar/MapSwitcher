export default {
  generate: function (sourceMapData, view) {
    const base = 'https://heavens-above.com'
    const mapCentre = 'lat=' + sourceMapData.centreCoords.lat + '&lng=' + sourceMapData.centreCoords.lng

    let timezone
    try {
      timezone = '&tz=' + new Date().toString().split(' ')[5].split('+')[0]
    } catch (err) {
      timezone = ''
    }

    const mapLinks = [
      {
        name: 'Main',
        url: `${base}/main.aspx?${mapCentre}${timezone}`
      },
      {
        name: 'Live Sky View',
        url: `${base}/skyview/?${mapCentre}&cul=en#/livesky`
      }
    ]
    view.addMapServiceLinks(this, mapLinks)
  }
}
