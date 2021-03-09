/* eslint-disable no-unused-vars */

// @constant
// @type {number}
// @default
// The resolution of the whole world map at zoom 0, in metres per pixel,
// as used in google, bing maps and others.
// Calculated: ~ 40075 * 1000/ 256
// (40075 is the circumference of the earth at the equator in km, and the
// 360 degree world map is 256 pixels wide at zoom 0.)
var WORLD_RESOLUTION_MPP = 156543.03392

// I have no idea what the median pixel pitch is, so I just used this one (96dpi).
var MEDIAN_PIXEL_PITCH = 0.264

// Calculates the map resolution for a given latitude from the zoom level
// as used for google, bing, and other common mapping services
//
// @param {number} zoom - zoom level (eg. z value from google URL)
// @param {number} lat - latitude, wgs84 decimal
// @returns {number} resolution returned in metres per pixel
function calculateResolutionFromStdZoom (zoom, lat) {
  const latAdjCoeff = Math.cos(lat * Math.PI / 180)
  return WORLD_RESOLUTION_MPP * latAdjCoeff / Math.pow(2, zoom)
}

// Calculates the standard zoom level, as used in common mapping services
// like google and bing, from the resolution, for a specific latitude.
//
// @param {number} resn - resolution, in metres per pixel
// @param {number} lat - latitude, wgs84 decimal
// @param {integer} min - minimum zoom to return
// @param {integer} max - maximum zoom to return
// @returns {integer} zoom level integer (normally in the range 0-20)
function calculateStdZoomFromResolution (resn, lat, min, max) {
  const latAdjCoeff = Math.cos(lat * Math.PI / 180)
  let zoom = Math.log(WORLD_RESOLUTION_MPP * latAdjCoeff / resn) / Math.log(2)
  if (min > zoom) zoom = min
  if ((max > 0) && (max < zoom)) zoom = max
  return Math.round(zoom)
}

// Calculates the map scale from the given map resolution and screen pixel pitch.
//
// @param {number} resn - map resolution in metres per pixel
// @param {number} pixelPitch - pixel pitch in mm per pixel
// @return {number} map scale
function calculateScaleFromResolution (resn, pixelPitch) {
  if (!pixelPitch) {
    pixelPitch = MEDIAN_PIXEL_PITCH
  }
  return resn / (pixelPitch / 1000)
}

// Calculates the map resolution from the given scale and screen pixel pitch.
//
// @param {number} scale - map scale (where the human-readable scale is 1:scale)
// @param {number} pixelPitch - pixel pitch in mm per pixel
// @return {number} resolution, in metres per pixel
function calculateResolutionFromScale (scale, pixelPitch) {
  if (!pixelPitch) {
    pixelPitch = MEDIAN_PIXEL_PITCH
  }
  return scale * pixelPitch / 1000
}

// Calculates the screen resolution (dpi) from the pixel pitch (mm per pixel).
//
// @param {number} pixelPitch - in mm per pixel
// @return {number} screen resolution - in dots per inch
function calculateDPIFromPixelPitch (pixelPitch) {
  return 25.4 / pixelPitch
}

// Calculates the pixel pitch (mm per pixel) from the screen resolution (dpi).
//
// @param {number} screen resolution - in dots per inch
// @return {number} pixelPitch - in mm per pixel
function calculatePixelPitchFromDPI (ppi) {
  return 25.4 / ppi
}

function getDistanceFromLatLonInKm (lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1) // deg2rad below
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

function deg2rad (deg) {
  return deg * (Math.PI / 180)
}

/* eslint-ensable no-unused-vars */
