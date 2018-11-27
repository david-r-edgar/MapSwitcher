/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if ("undefined" === typeof browser) {
    browser = chrome;
}



var OutputMaps = {

/** Enumeration of the type of map service */
    category: {
        multidirns: 2,
        singledirns: 1,
        plain: 0,
        utility: 3,
        download: 4
    }

}

/**
 * Array of all output map services
 *
 * The most important item for each service is the `generate()` function which accepts
 * as input an object containing the data from the source map, plus a view object
 * (representing the extension popup). Each service uses the source map data to
 * generate appropriate links, and calls the relevant functions on the view object
 * to render those links to the view.
 */
OutputMaps.services = [
{
    site: "Google",
    prio: 1,
    image: "googleMapsLogo16x16.png",
    id: "google",
    cat: OutputMaps.category.multidirns,
    maplinks:
    {
        googlemaps: {
            name: "Maps"
        },
        googleterrain: {
            name: "Terrain"
        },
        googleearth: {
            name: "Earth"
        },
        googletraffic: {
            name: "Traffic"
        },
        googlebike: {
            name: "Cycling"
        }
    },
    generate: function(sourceMapData, view) {
        var googleBase = "https://www.google.com/maps/";
        var directions = "";
        var mapCentre = "@" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng + ",";
        var zoom = "13z";
        var dataWpts = "";
        var dataDirnOptions = "";

        if ("directions" in sourceMapData && "route" in sourceMapData.directions) {
            directions = "dir/";

            for (rteWpt of sourceMapData.directions.route) {
                if ("address" in rteWpt) {
                    //if address specified, add to directions
                    directions += rteWpt.address + "/";

                    if ("coords" in rteWpt) {
                        //if coord also specified, add to data
                        dataWpts += "!1m5!1m1!1s0x0:0x0!2m2!1d" +
                            rteWpt.coords.lng + "!2d" + rteWpt.coords.lat;
                    } else {
                        dataWpts += "!1m0";
                    }

                } else if ("coords" in rteWpt) {
                    //else if coord specified, add to directions
                    directions += rteWpt.coords.lat + "," + rteWpt.coords.lng + "/";
                    dataWpts += "!1m0";
                }
            }

            var mode = "";
            if (sourceMapData.directions.mode) {
                switch (sourceMapData.directions.mode) {
                    case "foot":
                        mode = "!3e2";
                        break;
                    case "bike":
                        mode = "!3e1";
                        break;
                    case "car":
                        mode = "!3e0";
                        break;
                    case "transit":
                        mode = "!3e3";
                        break;
                }
            }


            var dataDirnOptions = dataWpts + mode;

            //add elements identifying directions, with counts of all following sub-elements
            var exclMarkCount = (dataDirnOptions.match(/!/g) || []).length;
            dataDirnOptions = "!4m" + (exclMarkCount + 1) + "!4m" + exclMarkCount + dataDirnOptions;
        }

        if ("resolution" in sourceMapData) {
            //google minimum zoom is 3
            zoom = calculateStdZoomFromResolution(
                sourceMapData.resolution, sourceMapData.centreCoords.lat, 3) + "z";
        }

        this.maplinks.googlemaps["link"] = googleBase + directions + mapCentre + zoom + "/data=" + dataDirnOptions;
        this.maplinks.googleterrain["link"] = googleBase + directions + mapCentre + zoom + "/data=" + dataDirnOptions + "!5m1!1e4";
        this.maplinks.googleearth["link"] = googleBase + directions + mapCentre + zoom + "/data=!3m1!1e3" + dataDirnOptions;
        this.maplinks.googletraffic["link"] = googleBase + directions + mapCentre + zoom + "/data=" + dataDirnOptions + "!5m1!1e1";
        this.maplinks.googlebike["link"] = googleBase + directions + mapCentre + zoom + "/data=" + dataDirnOptions + "!5m1!1e3";

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinks);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "Bing",
    prio: 2,
    image: "bingLogo16x16.png",
    id: "bing",
    cat: OutputMaps.category.multidirns,
    maplinks:
    {
        bingroad: {
            name: "Road"
        },
        bingaerial: {
            name: "Aerial"
        },
        bingbirdseye: {
            name: "Bird's eye"
        }
    },
    generate: function(sourceMapData, view) {
        var bingBase = "https://www.bing.com/maps/?";
        var directions = "";
        var mapCentre = "cp=" + sourceMapData.centreCoords.lat + "~" +
                                sourceMapData.centreCoords.lng;
        var zoom = "&lvl=10";

        if ("resolution" in sourceMapData) {
            //3 <= zoom <=20
            zoom = "&lvl=" + calculateStdZoomFromResolution(
                                sourceMapData.resolution,
                                sourceMapData.centreCoords.lat,
                                3, 20);
        }

        if ("directions" in sourceMapData &&
                "route" in sourceMapData.directions) {
            directions = "rtp=";
            for (rteWpt of sourceMapData.directions.route) {
                if ("coords" in rteWpt) {
                    directions += "pos." + rteWpt.coords.lat + "_" + rteWpt.coords.lng;
                    if ("address" in rteWpt) {
                        directions += "_" + rteWpt.address;
                    }
                    directions += "~";
                } else if ("address" in rteWpt) {
                    directions += "adr." + rteWpt.address + "~";
                }
            }

            var mode = "";
            if (sourceMapData.directions.mode) {
                switch (sourceMapData.directions.mode) {
                    case "foot":
                        mode = "&mode=w";
                        break;
                    case "car":
                        mode = "&mode=d";
                        break;
                    case "transit":
                        mode = "&mode=t";
                        break;
                }
            }

            directions += mode;
        }

        this.maplinks.bingroad["link"] =
            bingBase + directions + "&" + mapCentre + zoom;
        this.maplinks.bingaerial["link"] =
            bingBase + directions + "&" + mapCentre + zoom + "&sty=h";
        this.maplinks.bingbirdseye["link"] =
            bingBase + directions + "&" + mapCentre + zoom + "&sty=b";

        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            this.maplinks.bingos = {name: "Ordnance Survey",
                link: (bingBase + directions + "&" + mapCentre + zoom + "&sty=s")}
        }
        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinks);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "OpenStreetMap",
    prio: 3,
    image: "osmLogo16x16.png",
    id: "osm",
    cat: OutputMaps.category.singledirns,
    note: "",
    maplinks:
    {
        osmStandard: "Standard",
        osmCycle: "Cycle Map",
        osmTransport: "Transport",
        osmHumanitarian: "Humanitarian"
    },
    maplinks:
    {
        osmStandard: {
            name: "Standard"
        },
        osmCycle: {
            name: "Cycle Map"
        },
        osmTransport: {
            name: "Transport"
        },
        osmHumanitarian: {
            name: "Humanitarian"
        },
    },
    generate: function(sourceMapData, view) {
        var osmBase = "https://www.openstreetmap.org/";
        var zoom = "12/";
        var mapCentre = sourceMapData.centreCoords.lat + "/" + sourceMapData.centreCoords.lng;
        var directions = "";

        if ("resolution" in sourceMapData) {
            //osm max zoom 19
            zoom = calculateStdZoomFromResolution(
                sourceMapData.resolution, sourceMapData.centreCoords.lat, 0, 19) + "/";
        }

        if (sourceMapData.directions &&
                "route" in sourceMapData.directions) {

            var mode = "";
            if (sourceMapData.directions.mode) {
                switch (sourceMapData.directions.mode) {
                    case "foot":
                        mode = "engine=mapzen_foot&";
                        break;
                    case "car":
                        mode = "engine=osrm_car&";
                        break;
                    case "bike":
                        mode = "engine=graphhopper_bicycle&";
                        break;
                }
            }

            //OSM appears to only handle single-segment routes.
            //So we choose to use the first and last point of the route from the source map.

            var firstElem = sourceMapData.directions.route[0];
            var lastElem = sourceMapData.directions.route[
                                sourceMapData.directions.route.length - 1];

            if ("coords" in firstElem && "coords" in lastElem) {
               directions = "directions?" + mode + "route=" +
                    firstElem.coords.lat + "," + firstElem.coords.lng + ";" +
                    lastElem.coords.lat + "," + lastElem.coords.lng;
            } else {
                this.note = "OSM directions unavailable because waypoints are not "
                            + "all specified as coordinates.";
            }
        }

        var coreLink = osmBase + directions + "#map=" + zoom + mapCentre;

        this.maplinks.osmStandard["link"] = coreLink;
        this.maplinks.osmCycle["link"] = coreLink + "&layers=C";
        this.maplinks.osmTransport["link"] = coreLink + "&layers=T";
        this.maplinks.osmHumanitarian["link"] = coreLink + "&layers=H";

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.singledirns, this, this.maplinks, this.note);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks, this.note);
        }
    }
},
{
    site: "Wikimedia Labs",
    image: "wmLabsLogo16x16.png",
    id: "wmLabs",
    cat: OutputMaps.category.utility,
    prio: 4,
    maplinks:
    {
        wmGeoHack: {
            name: "GeoHack"
        },
        wikiminiatlas: {
            name: "Wiki Mini Atlas"
        }
    },
    generate: function(sourceMapData, view) {
        var geohackBase = "https://tools.wmflabs.org/geohack/geohack.php?params=";
        var mapCentre = sourceMapData.centreCoords.lat + "_N_" + sourceMapData.centreCoords.lng + "_E";
        var region = (sourceMapData.countryCode.length > 0) ?
                        "_region:" + sourceMapData.countryCode : "";

        var scale = calculateScaleFromResolution(sourceMapData.resolution);
        this.maplinks.wmGeoHack["link"] = geohackBase + mapCentre + region + "_scale:" + scale;

        var wikiminiatlasBase = "https://wma.wmflabs.org/iframe.html?";
        mapCentre = sourceMapData.centreCoords.lat + "_" + sourceMapData.centreCoords.lng;
        //FIXME this is an approximation of zoom - it's not completely accurate
        zoom = calculateStdZoomFromResolution(
                sourceMapData.resolution, sourceMapData.centreCoords.lat, 4, 16) - 1;
        this.maplinks.wikiminiatlas["link"] = wikiminiatlasBase + mapCentre + "_0_0_en_" + zoom + "_englobe=Earth";

        view.addMapServiceLinks(OutputMaps.category.utility, this, this.maplinks);
    }
},
{
    site: "Wikimapia",
    image: "wikimapiaLogo16x16.png",
    id: "wikimapia",
    prio: 10,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        wikimapiaMap: {
            name: "Maps"
        }
    },
    generate: function(sourceMapData, view) {
        var wikimapiaBase = "http://wikimapia.org/#lang=en&";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "z=12";

        if ("resolution" in sourceMapData) {
            zoom = "z=" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }

        this.maplinks.wikimapiaMap["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=w";

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
    }
},
{
    site: "Geocaching",
    image: "geocachingLogo16x16.png",
    id: "geocaching",
    note: "geocaching.com requires login to see the map (free sign-up)",
    cat: OutputMaps.category.plain,
    maplinks:
    {
        geocaching: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        var geocachingBase = "https://www.geocaching.com/map/#?";
        var mapCentre = "ll=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "z=14";

        if ("resolution" in sourceMapData) {
            zoom = "z=" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }
        this.maplinks.geocaching["link"] = geocachingBase + mapCentre + '&' + zoom;

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks, this.note);
    }
},
{
    site: "what3words",
    image: "w3wLogo.png",
    id: "w3w",
    cat: OutputMaps.category.plain,
    maplinks:
    {
        what3words: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        var w3wBase = "https://map.what3words.com/";
        var mapCentre = sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        this.maplinks.what3words["link"] = w3wBase + mapCentre;

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
    }
},
{
    site: "GPX",
    image: "gpxFile16x16.png",
    id: "dl_gpx",
    cat: OutputMaps.category.download,
    generate: function(sourceMapData, view) {
        view.addFileDownload(this, "gpx_map_centre", "Map centre waypoint", function() {
            var fileData = {
                name: "MapSwitcher.gpx",
                type: "text/xml;charset=utf-8",
                content:
                "<?xml version=\"1.1\"?>\n" +
                "<gpx creator=\"MapSwitcher\" version=\"1.1\" xmlns=\"http://www.topografix.com/GPX/1/1\">\n" +
                    "\t<author>MapSwitcher</author>\n" +
                    "\t<wpt lat=\"" + sourceMapData.centreCoords.lat +
                        "\" lon=\"" + sourceMapData.centreCoords.lng + "\">\n" +
                        "\t\t<name>Centre of map</name>\n" +
                        "\t\t<desc>" + sourceMapData.centreCoords.lat + ", " + sourceMapData.centreCoords.lng + "</desc>\n" +
                    "\t</wpt>\n" +
                "</gpx>\n"
            }
            return fileData;
        });
        if ("directions" in sourceMapData && "route" in sourceMapData.directions) {

            var firstPoint = sourceMapData.directions.route[0];
            var lastPoint = sourceMapData.directions.route[sourceMapData.directions.route.length - 1];

            var routePoints = "";
            var pointsWithCoords = 0;
            for (rteIndex in sourceMapData.directions.route) {
                var rteWpt = sourceMapData.directions.route[rteIndex];
                if ("coords" in rteWpt) {
                    routePoints +=
                        "\t\t<rtept lat=\"" + rteWpt.coords.lat + "\" lon=\"" + rteWpt.coords.lng + "\">\n" +
                        "\t\t\t<name>" + rteWpt + "</name>\n" +
                        "\t\t</rtept>\n";
                    pointsWithCoords++;
                }
            }
            //only provide a gpx route download if all the points in the route have coordinates
            if (pointsWithCoords === sourceMapData.directions.route.length) {
                view.addFileDownload(this, "gpx_rte", "Route", function() {

                    var fileData = {
                        name: "MapSwitcherRoute.gpx",
                        type:"text/xml;charset=utf-8",
                        content:
                        "<?xml version=\"1.1\"?>\n" +
                        "<gpx creator=\"MapSwitcher\" version=\"1.1\" xmlns=\"http://www.topografix.com/GPX/1/1\">\n" +
                            "\t<author>MapSwitcher</author>\n" +
                            "\t<rte>\n" +
                                "\t\t<name>Map Switcher Route</name>\n" +
                                "\t\t<desc>From " + firstPoint.coords.lat + ", " + firstPoint.coords.lng + " to " +
                                    lastPoint.coords.lat + ", " + lastPoint.coords.lng + "</desc>\n" +
                                routePoints +
                                "\t</rte>\n" +
                        "</gpx>\n"
                    }
                    return fileData;
                });
            }
            else {
                view.addNote(this, "GPX directions unavailable because waypoints are not "
                                   + "all specified as coordinates.");
            }
        }
    }
},
{
    site: "Waze",
    image: "wazeLogo16x16.png",
    id: "waze",
    prio: 6,
    cat: OutputMaps.category.singledirns,
    maplinks:
    {
        livemap: {
            name: "Livemap"
        }
    },
    generate: function(sourceMapData, view) {
        var wazeBase = "https://www.waze.com/livemap?";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "zoom=12";
        var directions = "";

        if ("resolution" in sourceMapData) {
            zoom = "zoom=" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }

        if ("directions" in sourceMapData &&
                "route" in sourceMapData.directions) {

            //Waze appears to only handle single-segment routes.
            //So we choose to use the first and last point of the route from the source map.

            var firstElem = sourceMapData.directions.route[0];
            var lastElem = sourceMapData.directions.route[
                                sourceMapData.directions.route.length - 1];

            if ("coords" in firstElem && "coords" in lastElem) {
                directions +=
                    "&from_lat=" + firstElem.coords.lat +
                    "&from_lon=" + firstElem.coords.lng +
                    "&to_lat=" + lastElem.coords.lat +
                    "&to_lon=" + lastElem.coords.lng +
                    "&at_req=0&at_text=Now";
            } else {
                this.note = "Waze directions unavailable because waypoints are not "
                            + "all specified as coordinates.";
            }
        }

        this.maplinks.livemap["link"] = wazeBase + zoom + '&' + mapCentre + directions;

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.singledirns, this, this.maplinks, this.note);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks, this.note);
        }
    }
},
{
    site: "OpenSeaMap",
    image: "openSeaMapLogo16x16.png",
    id: "openseamap_map",
    prio: 7,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        openSeaMap: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        var openSeaMapBase = "http://map.openseamap.org/?";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "zoom=12";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
            if (zoom > 18) zoom = 18;
            zoom = "zoom=" + zoom;
        }

        var layers = "layers=BFTFFTTFFTF0FFFFFFFFFF";

        this.maplinks.openSeaMap["link"] = openSeaMapBase + zoom + '&' + mapCentre + '&' + layers;

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
    }
},
{
    site: "Stamen",
    image: "greyMarker.png",
    id: "stamen",
    cat: OutputMaps.category.plain,
    maplinks:
    {
        stamenWatercolor: {
            name: "Watercolor"
        },
        stamenToner: {
            name: "Toner"
        },
        stamenTerrain: {
            name: "Terrain"
        }
    },
    generate: function(sourceMapData, view) {
        var stamenBase = "http://maps.stamen.com/";
        var mapCentre = sourceMapData.centreCoords.lat + "/" + sourceMapData.centreCoords.lng;
        var zoom = "12";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
            if (zoom > 17) zoom = 17;
            zoom = "" + zoom;
        }

        this.maplinks.stamenWatercolor["link"] = stamenBase + "watercolor/#" + zoom + '/' + mapCentre;
        this.maplinks.stamenToner["link"] = stamenBase + "toner/#" + zoom + '/' + mapCentre;
        this.maplinks.stamenTerrain["link"] = stamenBase + "terrain/#" + zoom + '/' + mapCentre;

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
    }
},
{
    site: "Here",
    image: "hereLogo16x16.png",
    id: "here",
    prio: 5,
    cat: OutputMaps.category.multidirns,
    maplinks:
    {
        hereMap: {
            name: "Map"
        },
        hereTerrain: {
            name: "Terrain"
        },
        hereSatellite: {
            name: "Satellite"
        },
        hereTraffic: {
            name: "Traffic"
        },
        herePublicTransport: {
            name: "Public Transport"
        }
    },
    generate: function(sourceMapData, view) {
        var hereBase = "https://wego.here.com/";
        var mapCentre = "?map=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "12";
        var directions = "";
        var note = "";

        if ("resolution" in sourceMapData) {
            zoom = "" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }

        if ("directions" in sourceMapData &&
                "route" in sourceMapData.directions) {

            var route = "";
            for (rteWpt of sourceMapData.directions.route) {
                route += "/";
                if ("address" in rteWpt) {
                    route += rteWpt.address;
                }
                if ("coords" in rteWpt) {
                    route += ":" + rteWpt.coords.lat + "," + rteWpt.coords.lng;
                }
            }

            var mode = "mix";
            if (sourceMapData.directions.mode) {
                switch (sourceMapData.directions.mode) {
                    case "foot":
                        mode = "walk";
                        break;
                    case "car":
                        mode = "drive";
                        break;
                    case "transit":
                        mode = "publicTransport";
                        break;
                    case "bike":
                        mode = "bicycle";
                }
            }

            directions = "directions/" + mode + route;

            if (sourceMapData.directions.route.length > 10) {
                note = "Here limited to 10 waypoints";
            }
        }

        this.maplinks.hereMap["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "normal";
        this.maplinks.hereTerrain["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "terrain";
        this.maplinks.hereSatellite["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "satellite";
        this.maplinks.hereTraffic["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "traffic";
        this.maplinks.herePublicTransport["link"] = hereBase + directions + mapCentre + ',' + zoom + ',' + "public_transport";

        if (directions.length > 0) {
            view.addMapServiceLinks(OutputMaps.category.multidirns, this, this.maplinks, note);
        } else {
            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "Streetmap",
    image: "streetmapLogo16x16.png",
    id: "streetmap",
    prio: 11,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        streetmap: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            var streetmapMapBase = "http://www.streetmap.co.uk/map.srf?";

            var ll = new LatLon(sourceMapData.centreCoords.lat, sourceMapData.centreCoords.lng);
            var osLL = CoordTransform.convertWGS84toOSGB36(ll);
            var osGR = OsGridRef.latLongToOsGrid(osLL);
            var mapCentre = "X=" + osGR.easting + "&Y=" + osGR.northing;

            var zoom = 120;
            if ("resolution" in sourceMapData) {
                var scale = calculateScaleFromResolution(sourceMapData.resolution);
                if (scale < 4000) { zoom = 106; }
                else if (scale < 15000) { zoom = 110; }
                else if (scale < 40000) { zoom = 115; }
                else if (scale < 80000) { zoom = 120; }
                else if (scale < 160000) { zoom = 126; }
                else if (scale < 400000) { zoom = 130; }
                else if (scale < 900000) { zoom = 140; }
                else { zoom = 150; }
            }
            var zoomArg = "Z=" + zoom;

            this.maplinks.streetmap["link"] = streetmapMapBase + mapCentre + "&A=Y&" + zoomArg;

            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "GPX Editor",
    image: "gpxed16x16.png",
    id: "gpxeditor",
    cat: OutputMaps.category.plain,
    maplinks:
    {
        gpxedmap: {
            name: "Street Map"
        },
        gpxedsatellite: {
            name: "Satellite"
        },
        gpxedosm: {
            name: "OpenStreetMap"
        },
        gpxedocm: {
            name: "OpenCycleMap"
        },
    },
    generate: function(sourceMapData, view) {
        var gpxEditorBase = "http://www.gpxeditor.co.uk/?";
        var mapCentre = "location=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "zoom=12";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
            if (zoom < 1) zoom = 1;
            zoom = "zoom=" + zoom;
        }
        this.maplinks.gpxedmap["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=roadmap";
        this.maplinks.gpxedsatellite["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=satellite";
        this.maplinks.gpxedosm["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=OSM";
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            this.maplinks.gpxedos = {
                name: "Ordnance Survey",
                link: gpxEditorBase + mapCentre + '&' + zoom + "&mapType=OS"
            }
        }
        this.maplinks.gpxedocm["link"] = gpxEditorBase + mapCentre + '&' + zoom + "&mapType=OCM";

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks, this.note);
    }
},
{
    site: "NGI/IGN",
    image: "ngi_ign_Logo16x16.png",
    id: "ngi_ign",
    prio: 13,
    cat: OutputMaps.category.plain,
    maplinks: {},
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode !== "be") {
            return;
        }

        var ngiBase = "http://www.ngi.be/topomapviewer/public?";
        var that = this;

        //NGI uses the Lambert 2008 projection, grs80 ellipsoid
        //We use an external service to calculate coordinates from the regular WGS84 lat & long
        $.ajax({
            url: "http://loughrigg.org/wgs84Lambert/wgs84_lambert/"
                + sourceMapData.centreCoords.lat + "/" + sourceMapData.centreCoords.lng,
        })
        .done(function( data ) {
            var mapCentre = "mapcenter={\"x\":" +
                Math.round(data.easting) + ",\"y\":" + Math.round(data.northing) + "}";

            var level = 4;
            //we get an approximate zoom level from the resolution
            //(the values here were derived by manual inspection)
            if ("resolution" in sourceMapData) {
                if (sourceMapData.resolution > 1000) { level = 0; }
                else if (sourceMapData.resolution > 300) { level = 1; }
                else if (sourceMapData.resolution > 150) { level = 2; }
                else if (sourceMapData.resolution > 75) { level = 3; }
                else if (sourceMapData.resolution > 35) { level = 4; }
                else if (sourceMapData.resolution > 18) { level = 5; }
                else if (sourceMapData.resolution > 9) { level = 6; }
                else if (sourceMapData.resolution > 5) { level = 7; }
                else if (sourceMapData.resolution > 2) { level = 8; }
                else if (sourceMapData.resolution > 1) { level = 9; }
                else { level = 10; }
            }
            var levelArg = "level=" + level;

            var lang = "";
            //extract the highest priority language (fr or nl) from browser preferences
            browser.i18n.getAcceptLanguages(function (list) {
                for (listLang of list) {
                    if (listLang.match(/^fr/)) {
                        lang = "lang=fr&";
                        break;
                    } else if (listLang.match(/^nl/)) {
                        lang = "lang=nl&";
                        break;
                    }
                }

                var commonLink = ngiBase + lang + levelArg + "&" + mapCentre;

                var linkTopo = encodeURI(
                    commonLink + "&layers={\"autoMap\":true,\"baseMaps\":[[\"cartoweb_topo\",100]],\"aerialMaps\":[],\"overlayMaps\":[]}");

                //some of the resolutions of the classic maps don't work at particular zoom
                //levels - so we select an appropriate one based on the level
                if (level <= 4) {
                    classicName = "Top250";
                    classicURLcode = "TOPO250";
                } else if (level == 5) {
                    classicName = "Top100";
                    classicURLcode = "TOPO100";
                } else if (level <= 7) {
                    classicName = "Top50";
                    classicURLcode = "TOPO50";
                } else {
                    classicName = "Top10";
                    classicURLcode = "TOPO10";
                }

                var linkClassic = encodeURI(
                    commonLink + "&layers={\"autoMap\":true,\"baseMaps\":[[\"" + classicURLcode + "\",100]],\"aerialMaps\":[],\"overlayMaps\":[]}");
                var linkAerial = encodeURI(
                    commonLink + "&layers={\"autoMap\":true,\"baseMaps\":[[\"" + classicURLcode + "\",100]],\"aerialMaps\":[[\"ORTHO COLOR (2013-2015)\",100]],\"overlayMaps\":[]}");

                that.maplinks = {
                    topo: {
                        name: "Topo",
                        link: linkTopo
                    },
                    classic: {
                        name: classicName,
                        link: linkClassic
                    },
                    aerial: {
                        name: "Aerial",
                        link: linkAerial
                    }
                }

                this.note = "Due to NGI/IGN limitations, you should first go to " +
                            "http://www.ngi.be/topomapviewer and accept the " +
                            "conditions.\nThis should then work properly in future.";

                view.addMapServiceLinks(OutputMaps.category.plain, that, that.maplinks, this.note);
            });


        });
    }
},
{
    site: "SunCalc",
    image: "suncalc_org16x16.png",
    id: "suncalc",
    cat: OutputMaps.category.utility,
    maplinks:
    {
        suncalc: {
            name: "Sunrise + sunset times"
        }
    },
    generate: function(sourceMapData, view) {
        var suncalcBase = "http://suncalc.org/#/";
        var mapCentre = sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "12";

        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth()+1;
        var dayOfMonth = now.getDate();
        var hours = now.getHours();
        var mins = now.getMinutes();
        var date = year + "." + month + "." + dayOfMonth;
        var time = hours + ":" + mins;

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }

        this.maplinks.suncalc["link"] = suncalcBase + mapCentre + "," + zoom + '/' + date + '/' + time + '/1/0';

        view.addMapServiceLinks(OutputMaps.category.utility, this, this.maplinks);
    }
},
{
    site: "TopoZone",
    image: "topozone16x16.png",
    id: "topozone",
    prio: 12,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        topozoneMap: {
            name: "Topographic"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "us") {
            var topozoneBase = "http://www.topozone.com/";
            var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
            var zoom = "&zoom=12";

            if ("resolution" in sourceMapData) {
                zoom = calculateStdZoomFromResolution(
                        sourceMapData.resolution, sourceMapData.centreCoords.lat);
                if (zoom < 1) zoom = 1;
                if (zoom > 16) zoom = 16;
                zoom = "&zoom=" + zoom;
            }

            this.maplinks.topozoneMap["link"] = topozoneBase + "map/?" + mapCentre + zoom;

            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "SysMaps",
    image: "sysmaps16x16.png",
    id: "sysmaps",
    prio: 14,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        sysmapsOS: {
            name: "OS"
        }
    },
    generate: function(sourceMapData, view) {
        if (sourceMapData.countryCode === "gb" || sourceMapData.countryCode === "im") {
            var sysmapsBase = "http://www.sysmaps.co.uk/sysmaps_os.html?";
            var mapCentre = "!" + sourceMapData.centreCoords.lat + "~" + sourceMapData.centreCoords.lng;

            this.maplinks.sysmapsOS["link"] = sysmapsBase + mapCentre;

            view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "Boulter",
    image: "boulterIcon.png",
    id: "boulter",
    cat: OutputMaps.category.utility,
    maplinks:
    {
        boulterConverter: {
            name: "Coordinate Converter"
        }
    },
    generate: function(sourceMapData, view) {
        var boulterBase = "http://boulter.com/gps/";
        var mapCentre = "#" + sourceMapData.centreCoords.lat + "%2C" + sourceMapData.centreCoords.lng;

        this.maplinks.boulterConverter["link"] = boulterBase + mapCentre;

        view.addMapServiceLinks(OutputMaps.category.utility, this, this.maplinks);
    }
},
{
    site: "OpenCycleMap",
    image: "openCycleMapLogo.png",
    id: "openCycleMap",
    prio: 8,
    cat: OutputMaps.category.plain,
    maplinks:
    {
        ocmOpenCycleMap: {
            name: "OpenCycleMap"
        },
        ocmTransport: {
            name: "Transport"
        },
        ocmLandscape: {
            name: "Landscape"
        },
        ocmOutdoors: {
            name: "Outdoors"
        },
        ocmTransportDark: {
            name: "Transport Dark"
        }
    },
    generate: function(sourceMapData, view) {
        var openCycleMapBase = "http://www.opencyclemap.org/?";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "zoom=12";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
            if (zoom > 18) zoom = 18;
            zoom = "zoom=" + zoom;
        }

        this.maplinks.ocmOpenCycleMap["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=B0000';
        this.maplinks.ocmTransport["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=0B000';
        this.maplinks.ocmLandscape["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=00B00';
        this.maplinks.ocmOutdoors["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=000B0';
        this.maplinks.ocmTransportDark["link"] = openCycleMapBase + zoom + '&' + mapCentre +
            '&layers=0000B';

        view.addMapServiceLinks(OutputMaps.category.plain, this, this.maplinks);
    }
},
{
    site: "OpenWeatherMap",
    image: "openWeatherMap16x16.png",
    id: "openweathermap",
    prio: 12,
    cat: OutputMaps.category.utility,
    maplinks:
    {
        owmWeatherMap: {
            name: "Weather Map"
        }
    },
    generate: function(sourceMapData, view) {
        var owmBase = "https://openweathermap.org/weathermap?";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "zoom=6";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
            if (zoom < 1) zoom = 1;
            zoom = "zoom=" + zoom;
        }

        this.maplinks.owmWeatherMap["link"] = owmBase + zoom + '&' + mapCentre;

        view.addMapServiceLinks(OutputMaps.category.utility, this, this.maplinks);
    }
},
{
    site: "Flickr",
    image: "flickr16x16.png",
    id: "flickr",
    cat: OutputMaps.category.utility,
    maplinks:
    {
        flickr: {
            name: "World map"
        }
    },
    generate: function(sourceMapData, view) {
        var base = "http://www.flickr.com/map/";
        var mapCentre = "fLat=" + sourceMapData.centreCoords.lat + "&fLon=" + sourceMapData.centreCoords.lng;
        var zoom = "12";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }
        zoom = "zl=" + zoom;

        this.maplinks.flickr["link"] = base + "?" + mapCentre + "&" + zoom + "&everyone_nearby=1";

        view.addMapServiceLinks(OutputMaps.category.utility, this, this.maplinks);
    }
}


];
