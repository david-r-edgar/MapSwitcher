/* global
  registerExtractor */

registerExtractor(resolve => {
  const sourceMapData = {}
  const permalink = document.getElementsByClassName('wz-attribution-link__input')[0]
  const [, lat, lng] = permalink.value.match(/latlng=([-0-9.]+)%2C([-0-9.]+)/)
  if (lat && lng) {
    sourceMapData.centreCoords = { lat, lng }
    // apparently it no longer supports zoom
  }

  const originPrimary = document.querySelector('.wz-search-container.is-origin .wm-search__primary')
  const originSecondary = document.querySelector('.wz-search-container.is-origin .wm-search__secondary')
  const destinationPrimary = document.querySelector('.wz-search-container.is-destination .wm-search__primary')
  const destinationSecondary = document.querySelector('.wz-search-container.is-destination .wm-search__secondary')
  if (originPrimary?.textContent && originSecondary?.textContent &&
    destinationPrimary?.textContent && destinationSecondary?.textContent) {
    origin = `${originPrimary.textContent}, ${originSecondary.textContent}`
    destination = `${destinationPrimary.textContent}, ${destinationSecondary.textContent}`
    sourceMapData.directions = {
      route: [
        { address: origin },
        { address: destination }
      ]
    }
  }

  resolve(sourceMapData)
})
