/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if ("undefined" === typeof browser) {
    browser = chrome;
}


var extractors = [];

extractors.push({
    host: ".google.",
    extract:
        function(resolve, reject) {
            //exceptional case for custom maps
            if ("/maps/d/viewer" == window.location.pathname) {
                var sourceMapData = {}
                var re = /ll=([-0-9.]+)%2C([-0-9.]+)&z=([0-9.]+)/;
                var coordArray = window.location.search.match(re);
                if (coordArray && coordArray.length > 3) {
                    sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
                    sourceMapData.resolution =
                        calculateResolutionFromStdZoom(coordArray[3], coordArray[1]);
                }
                resolve(sourceMapData);
            }
            else if (window.location.pathname.indexOf("/maps/") === 0) {
                var sourceMapData = {}
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

                var addrRe = /\/place\/([^\/]+)\//;
                var addrArray = window.location.pathname.match(addrRe);
                if (addrArray && addrArray.length > 1) {
                    sourceMapData.address = addrArray[1];
                }

                //google maps URLs have route waypoints specified in two different places

                //first we look for the 'dir' waypoints
                //these are where any named addresses will be (but maybe coords too)
                var dirnRe = /dir\/(([-A-Za-z0-9%'+,!$_.*()]+\/){2,})@/
                var wholeRouteArray = window.location.pathname.match(dirnRe);
                if (wholeRouteArray && wholeRouteArray.length > 1) {
                    sourceMapData.searches =
                    [
                        {
                            directions: {}
                        }
                    ]
                    sourceMapData.searches[0].directions.route = new Array();
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
                            sourceMapData.searches[0].directions.route.push(wptObj);
                        }
                    }
                }

                //we expect to have sub-objects for each waypoint now
                //But some of them may only have addresses, not coordinates.
                //So we must parse the data part of the URL to find the coords.
                try {
                    var gmdp = new Gmdp(window.location.href);
                    var gmdpRoute = gmdp.getRoute();
                    var mapDataWptIndex = 0; //index into sourceMapData wpts
                    if (gmdpRoute) {
                        //FIXME we should do a count here - number of gmdp primary wpts should
                        //be equal to number of sourceMapData wpts
                        for (var gmdpWpt of gmdpRoute.getAllWaypoints()) {
                            if (gmdpWpt.primary) {
                                var mapDataWptCoords = sourceMapData.searches[0].directions.route[mapDataWptIndex].coords;
                                //if coords are not yet specified, insert them
                                //- but don't overwrite them if they're already there
                                if ((!mapDataWptCoords) ||
                                    (mapDataWptCoords.lat === undefined) ||
                                    (mapDataWptCoords === undefined)) {
                                    sourceMapData.searches[0].directions.route[mapDataWptIndex].coords =
                                            { lat: gmdpWpt.lat, lng: gmdpWpt.lng }
                                }
                                mapDataWptIndex++;
                            }
                            else {
                                var newSecondaryWpt =
                                    { coords: { lat: gmdpWpt.lat, lng: gmdpWpt.lng } }
                                sourceMapData.searches[0].directions.route.splice(mapDataWptIndex, 0, newSecondaryWpt);
                                mapDataWptIndex++;
                            }
                        }
                        sourceMapData.searches[0].directions.mode = gmdpRoute.getTransportation();
                    }
                    var gmdpPins = gmdp.getPins();
                    if (gmdpPins && gmdpPins.length > 0) {
                        sourceMapData.alternativeCoords =
                            { lat: gmdpPins[0].lat, lng: gmdpPins[0].lng }
                    }
                }
                catch (ex) {
                    if (ex instanceof GmdpException) {
                        //console.log(ex);
                    } else {
                        //console.log("rethrowing", ex);
                        throw ex;
                    }
                }
                finally {
                    resolve(sourceMapData);
                }
            }
            else if (window.location.pathname.indexOf("/search") === 0 ||
                    window.location.pathname.indexOf("/webhp") === 0) {
                try {
                    var gmdp = new Gmdp(window.location.href);
                    var lsm = gmdp.getLocalSearchMap();
                    if (lsm) {
                        resolve({
                            centreCoords: {"lat": lsm.centre.lat, "lng": lsm.centre.lng},
                            resolution: lsm.resolution / 1500
                            //FIXME how is the resoution specified? Why do we apparently need this 1500 coefficient? Where does it come from? Is it correct?
                        });
                    }
                }
                catch(ex) {
                    if (!ex instanceof GmdpException) {
                        throw ex;
                    }
                }
                var re = /&rllag=([-0-9]+),([-0-9]+),([0-9]+)/;
                var coordArray = window.location.hash.match(re);
                //'rllag' can be specified in either the hash or the search
                if (!coordArray) {
                    var coordArray = window.location.search.match(re);
                }
                if (coordArray && coordArray.length > 3) {
                    resolve({
                        centreCoords: {"lat": coordArray[1] / 1000000, "lng": coordArray[2] / 1000000},
                        //FIXME what's the justification behind this coefficient '3'? Is it at all correct?
                        resolution: coordArray[3] / 3,
                        locationDescr: "default map of search results",
                        nonUpdating: window.location.hostname + window.location.pathname
                    });
                } else {
                    $("#media_result_group a").each(function() {
                        var re = /@([-0-9.]+),([-0-9.]+),([0-9.]+)z/;
                        var coordArray = $(this).attr("href").match(re);
                        if (coordArray && coordArray.length > 3) {
                            resolve({
                                centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                                locationDescr: "default map of search results",
                                resolution: calculateResolutionFromStdZoom(
                                    coordArray[3], coordArray[1])
                            });
                        }
                    });
                    resolve(null);
                }
            }
            else {
                reject(null);
            }

        }
});



extractors.push({
    host: ".bing.",
    extract:
        function(resolve) {
            var sourceMapData = {}
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

                sourceMapData.searches =
                [
                    {
                        directions:
                        {
                            route: [ { address: $(".dirWaypoints input[title='From']").val() } ]
                        }
                    }
                ]

                $(".dirWaypoints input[title='To']").each(function() {
                    sourceMapData.searches[0].directions.route.push( { address: $(this).val() } );
                });

                var re = /([-0-9.]+)[ ]*,[ ]*([-0-9.]+)/
                for (rteWptIndex in sourceMapData.searches[0].directions.route) {
                    var wptArray =
                        sourceMapData.searches[0].directions.route[rteWptIndex].address.match(re);
                    if (wptArray && wptArray.length > 2) {
                        sourceMapData.searches[0].directions.route[rteWptIndex].coords =
                            {"lat": wptArray[1], "lng": wptArray[2]}
                    }
                }

                switch($(".dirBtnSelected")[0].classList[0]) {
                    case "dirBtnDrive":
                        sourceMapData.searches[0].directions.mode = "car";
                        break;
                    case "dirBtnTransit":
                        sourceMapData.searches[0].directions.mode = "transit";
                        break;
                    case "dirBtnWalk":
                        sourceMapData.searches[0].directions.mode = "foot";
                        break;
                }
            }

            resolve(sourceMapData);
        }
});



