//156543.03392 is a coefficient related to the diameter of the earth

//zoom z value from google URL (decimal)
//lat wgs84 decimal
//resn returned in metres per pixel
function calculateResolutionFromGoogleZoom(zoom, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    return 156543.03392 * latAdjCoeff / Math.pow(2, zoom);
}

//resn in metres per pixel
//lat wgs84 decimal
//returns integer zoom for use as z parameter in google URL
function calculateGoogleZoomFromResolution(resn, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    let zoom = Math.log(156543.03392 * latAdjCoeff / resn) / Math.log(2);
    return Math.round(zoom);
}


//from https://msdn.microsoft.com/en-us/library/aa940990.aspx
//156543.04 is in metres per pixel (?)
function calculateResolutionFromBingZoom(zoom, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    return 156543.04 * latAdjCoeff / Math.pow(2, zoom)
}

function calculateBingZoomFromResolution(resn, lat) {
    let latAdjCoeff = Math.cos(lat * Math.PI / 180);
    let zoom = Math.log(156543.04 * latAdjCoeff / resn) / Math.log(2);
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


function getCountryCode(lat, lng) {
    grid = codegrid.CodeGrid("http://localhost/codegrid-js/tiles/", jsonWorldGrid);
    console.log(jsonWorldGrid);
    console.log(lat, lng);
    grid.getCode (Number(lat), Number(lng), function (error, code) {
        if (error) {
            console.log("error");
            return null;
        } else {
            console.log(code);
            return code;
        }
    });
}




