/**
 * Array of all output map services
 *
 * The most important item for each service is the `generate()` function which accepts
 * as input an object containing the data from the source map, plus a view object
 * (representing the extension popup). Each service uses the source map data to
 * generate appropriate links, and calls the relevant functions on the view object
 * to render those links to the view.
 */
var outputMapServices = [
{
    site: "Google",
    prio: 1,
    image: "googleMapsLogo16x16.png",
    id: "google",
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
        var googleBase = "https://www.google.co.uk/maps/";
        var directions = "";
        var mapCentre = "@" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng + ",";
        var zoom = "10z";
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
                    directions += rteWpt.coords.lat + "," +  + "/";
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
            view.addMapServiceLinks(view.category.multidirns, this, this.maplinks);
        } else {
            view.addMapServiceLinks(view.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "Bing",
    prio: 2,
    image: "bingLogo16x16.png",
    id: "bing",
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
        },
        bingos: {
            name: "Ordnance Survey"
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

        if (sourceMapData.countryCode === "gb") {
            this.maplinks.bingos = {name: this.maplinks.bingos.name,
                link: (bingBase + directions + "&" + mapCentre + zoom + "&sty=s")}
        }
        if (directions.length > 0) {
            view.addMapServiceLinks(view.category.multidirns, this, this.maplinks);
        } else {
            view.addMapServiceLinks(view.category.plain, this, this.maplinks);
        }
    }
},
{
    site: "OpenStreetMap",
    prio: 3,
    image: "osmLogo16x16.png",
    id: "osm",
    note: "",
    maplinks:
    {
        osmStandard: "Standard",
        osmCycle: "Cycle Map",
        osmTransport: "Transport",
        osmMapQuestOpen: "MapQuest Open",
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
        osmMapQuestOpen: {
            name: "MapQuest Open"
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
        this.maplinks.osmMapQuestOpen["link"] = coreLink + "&layers=Q";
        this.maplinks.osmHumanitarian["link"] = coreLink + "&layers=H";

        if (directions.length > 0) {
            view.addMapServiceLinks(view.category.singledirns, this, this.maplinks, this.note);
        } else {
            view.addMapServiceLinks(view.category.plain, this, this.maplinks, this.note);
        }
    }
},
{
    site: "Wikimedia Labs",
    image: "wmLabsLogo16x16.png",
    id: "wmLabs",
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
        zoom = "10";
        this.maplinks.wikiminiatlas["link"] = wikiminiatlasBase + mapCentre + "_0_0_en_" + zoom + "_englobe=Earth";

        view.addMapServiceLinks(view.category.plain, this, this.maplinks);
    }
},
{
    site: "Wikimapia",
    image: "wikimapiaLogo16x16.png",
    id: "wikimapia",
    maplinks:
    {
        wikimapiaSatellite: {
            name: "Satellite"
        },
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

        this.maplinks.wikimapiaSatellite["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=b"; //m=b seems to be an optional default anyway
        this.maplinks.wikimapiaMap["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=w";

        view.addMapServiceLinks(view.category.plain, this, this.maplinks);
    }
},
{
    site: "Geocaching",
    image: "geocachingLogo16x16.png",
    id: "geocaching",
    note: "geocaching.com requires login to see the map (free sign-up)",
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

        view.addMapServiceLinks(view.category.plain, this, this.maplinks, this.note);
    }
},
{
    site: "what3words",
    image: "w3wLogo.png",
    id: "w3w",
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

        view.addMapServiceLinks(view.category.plain, this, this.maplinks);
    }
},
{
    site: "MapQuest",
    image: "mqLogo16x16.png",
    id: "mapquest",
    maplinks:
    {
        mqOpen: {
            name: "MapQuest Open"
        }
    },
    generate: function(sourceMapData, view) {
        var mapquestBase = "http://open.mapquest.com/?";
        var mapCentre = "center=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "zoom=12";

        if ("resolution" in sourceMapData) {
            zoom = "zoom=" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }

        this.maplinks.mqOpen["link"] = mapquestBase + mapCentre + '&' + zoom;

        view.addMapServiceLinks(view.category.plain, this, this.maplinks);
    }
},
{
    site: "GPX",
    image: "gpxFile16x16.png",
    id: "dl_gpx",
    generate: function(sourceMapData, view) {

        var mapCentre = { id: "gpx_map_centre",
                          name: "Centre of map",
                          desc: sourceMapData.centreCoords.lat + ", " + sourceMapData.centreCoords.lng,
                          lat: sourceMapData.centreCoords.lat,
                          lng: sourceMapData.centreCoords.lng }
        view.addFileDownload(this, mapCentre);
    }
},
{
    site: "Waze",
    image: "wazeLogo16x16.png",
    id: "waze",
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
            view.addMapServiceLinks(view.category.singledirns, this, this.maplinks, this.note);
        } else {
            view.addMapServiceLinks(view.category.plain, this, this.maplinks, this.note);
        }
    }
}
];


