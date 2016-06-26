var runDataExtraction = function () {
    var sourceMapData = {}

    if (window.location.hostname.indexOf("google.") >= 0) {

        var re = /@([-0-9.]+),([-0-9.]+),([0-9.]+)([a-z])/;
        var coordArray = window.location.pathname.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
        }
        if (coordArray && coordArray.length >= 5) {
            if (coordArray[4] === 'z') {
                sourceMapData.resolution =
                    calculateResolutionFromStdZoom(coordArray[3],
                                                coordArray[1]);
            } else {
                console.log("unknown scale system " + coordArray[4]);
                //FIXME we have to deal with m - normally eg. 7000m - metres?
            }
        }

        //window.location.pathname url-encodes other characters so we can ignore them
        re = /dir\/([-A-Za-z0-9%'+,!$_.*()]+)\/([-A-Za-z0-9%'+,!$_.*()]+)\//;
        routeArray = window.location.pathname.match(re);
        if (routeArray && routeArray.length > 2) {
            sourceMapData.directions = {
                "from": { "address": routeArray[1] },
                "to": { "address": routeArray[2] }
            }

            re = /dir\/([-0-9.]+),\+([-0-9.]+)\/([-0-9.]+),\+([-0-9.]+)\//;
            var dirnCoordsArray = window.location.pathname.match(re);
            if (dirnCoordsArray && dirnCoordsArray.length > 4) {
                sourceMapData.directions.from.coords =
                    {"lat": dirnCoordsArray[1], "lng": dirnCoordsArray[2]}
                sourceMapData.directions.to.coords =
                    {"lat": dirnCoordsArray[3], "lng": dirnCoordsArray[4]}
            }

            re = /!3e([0-3])/;
            var modeArray = window.location.pathname.match(re);
            switch (modeArray && modeArray[1]) {
                case "0":
                    sourceMapData.directions.mode = "car";
                    break;
                case "1":
                    sourceMapData.directions.mode = "bike";
                    break;
                case "2":
                    sourceMapData.directions.mode = "foot";
                    break;
                case "3":
                    sourceMapData.directions.mode = "transit";
                    break;
            }
        }
    } else if (window.location.hostname.indexOf(".bing.") >= 0) {

        //if there's no 'state', it means no scrolling has happened yet.
        //So we should extract the lat and lng from the window.location parameter
        if (window.history && !window.history.state) {
            var re = /cp=([-0-9.]+)~([-0-9.]+)/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length >= 3) {
                sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
            }
            re = /lvl=([0-9]+)/;
            var levelArray = window.location.search.match(re);
            if (levelArray && levelArray.length > 1) {
                sourceMapData.resolution = calculateResolutionFromStdZoom(
                    levelArray[1], sourceMapData.centreCoords.lat);
            }
        } else {
            //scrolling has happened, but bing doesn't update its URL. So we pull
            //the coords from the'MapModeStateHistory'
            sourceMapData.centreCoords = {
                "lat": window.history.state.MapModeStateHistory.centerPoint.latitude, "lng": window.history.state.MapModeStateHistory.centerPoint.longitude}

            var level = history.state.MapModeStateHistory.level;
            sourceMapData.resolution = calculateResolutionFromStdZoom(
                level, sourceMapData.centreCoords.lat);
        }

        if ($("#directionsPanelRoot").length) {
            sourceMapData.directions = {
                "from": { "address": $(".dirWaypoints input[title='From']").val() },
                "to": { "address": $(".dirWaypoints input[title='To']").val() }
            }

            var re = /([-0-9.]+)[ ]*,[ ]*([-0-9.]+)/
            var fromArray = sourceMapData.directions.from.address.match(re);
            if (fromArray && fromArray.length > 2) {
                sourceMapData.directions.from.coords =
                    {"lat": fromArray[1], "lng": fromArray[2]}
            }
            var toArray = sourceMapData.directions.to.address.match(re);
            if (toArray && toArray.length > 2) {
                sourceMapData.directions.to.coords =
                    {"lat": toArray[1], "lng": toArray[2]}
            }

            switch($(".dirBtnSelected")[0].classList[0]) {
                case "dirBtnDrive":
                    sourceMapData.directions.mode = "car";
                    break;
                case "dirBtnTransit":
                    sourceMapData.directions.mode = "transit";
                    break;
                case "dirBtnWalk":
                    sourceMapData.directions.mode = "foot";
                    break;
            }
        }
    } else if (window.location.hostname.indexOf("openstreetmap.") >= 0) {
        var re = /map=([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/;
        var coordArray = window.location.hash.match(re);
        if (coordArray && coordArray.length >= 4) {
            sourceMapData.centreCoords = {"lat": coordArray[2], "lng": coordArray[3]}
            sourceMapData.resolution = calculateResolutionFromStdZoom(
                    coordArray[1], sourceMapData.centreCoords.lat);
        }

        if ($(".directions_form").is(':visible')
            && ($("#route_from").val().length > 0)
            && ($("#route_to").val().length > 0)) {
            sourceMapData.directions = {
                "from": { "address": $("#route_from").val() },
                "to": { "address": $("#route_to").val() }
            }

            re = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/;
            var routeCoordsArray = window.location.search.match(re);
            if (routeCoordsArray && routeCoordsArray.length > 4) {
                sourceMapData.directions.from.coords =
                    { "lat": routeCoordsArray[1],
                    "lng": routeCoordsArray[2] }
                sourceMapData.directions.to.coords =
                    { "lat": routeCoordsArray[3],
                    "lng": routeCoordsArray[4] }
            }

            re = /engine=[a-zA-Z]+_([a-z]+)/;
            var modeArray = window.location.search.match(re);
            if (modeArray && modeArray.length > 1) {
                switch (modeArray[1]) {
                    case "bicycle":
                        sourceMapData.directions.mode = "bike";
                        break;
                    case "car":
                        sourceMapData.directions.mode = "car";
                        break;
                    case "foot":
                        sourceMapData.directions.mode = "foot";
                        break;
                }
            }
        }
    } else if (window.location.hostname.indexOf("tools.wmflabs.org") >= 0) {
        var re = /params=([-0-9.]+)_N_([-0-9.]+)_E/;
        var coordArray = window.location.search.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
        }
        var scaleElem = $(".toccolours th:contains('Scale')").next();
        var re = /1:([0-9]+)/;
        var scaleMatch = scaleElem[0].innerText.match(re);
        if (scaleMatch && scaleMatch.length > 1) {
            sourceMapData.resolution = calculateResolutionFromScale(scaleMatch[1]);
        }
    } else if (window.location.hostname.indexOf("geocaching.") >= 0) {
        var re = /ll=([-0-9.]+),([-0-9.]+)/;
        var coordArray = window.location.hash.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
        }
        re = /z=([0-9]+)/;
        var zoomArray = window.location.hash.match(re);
        if (zoomArray && zoomArray.length > 1) {
            sourceMapData.resolution = calculateResolutionFromStdZoom(
                    zoomArray[1], sourceMapData.centreCoords.lat);
        }
    } else if (window.location.hostname.indexOf("wikimapia.org") >= 0) {
        var re = /&lat=([-0-9.]+)&lon=([-0-9.]+)&/;
        coordArray = window.location.hash.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
        }
        re = /z=([0-9]+)/;
        var zoomArray = window.location.hash.match(re);
        if (zoomArray && zoomArray.length > 1) {
            sourceMapData.resolution = calculateResolutionFromStdZoom(
                    zoomArray[1], sourceMapData.centreCoords.lat);
        }
    } /* else if (window.location.hostname.indexOf("open.mapquest.com") >= 0) {
        var re = /center=([-0-9.]+),([-0-9.]+)/;
        coordArray = window.location.search.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
        }
        re = /zoom=([0-9]+)/;
        var zoomArray = window.location.search.match(re);
        if (zoomArray && zoomArray.length > 1) {
            sourceMapData.resolution = calculateResolutionFromStdZoom(
                    zoomArray[1], sourceMapData.centreCoords.lat);
        }
    } */

    //return result object to the caller (main extension script)
    return sourceMapData;
};

runDataExtraction();
