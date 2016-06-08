//156543.03392 is a coefficient related to the diameter of the earth

function calculateMetresPerPixelfromGoogleZoom(zoom, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    return 156543.03392 * latAdjCoeff / Math.pow(2, zoom);
}

function calculateGoogleZoomFromMetresPerPixel(mpp, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    let zoom = Math.log(156543.03392 * latAdjCoeff / mpp) / Math.log(2);
    return Math.round(zoom);
}

function calculateScaleFromMetresPerPixel(mpp, pixelPitch_mm) {
    return mpp / (pixelPitch_mm / 1000);
}

function calculatePPIFromPixelPitch(pixelPitch_mm) {
    return 25.4 / pixelPitch_mm;
}

function calculatePixelPitchFromPPI(ppi) {
    return 25.4 / ppi;
}
