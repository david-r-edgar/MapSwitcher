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
            } else if (coordArray[4] === 'm') {
                //on google satellite / earth, the zoom is specified in the URL not
                //as the standard 'z' value but as an m value, which is the height in
                //metres of the map displayed in the map window.
                //(i.e. if you resize the window, you'll see the URL updated accordingly)
                sourceMapData.resolution = coordArray[3] / document.body.offsetHeight;
            }
        }

        //google maps URLs have route waypoints specified in two different places

        //first we look for the 'dir' waypoints
        //these are where any named addresses will be (but maybe coords too)
        var re = /dir\/(([-A-Za-z0-9%'+,!$_.*()]+\/){2,})@/
        var wholeRouteArray = window.location.pathname.match(re);
        if (wholeRouteArray && wholeRouteArray.length > 1) {
            sourceMapData.directions = {}
            sourceMapData.directions.route = new Array();
            for (var arrWpt of wholeRouteArray[1].split('/')) {
                if (arrWpt.length > 0) {
                    var wptObj = { address: arrWpt }

                    //check if the address looks like a coordinate
                    //if so, we put it in the coords sub-object too
                    var coordRe = /([-0-9.]+),[+]?([-0-9.]+)/;
                    var addrIsCoordArr = arrWpt.match(coordRe);
                    if (addrIsCoordArr && addrIsCoordArr.length > 2) {
                        wptObj.coords =
                        { lat: addrIsCoordArr[1], lng: addrIsCoordArr[2] }
                    }
                    sourceMapData.directions.route.push(wptObj);
                }
            }
        }

        //we expect to have sub-objects for each waypoint now (is this correct?)
        //But some of them may only have addresses, not coordinates.
        //So we must parse the data part of the URL to find the coords.

        //double 4m identifying the directions part of the data string
        var re = /!4m[0-9]+!4m[0-9]+/;
        var directionsArray = window.location.pathname.match(re);
        if (directionsArray && directionsArray.length >= 1) {
            var dataRouteSubstr = window.location.pathname.substr(directionsArray.index + directionsArray[0].length);
        }
        var mapDataWptIndex = 0;
        //keep a record of the previous string length we had when entering the loop
        //- in case it's the same, we've found no matches, so don't continue
        var prevSubstrLen = dataRouteSubstr.length + 1;
        while (dataRouteSubstr.length > 0 && prevSubstrLen > dataRouteSubstr.length) {
            var prevSubstrLen = dataRouteSubstr.length;
            var rteWptRe = /^!1m([0-9]+)/;
            var rteWptArray = dataRouteSubstr.match(rteWptRe);
            if (rteWptArray && rteWptArray.length > 1) {
                if ("0" == rteWptArray[1]) {
                    //we'll match '1m0' when no coord is given in the data
                    //- quite likely it'll already have been parsed from the address
                    dataRouteSubstr = dataRouteSubstr.substr(rteWptArray[0].length);
                    mapDataWptIndex++;
                } else {
                    dataRouteSubstr = dataRouteSubstr.substr(rteWptArray[0].length);
                    //normally we get a '1m5' here indicating the coordinates of
                    //one of the named waypoints
                    var wptRe = /![0-9a-z]+![0-9a-z:]+!2m2!1d([-0-9.]+)!2d([-0-9.]+)/
                    var wptArray = dataRouteSubstr.match(wptRe);
                    if (wptArray && wptArray.length > 2) {
                        //oddly longitude is given before latitude
                        sourceMapData.directions.route[mapDataWptIndex].coords =
                        { lat: wptArray[2], lng: wptArray[1] }
                        dataRouteSubstr = dataRouteSubstr.substr(wptArray.index +
                            wptArray[0].length);
                        mapDataWptIndex++;
                    }
                }
            }
        }

        var re = /!3e([0-3])$/;
        var modeArray = dataRouteSubstr.match(re);
        if (modeArray && modeArray.length >= 1) {
            switch (modeArray[1]) {
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
            //we expect a single 'From' input, followed by one or more 'To' inputs
            sourceMapData.directions = {
                route: [ { address: $(".dirWaypoints input[title='From']").val() } ]
            }
            $(".dirWaypoints input[title='To']").each(function() {
               sourceMapData.directions.route.push( { address: $(this).val() } );
            });

            var re = /([-0-9.]+)[ ]*,[ ]*([-0-9.]+)/
            for (rteWptIndex in sourceMapData.directions.route) {
                var wptArray =
                    sourceMapData.directions.route[rteWptIndex].address.match(re);
                if (wptArray && wptArray.length > 2) {
                    sourceMapData.directions.route[rteWptIndex].coords =
                        {"lat": wptArray[1], "lng": wptArray[2]}
                }
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
                route: [
                    { address: $("#route_from").val() },
                    { address: $("#route_to").val() }
                ]
            }

            re = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/;
            var routeCoordsArray = window.location.search.match(re);
            if (routeCoordsArray && routeCoordsArray.length > 4) {
                sourceMapData.directions.route[0].coords =
                    { "lat": routeCoordsArray[1],
                    "lng": routeCoordsArray[2] }
                sourceMapData.directions.route[1].coords =
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
    } else if (window.location.hostname.indexOf("waze.com") >= 0) {
        var href="";
        $(".leaflet-control-permalink .permalink").each(function() {
            href=$(this).attr('href');
            if (href.length > 0) {
                return false; //break on first non-empty URL
            }
        });
        var re = /zoom=([0-9]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/;
        var coordArray = href.match(re);
        if (coordArray && coordArray.length > 3) {
            sourceMapData.centreCoords = {"lat": coordArray[2], "lng": coordArray[3]}
            sourceMapData.resolution =
                calculateResolutionFromStdZoom(coordArray[1], coordArray[2]);
        }

        var routesHref="";
        $(".routes-list .permalink").each(function() {
            routesHref=$(this).attr('href');
            if (routesHref.length > 0) {
                return false; //break on first non-empty URL
            }
        });

        var re = /from_lat=([-0-9.]+)&from_lon=([-0-9.]+)&to_lat=([-0-9.]+)&to_lon=([-0-9.]+)/;
        var routeCoordsArray = routesHref.match(re);
        if (routeCoordsArray && routeCoordsArray.length > 4) {

            sourceMapData.directions = {
                route: [
                    {
                        coords: { lat: routeCoordsArray[1],
                                lng: routeCoordsArray[2] }
                    },
                    {
                        coords: { lat: routeCoordsArray[3],
                                lng: routeCoordsArray[4] }
                    }
                ]
            }
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
