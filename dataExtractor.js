var sourceMapData = {}

if (window.location.hostname.indexOf(".bing.") >= 0) {

    console.log(window.history);
    //TODO if there's no 'state', it means no scrolling has happened yet.
    //So we should extract the lat and lng from the window.location parameter

    var lat = window.history.state.MapModeStateHistory.centerPoint.latitude;
    var lng = window.history.state.MapModeStateHistory.centerPoint.longitude;

    console.log(lat + ", " + lng);

    sourceMapData.centreLat = lat;
    sourceMapData.centreLng = lng;

} else if (window.location.hostname.indexOf("google.") >= 0) {

    var re = /@([-0-9.]+),([-0-9.]+),/;
    coordArray = window.location.pathname.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreLat = coordArray[1];
        sourceMapData.centreLng = coordArray[2];
    }

    //TODO correct legal characters for locations in google URL?
    re = /dir\/([-A-Za-z0-9%'+,]+)\/([-A-Za-z0-9%'+,]+)\//;
    coordArray = window.location.pathname.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData["dirFrom"] = coordArray[1];
        sourceMapData["dirTo"] = coordArray[2];
    }

}

//this expression is how we return a result object to the caller (extension script)
sourceMapData

