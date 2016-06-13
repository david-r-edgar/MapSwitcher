
/**
 * @constant
 * @type {number}
 * @default
 * The resolution of the whole world map at zoom 0, in metres per pixel,
 * as used in google, bing maps and others.
 * Calculated: ~ 40075 * 1000/ 256
 * (40075 is the circumference of the earth at the equator in km, and the
 * 360 degree world map is 256 pixels wide at zoom 0.)
 *
 * FIXME I wanted to define this as const, but get an already-declared error. Why?
 */
var WORLD_RESOLUTION_MPP = 156543.03392;

/**
 * Calculates the map resolution for a given latitude from the zoom level
 * as used for google, bing, and other common mapping services
 *
 * @param {number} zoom - zoom level (eg. z value from google URL)
 * @param {number} lat - latitude, wgs84 decimal
 * @returns {number} resolution returned in metres per pixel
 */
function calculateResolutionFromStdZoom(zoom, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    return WORLD_RESOLUTION_MPP * latAdjCoeff / Math.pow(2, zoom);
}


/**
 * Calculates the standard zoom level, as used in common mapping services
 * like google and bing, from the resolution, for a specific latitude.
 *
 * @param {number} resn - resolution, in metres per pixel
 * @param {number} lat - latitude, wgs84 decimal
 * @returns {integer} zoom level integer (normally in the range 0-20)
 */
function calculateStdZoomFromResolution(resn, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    let zoom = Math.log(WORLD_RESOLUTION_MPP * latAdjCoeff / resn) / Math.log(2);
    return Math.round(zoom);
}



//pixelPitch in mm per pixel
function calculateScaleFromResolution(resn, pixelPitch) {
    return resn / (pixelPitch / 1000);
}

//pixelPitch in mm per pixel
//returns screen resolution in pixels per inch
function calculatePPIFromPixelPitch(pixelPitch) {
    return 25.4 / pixelPitch;
}

//ppi screen resolution in pixels per inch
//returns pixel pitch in mm per pixel
function calculatePixelPitchFromPPI(ppi) {
    return 25.4 / ppi;
}




