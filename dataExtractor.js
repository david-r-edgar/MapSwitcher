var sourceMapData = {}

if (window.location.hostname.indexOf(".bing.") >= 0) {

    //if there's no 'state', it means no scrolling has happened yet.
    //So we should extract the lat and lng from the window.location parameter
    if (window.history && !window.history.state) {
        var re = /cp=([-0-9.]+)~([-0-9.]+)/
        coordArray = window.location.search.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreLat = coordArray[1];
            sourceMapData.centreLng = coordArray[2];
        }
    } else {
        //scrolling has happened, but bing doesn't update its URL. So we pull the coords
        //from the'MapModeStateHistory'
        sourceMapData.centreLat = window.history.state.MapModeStateHistory.centerPoint.latitude;
        sourceMapData.centreLng = window.history.state.MapModeStateHistory.centerPoint.longitude;
    }

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

} else if (window.location.hostname.indexOf("openstreetmap.") >= 0) {
    var re = /map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/;
    coordArray = window.location.hash.match(re);
    if (coordArray && coordArray.length >= 4) {
        //coordArray[1] is the zoom
        sourceMapData.centreLat = coordArray[2];
        sourceMapData.centreLng = coordArray[3];
    }

} else if (window.location.hostname.indexOf("geocaching.") >= 0) {
    var re = /ll=([-0-9.]+),([-0-9.]+)/;
    coordArray = window.location.hash.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreLat = coordArray[1];
        sourceMapData.centreLng = coordArray[2];
    }
}

//this expression is how we return a result object to the caller (extension script)
sourceMapData