extractors.push({
    host: "openstreetmap.",
    extract:
        function(resolve) {
            var sourceMapData = {}
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

                sourceMapData.searches =
                [
                    {
                        directions:
                        {
                            route:
                            [
                                { address: $("#route_from").val() },
                                { address: $("#route_to").val() }
                            ]
                        }
                    }
                ]

                re = /route=([-0-9.]+)%2C([-0-9.]+)%3B([-0-9.]+)%2C([-0-9.]+)/;
                var routeCoordsArray = window.location.search.match(re);
                if (routeCoordsArray && routeCoordsArray.length > 4) {
                    sourceMapData.searches[0].directions.route[0].coords =
                        { "lat": routeCoordsArray[1],
                        "lng": routeCoordsArray[2] }
                    sourceMapData.searches[0].directions.route[1].coords =
                        { "lat": routeCoordsArray[3],
                        "lng": routeCoordsArray[4] }
                }

                re = /engine=[a-zA-Z]+_([a-z]+)/;
                var modeArray = window.location.search.match(re);
                if (modeArray && modeArray.length > 1) {
                    switch (modeArray[1]) {
                        case "bicycle":
                            sourceMapData.searches[0].directions.mode = "bike";
                            break;
                        case "car":
                            sourceMapData.searches[0].directions.mode = "car";
                            break;
                        case "foot":
                            sourceMapData.searches[0].directions.mode = "foot";
                            break;
                    }
                }
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "tools.wmflabs.org",
    extract:
        function(resolve) {
            var sourceMapData = {}
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
            sourceMapData.locationDescr = "primary page coordinates";
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "geocaching.",
    extract:
        function(resolve) {
            if (window.location.pathname.indexOf("/map/") === 0) {
                var sourceMapData = {}
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
                resolve(sourceMapData);
            }
            else if (window.location.pathname.indexOf("/geocache/") === 0) {
                var dmLatLng = document.getElementById("uxLatLon").innerText
                var re = /([NS])\s+([0-9]+)[^0-9]\s+([0-9.]+)\s+([EW])\s+([0-9]+)[^0-9]\s+([0-9.]+)/;
                var dmCoordArray = dmLatLng.match(re);
                if (dmCoordArray && dmCoordArray.length > 6) {
                    var lat = parseInt(dmCoordArray[2]) + (dmCoordArray[3] / 60);
                    var lng = parseInt(dmCoordArray[5]) + (dmCoordArray[6] / 60);
                    if ('S' == dmCoordArray[1]) {
                        lat = -lat;
                    }
                    if ('W' == dmCoordArray[4]) {
                        lng = -lng;
                    }
                    resolve({
                        centreCoords: {"lat": lat, "lng": lng},
                        resolution: calculateResolutionFromStdZoom(15, lat),
                        locationDescr: "primary geocache coordinates"
                    });
                }
            }
        }
});



extractors.push({
    host: "wikimapia.org",
    extract:
        function(resolve) {
            var sourceMapData = {}
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
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "waze.com",
    extract:
        function(resolve) {
            var sourceMapData = {}
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

                sourceMapData.searches =
                [
                    {
                        directions:
                        {
                            route:
                            [
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
                ]
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "openseamap.",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var centrePermalink = ($("#OpenLayers_Control_Permalink_13 a").attr("href"));
            var re = /lat=([-0-9.]+)&lon=([-0-9.]+)/;
            var coordArray = centrePermalink.match(re);
            if (coordArray && coordArray.length > 2) {
                sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
            }
            re = /zoom=([0-9]+)/;
            var zoomArray = centrePermalink.match(re);
            if (zoomArray && zoomArray.length > 1) {
                sourceMapData.resolution = calculateResolutionFromStdZoom(
                        zoomArray[1], sourceMapData.centreCoords.lat);
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "wego.here.com",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var re = /map=([-0-9.]+),([-0-9.]+),([0-9]+),/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length > 3) {
                sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
                sourceMapData.resolution = calculateResolutionFromStdZoom(
                        coordArray[3], sourceMapData.centreCoords.lat);
            }

            //check if pathname contains directions
            var state = -1;
            for (var dirnPart of window.location.pathname.split('/')) {
                if (state < 0) {
                    if (dirnPart == "directions") {
                        var smdDirs = {}
                        state = 0;
                    }
                } else if (0 === state) {
                    switch (dirnPart) {
                        case "mix":
                            break;
                        case "walk":
                            smdDirs.mode = "foot";
                            break;
                        case "bicycle":
                            smdDirs.mode = "bike";
                            break;
                        case "drive":
                            smdDirs.mode = "car";
                            break;
                        case "publicTransport":
                            smdDirs.mode = "transit";
                            break;
                    }
                    state = 1;
                    smdDirs.route = new Array();
                } else if (0 < state) {
                    var wptObj = undefined;
                    var re = /^([^:]+):/;
                    var addrArray = dirnPart.match(re);
                    if (addrArray && addrArray.length > 1) {
                        var addr = addrArray[1].replace(/-/g , " ");
                        wptObj = { address: addr }

                        re = /:loc-([^:]+)/;
                        var dirArray = dirnPart.match(re);
                        if (dirArray && dirArray.length > 1) {
                            var locnFromB64 = atob(dirArray[1]);
                            re = /lat=([-0-9.]+);lon=([-0-9.]+)/;
                            var coordsArr = locnFromB64.match(re);
                            if (coordsArr.length > 2) {
                                wptObj.coords =
                                    { lat: coordsArr[1], lng: coordsArr[2] }
                            }
                        }
                        re = /:([-0-9.]+),([-0-9.]+)/;
                        var coordsArray = dirnPart.match(re);
                        if (coordsArray && coordsArray.length > 2) {
                            wptObj.coords =
                                { lat: coordsArray[1], lng: coordsArray[2] }
                        }
                    }
                    smdDirs.route.push(wptObj);
                }
            }
            if (smdDirs && smdDirs.route) {
                for (wptIndex in smdDirs.route) {
                    //URL can contain empty waypoints, when locations have not yet been entered
                    //into the search box. So we need to do a bit of clean-up.
                    if (undefined == smdDirs.route[wptIndex]) {
                        smdDirs.route.splice(wptIndex, 1);
                    }
                }
                //if directions don't contain at least two points, they are considered invalid
                if (smdDirs.route.length >= 2) {
                    var directions = smdDirs;
                    sourceMapData.searches = [ { directions } ]
                }
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "streetmap.co.uk",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var urlToShare = $("#LinkToInput")[0].innerHTML;
            var re = /X=([0-9]+)&amp;Y=([0-9]+)/;
            var osCoordArray = urlToShare.match(re);
            if (osCoordArray && osCoordArray.length > 2) {
                sourceMapData.osgbCentreCoords = {"e": osCoordArray[1], "n": osCoordArray[2]}
            }
            re = /Z=([0-9]+)/;
            var zoomArray = urlToShare.match(re);
            if (zoomArray && zoomArray.length > 1) {
                var scale = 50000;
                switch (zoomArray[1]) {
                    case "106":
                        scale = 2500;
                        break;
                    case "110":
                        scale = 5000;
                        break;
                    case "115":
                        scale = 25000;
                        break;
                    case "120":
                        scale = 50000;
                        break;
                    case "126":
                        scale = 100000;
                        break;
                    case "130":
                        scale = 200000;
                        break;
                    case "140":
                        scale = 500000;
                        break;
                    case "150":
                        scale = 1000000;
                        break;
                }
                sourceMapData.resolution = calculateResolutionFromScale(scale);
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "map.what3words.com",
    extract:
        function(resolve, reject) {
            var sourceMapData = {}
            $(".display").each(function() {
                $(this).click();
                $("#word-view .share").each(function() {
                    $(this).click();
                    var gpsElem = document.getElementsByClassName("gps")[0];
                    //We have to remove the href to prevent the click following the link.
                    //(I think normally jquery would have prevented this, but we can't use jquery here.)
                    gpsElem.removeAttribute("href");
                    gpsElem.dispatchEvent(new MouseEvent("click"));

                    var waitForElemByClass = function(name, onSuccess, repeats, calls) {
                        if (calls == undefined) calls = 0;
                        var elem = document.getElementsByClassName(name)[0];
                        if (elem) { onSuccess(elem); }
                        else if (calls++ < repeats) {
                            setTimeout(function()
                                {waitForElemByClass(name, onSuccess, repeats, calls)}, 20 * calls);
                        }
                    }

                    waitForElemByClass("coords", function(coordsElem) {
                        var coords = coordsElem.getAttribute("value");
                        document.getElementById("popup-container").dispatchEvent(new MouseEvent("click"));
                        document.getElementsByClassName("close")[0].dispatchEvent(new MouseEvent("click"));
                        var re = /([-0-9.]+),[ ]+([-0-9.]+)/;
                        var coordArray = coords.match(re);
                        if (coordArray && coordArray.length > 2) {
                            sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
                            sourceMapData.resolution = calculateResolutionFromStdZoom(
                                16, sourceMapData.centreCoords.lat);
                            sourceMapData.locationDescr = "current map centre";
                            resolve(sourceMapData);
                        }
                        gpsElem.setAttribute("href", "/");
                    }, 30);
                });
            });
            //FIXME need to reject on failure cases
        }
});



extractors.push({
    host: "maps.stamen.com",
    extract:
        function(resolve, reject) {
            var re = /#[a-zA-Z]*\/?([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/;
            var coordArray = window.location.hash.match(re);
            if (coordArray && coordArray.length > 3) {
                resolve({
                    centreCoords: {"lat": coordArray[2], "lng": coordArray[3]},
                    resolution: calculateResolutionFromStdZoom(coordArray[1], coordArray[2])
                });
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "open.mapquest.com",
    extract:
        function(resolve, reject) {
            var re = /center=([-0-9.]+),([-0-9.]+)&zoom=([0-9]+)/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length > 3) {
                resolve({
                    centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                    resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
                    nonUpdating: window.location.hostname,
                    locationDescr: "non-updating URL"
                });
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "www.gpxeditor.co.uk",
    extract:
        function(resolve, reject) {
            var re = /location=([-0-9.]+),([-0-9.]+)&zoom=([0-9]+)/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length > 3) {
                resolve({
                    centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                    resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
                    nonUpdating: window.location.hostname,
                    locationDescr: "non-updating URL"
                });
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "wma.wmflabs.org",
    extract:
        function(resolve, reject) {
            var re = /\?(?:wma=)?([-0-9.]+)_([-0-9.]+)_[0-9]+_[0-9]+_[a-z]{0,3}_([0-9]+)/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length > 3) {
                resolve({
                    centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                    resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
                    nonUpdating: window.location.hostname,
                    locationDescr: "non-updating URL"
                });
            } else {
                reject();
            }
        }
});



extractors.push({
    host: ".topozone.com",
    extract:
        function(resolve, reject) {
            var re = /lat=([-0-9.]+)&lon=([-0-9.]+)/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length > 2) {
                var sourceMapData = {
                    centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                    nonUpdating: window.location.hostname,
                    locationDescr: "non-updating URL"
                }
                var zoomRe = /zoom=([0-9]+)/;
                var zoomArray = window.location.search.match(zoomRe);
                if (zoomArray && zoomArray.length > 1) {
                    sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[1]);
                }
                resolve(sourceMapData);
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "suncalc.net",
    extract:
        function(resolve, reject) {
            var re = /#\/([-0-9.]+),([-0-9.]+),([0-9]+)/;
            var coordArray = window.location.hash.match(re);
            if (coordArray && coordArray.length >= 3) {
                resolve({
                    centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                    resolution: calculateResolutionFromStdZoom(coordArray[3], coordArray[1]),
                    locationDescr: "current pin location"
                });
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "sysmaps.co.uk",
    extract:
        function(resolve) {
            var sourceMapData = {}
            if (window.location.pathname.indexOf("/sysmaps_os.html") === 0) {
                $(".style1").each(function() {
                    var re = /Map Centre: East: ([0-9.]+) : North: ([0-9.]+)/;
                    var mapCentreArr = this.innerText.match(re);
                    if (mapCentreArr && mapCentreArr.length > 2) {
                        sourceMapData.osgbCentreCoords = {"e": mapCentreArr[1], "n": mapCentreArr[2]}
                        sourceMapData.locationDescr = "map centre";
                        return false; //just to break out of jquery each loop
                    }
                });
                if (!sourceMapData.osgbCentreCoords) {
                    $(".style1").each(function() {
                        var re = /Click Marker Position: East: ([0-9.]+) : North: ([0-9.]+)/;
                        var mapCentreArr = this.innerText.match(re);
                        if (mapCentreArr && mapCentreArr.length > 2) {
                            sourceMapData.osgbCentreCoords = {"e": mapCentreArr[1], "n": mapCentreArr[2]}
                            sourceMapData.locationDescr = "initial marker position";
                            return false; //just to break out of jquery each loop
                        }
                    });
                }
            }
            else if (window.location.pathname.indexOf("/sysmaps_ign.html") === 0) {
                $(".style1").each(function() {
                    var re = /Centre Position: Long: ([0-9.]+)E : Lat: ([0-9.]+)N/;
                    var mapCentreArr = this.innerText.match(re);
                    if (mapCentreArr && mapCentreArr.length > 2) {
                        sourceMapData.centreCoords = {"lat": mapCentreArr[2], "lng": mapCentreArr[1]}
                        sourceMapData.locationDescr = "map centre";
                        return false; //just to break out of jquery each loop
                    }
                });
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "wikipedia.org",
    extract:
        function(resolve) {
            var sourceMapData = {}
            //FIXME can we just use the #coordinates .external block below for EN too, in future?
            // - but we would also need to handle things like params=38_45_S_72_40_W (for Temuco)
            if ($("#coordinates .geo").length) {
                $("#coordinates .geo").first().each(function() {
                    var coordArray = this.innerText.split(';');
                    if (coordArray.length === 2) {
                        sourceMapData.centreCoords = {"lat": coordArray[0].trim(), "lng": coordArray[1].trim()}
                        sourceMapData.locationDescr = "primary article coordinates";
                    }
                });
            }
            if (!("centreCoords" in sourceMapData)) {
                $("#coordinates .external").first().each(function() {
                    var href = $(this).attr("href");
                    var re = /params=([-0-9.]+)_([NS])_([-0-9.]+)_([EW])/;
                    var coordArray = href.match(re);
                    if (coordArray && coordArray.length > 4) {
                        var lat = coordArray[2] == 'N' ? coordArray[1] : (-coordArray[1]);
                        var lng = coordArray[4] == 'E' ? coordArray[3] : (-coordArray[3]);
                        sourceMapData.centreCoords = {"lat": lat, "lng": lng}
                    }
                });
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "opencyclemap.org",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var href = $("#permalink").attr("href");
            var re = /zoom=([0-9]+)&lat=([-0-9.]+)&lon=([-0-9.]+)/
            var dataArray = href.match(re);
            if (dataArray && dataArray.length > 3) {
                sourceMapData.centreCoords = {"lat": dataArray[2], "lng": dataArray[3]}
                sourceMapData.resolution =
                    calculateResolutionFromStdZoom(dataArray[1], dataArray[2]);
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "facebook.com",
    extract:
        function(resolve) {
            var sourceMapData = {}

            ///// Generic map image (relying on the obfuscated class name continuing to be used) /////
            var mapImages = $("._a3f.img");
            if (mapImages.length > 0) {
                if (mapImages[0].currentSrc) {
                    var re = /zoom=([0-9]+)&markers=([-0-9.]+)%2C([-0-9.]+)/;
                    for (var imgEl of mapImages) {
                        var matchArr = imgEl.currentSrc.match(re);
                        if (matchArr && matchArr.length > 3) {
                            sourceMapData.centreCoords = {"lat": matchArr[2], "lng": matchArr[3]}
                            sourceMapData.resolution =
                                calculateResolutionFromStdZoom(matchArr[1], matchArr[2]);
                            break;
                        }
                    }
                }
            }
            ///// Events /////
            else if (window.location.pathname.indexOf("/events/") === 0) {
                var eventMapImages = $(".fbPlaceFlyoutWrap img");
                if (eventMapImages.length > 0) {
                    var re = /center=([-0-9.]+)%2C([-0-9.]+)&zoom=([0-9]+)/;
                    for (var imgEl of eventMapImages) {
                        var matchArr = imgEl.currentSrc.match(re);
                        //we expect there to be more than one image; we assume that only one will contain
                        //coords (i.e. the map thumbnail), so use the first such one we find
                        if (matchArr && matchArr.length > 3) {
                            sourceMapData.centreCoords = {"lat": matchArr[1], "lng": matchArr[2]}
                            sourceMapData.resolution =
                                calculateResolutionFromStdZoom(matchArr[3], matchArr[1]);
                            break;
                        }
                    }
                }
            }
            else {
                ///// Pages /////
                var pageSidebarImages = $("#pages_side_column img");
                if (pageSidebarImages.length > 0) {
                    var re = /zoom=([0-9]+)&markers=([-0-9.]+)%2C([-0-9.]+)/;
                    for (var imgEl of pageSidebarImages) {
                        var matchArr = imgEl.currentSrc.match(re);
                        if (matchArr && matchArr.length > 3) {
                            sourceMapData.centreCoords = {"lat": matchArr[2], "lng": matchArr[3]}
                            sourceMapData.resolution =
                                calculateResolutionFromStdZoom(matchArr[1], matchArr[2]);
                            break;
                        }
                    }
                }
            }

            resolve(sourceMapData);
        }
});



extractors.push({
    host: "yandex.com",
    extract:
        function(resolve) {
            var re = /ll=([-0-9.]+)%2C([-0-9.]+)/;
            var coordArray = window.location.search.match(re);
            if (coordArray && coordArray.length > 2) {
                var sourceMapData = {
                    centreCoords: {"lat": coordArray[2], "lng": coordArray[1]},
                    locationDescr: "map centre specified in URL"
                }
                var zoomRe = /z=([0-9]+)/;
                var zoomArray = window.location.search.match(zoomRe);
                if (zoomArray && zoomArray.length > 1) {
                    sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[2]);
                }
                resolve(sourceMapData);
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "caltopo.com",
    extract:
        function(resolve) {
            var re = /ll=([-0-9.]+),([-0-9.]+)/;
            var coordArray = window.location.hash.match(re);
            if (coordArray && coordArray.length > 2) {
                var sourceMapData = {
                    centreCoords: {"lat": coordArray[1], "lng": coordArray[2]},
                    locationDescr: "map centre specified in URL"
                }
                var zoomRe = /z=([0-9]+)/;
                var zoomArray = window.location.hash.match(zoomRe);
                if (zoomArray && zoomArray.length > 1) {
                    sourceMapData.resolution = calculateResolutionFromStdZoom(zoomArray[1], coordArray[1]);
                }
                resolve(sourceMapData);
            } else {
                reject();
            }
        }
});



extractors.push({
    host: "labs.strava.com",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var re = /\#([0-9]+)\/([-0-9.]+)\/([-0-9.]+)/;
            var coordArray = window.location.hash.match(re);
            if (coordArray && coordArray.length > 3) {
                sourceMapData.centreCoords = {"lat": coordArray[3], "lng": coordArray[2]}
                sourceMapData.resolution =
                    calculateResolutionFromStdZoom(coordArray[1], coordArray[3]);
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "peakbagger.com",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var re = /cy=([-0-9.]+)&cx=([-0-9.]+)&z=([0-9]+)/;
            var coordArray = $("#Gmap").attr("src").match(re);
            if (coordArray && coordArray.length > 3) {
                sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
                sourceMapData.resolution =
                    calculateResolutionFromStdZoom(coordArray[3], coordArray[1]);
            }
            resolve(sourceMapData);
        }
});



extractors.push({
    host: "summitpost.org",
    extract:
        function(resolve) {
            var sourceMapData = {}
            var databoxLatlng = $("#main_data_box a[rel='noindex']").first();
            var re = /distance_lat_[0-9]+=([-0-9.]+)&distance_lon_[0-9]+=([-0-9.]+)/;
            var coordArray = $(databoxLatlng).attr("href").match(re);
            if (coordArray && coordArray.length > 2) {
                sourceMapData.centreCoords = {"lat": coordArray[1], "lng": coordArray[2]}
            }
            resolve(sourceMapData);
        }
});



var runDataExtraction = function () {
    //default null extractor
    var extractor = {
        extract: resolve => { resolve(null); }
    };
    //we iterate through our extractors to find a matching host
    for (extr of extractors) {
        if (window.location.hostname.indexOf(extr.host) >= 0) {
            var extractor = extr;
            break;
        }
    }
    //execute the extraction and send the result to the main script
    new Promise(extractor.extract).then(function(sourceMapData) {
        browser.runtime.sendMessage({sourceMapData: sourceMapData});
    }).catch(function(result) {
        //if an extractor fails, just send a null message to the main script to indicate failure
        browser.runtime.sendMessage({});
    });
}

runDataExtraction();
