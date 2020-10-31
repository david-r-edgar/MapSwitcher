function copyTextToClipboard (text) {
  // create a temporary textbox field into which we can insert text
  const copyFrom = document.createElement('textarea')
  copyFrom.textContent = text
  document.body.appendChild(copyFrom)

  copyFrom.select()
  document.execCommand('copy')

  copyFrom.blur()
  document.body.removeChild(copyFrom)
}

export default {
  id: 'clipboard',
  generate: function (sourceMapData, view) {
    view.addUtilityLink(this, 'copyToClipboard', 'Copy map centre coordinates', function () {
      copyTextToClipboard(sourceMapData.centreCoords.lat + ', ' + sourceMapData.centreCoords.lng)
    })
  }
}
