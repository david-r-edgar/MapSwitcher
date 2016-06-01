var sourceMapData = {}

if (window.location.hostname.indexOf("google.") >= 0) {

    var re = /@([-0-9.]+),([-0-9.]+),/;
    var coordArray = window.location.pathname.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
    }

    //window.location.pathname url-encodes other characters so we can ignore them
    re = /dir\/([-A-Za-z0-9%'+,!$_.*()]+)\/([-A-Za-z0-9%'+,!$_.*()]+)\//;
    coordArray = window.location.pathname.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData.directions = {
            "from": coordArray[1],
            "to": coordArray[2]}

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
        var re = /cp=([-0-9.]+)~([-0-9.]+)/
        var coordArray = window.location.search.match(re);
        if (coordArray && coordArray.length >= 3) {
            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
        }
    } else {
        //scrolling has happened, but bing doesn't update its URL. So we pull
        //the coords from the'MapModeStateHistory'
        sourceMapData.centreCoords = {
            "lat": window.history.state.MapModeStateHistory.centerPoint.latitude, "lng": window.history.state.MapModeStateHistory.centerPoint.longitude}
    }

    if ($("#directionsPanelRoot").length) {
        sourceMapData.directions = {
            "from": $(".dirWaypoints input[title='From']").val(),
            "to": $(".dirWaypoints input[title='To']").val()}

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
        //coordArray[1] is the zoom
        sourceMapData.centreCoords = {"lat": coordArray[2], "lng": coordArray[3]}
    }

    if ($(".directions_form").is(':visible')
        && ($("#route_from").val().length > 0)
        && ($("#route_to").val().length > 0)) {
        sourceMapData.directions = {
            "from": $("#route_from").val(), "to": $("#route_to").val()}

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
        sourceMapData.scale = scaleMatch[1];
    }
} else if (window.location.hostname.indexOf("geocaching.") >= 0) {
    var re = /ll=([-0-9.]+),([-0-9.]+)/;
    var coordArray = window.location.hash.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
    }
} else if (window.location.hostname.indexOf("wikimapia.org") >= 0) {
    var re = /&lat=([-0-9.]+)&lon=([-0-9.]+)&/;
    coordArray = window.location.hash.match(re);
    if (coordArray && coordArray.length >= 3) {
        sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
    }

    var re = /&z=([0-9]+)&/;
    var zoomArray = window.location.hash.match(re);
    if (zoomArray && zoomArray.length > 1) {
        //FIXME convert this into scale: sourceMapData.scale = zoomArray[1];
    }
}

//this expression is how we return a result object to the caller (extension script)
sourceMapData

