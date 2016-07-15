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
        }
    },
    generate: function(sourceMapData, view) {
        var googleBase = "https://www.google.co.uk/maps/";
        var directions = "";
        var mapCentre = "@" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng + ",";
        var zoom = "10z";

        if ("directions" in sourceMapData) {
            directions = "dir/";
            if ("coords" in sourceMapData.directions.from) {
                directions += sourceMapData.directions.from.coords.lat + "," +
                    sourceMapData.directions.from.coords.lng + "/";
            } else {
                directions += sourceMapData.directions.from.address + "/";
            }
            if ("coords" in sourceMapData.directions.to) {
                directions += sourceMapData.directions.to.coords.lat + "," +
                    sourceMapData.directions.to.coords.lng + "/";
            } else {
                directions += sourceMapData.directions.to.address + "/";
            }
        }

        if ("resolution" in sourceMapData) {
            //google minimum zoom is 3
            zoom = calculateStdZoomFromResolution(
                sourceMapData.resolution, sourceMapData.centreCoords.lat, 3) + "z";
        }

        this.maplinks.googlemaps["link"] = googleBase + directions + mapCentre + zoom;
        this.maplinks.googleterrain["link"] = googleBase + directions + mapCentre + zoom + "/data=!5m1!1e4";
        this.maplinks.googleearth["link"] = googleBase + directions + mapCentre + zoom + "/data=!3m1!1e3!5m1!1e4";

        if (directions.length > 0) {
            view.addDirectionsLinks(this, this.maplinks);
        } else {
            view.addPlainLinks(this, this.maplinks);
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
            view.addDirectionsLinks(this, this.maplinks);
        } else {
            view.addPlainLinks(this, this.maplinks);
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


            console.log(firstElem);
            console.log(lastElem);




            //FIXME if there are only addresses, no coords, how do we handle this?
            if ("coords" in firstElem && "coords" in lastElem) {
               directions = "directions?" + mode + "route=" +
                    firstElem.coords.lat + "," + firstElem.coords.lng + ";" +
                    lastElem.coords.lat + "," + lastElem.coords.lng;
                    if (sourceMapData.directions.route.length > 2) {
                        this.note = "Omitting intermediate waypoints (not "
                                    + "supported by OSM).";
                    }
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
            view.addDirectionsLinks(this, this.maplinks, this.note);
        } else {
            view.addPlainLinks(this, this.maplinks, this.note);
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

        view.addPlainLinks(this, this.maplinks);
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

        view.addPlainLinks(this, this.maplinks);
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

        view.addPlainLinks(this, this.maplinks, this.note);
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

        view.addPlainLinks(this, this.maplinks);
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

        view.addPlainLinks(this, this.maplinks);
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

        if ("resolution" in sourceMapData) {
            zoom = "zoom=" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }

        console.log("waze hunting directions");



        //FIXME
        if ("directions" in sourceMapData) {
            directions = "";
            if (("from" in sourceMapData.directions) &&
                ("to" in sourceMapData.directions) &&
                ("coords" in sourceMapData.directions.from) &&
                ("coords" in sourceMapData.directions.to)) {
                directions +=
                    "&from_lat=" + sourceMapData.directions.from.coords.lat +
                    "&from_lon=" + sourceMapData.directions.from.coords.lng +
                    "&to_lat=" + sourceMapData.directions.to.coords.lat +
                    "&to_lon=" + sourceMapData.directions.to.coords.lng +
                    "&at_req=0&at_text=Now";
            } else {
                this.note = "Waze directions unavailable because waypoints are not "
                            + "all specified as coordinates.";
            }
        }

        console.log("waze passed directions");

        this.maplinks.livemap["link"] = wazeBase + zoom + '&' + mapCentre + directions;

        if (directions.length > 0) {
            view.addDirectionsLinks(this, this.maplinks, this.note);
        } else {
            view.addPlainLinks(this, this.maplinks, this.note);
        }
    }
}
];


