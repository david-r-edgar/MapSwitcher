let outputMaps = [
{
    site: "Google",
    image: "googleMapsLogo16x16.png",
    id: "google",
    dirn: false,
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
    generate: function(sourceMapData) {
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
            this.dirn = true;
        }

        if ("metresPerPixel" in sourceMapData) {
            zoom =
                calculateGoogleZoomFromMetresPerPixel(
                    sourceMapData.metresPerPixel, sourceMapData.centreCoords.lat) + "z";
        }

        this.maplinks.googlemaps["link"] = googleBase + directions + mapCentre + zoom;
        this.maplinks.googleterrain["link"] = googleBase + directions + mapCentre + zoom + "/data=!5m1!1e4";
        this.maplinks.googleearth["link"] = googleBase + directions + mapCentre + "1891m/data=!3m1!1e3!5m1!1e4";
    }
},
{
    site: "Bing",
    image: "bingLogo16x16.png",
    id: "bing",
    dirn: false,
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
    generate: function(sourceMapData) {
        var bingBase = "http://bing.com/maps/default.aspx?";
        var directions = "";
        var mapCentre = "cp=" + sourceMapData.centreCoords.lat + "~" + sourceMapData.centreCoords.lng;

        if ("directions" in sourceMapData) {
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
            directions = "rtp=";
            if ("coords" in sourceMapData.directions.from) {
                directions += "pos." + sourceMapData.directions.from.coords.lat + "_" +
                    sourceMapData.directions.from.coords.lng + "~";
            } else {
                directions += "adr." + sourceMapData.directions.from.address + "~";
            }
            if ("coords" in sourceMapData.directions.to) {
                directions += "pos." + sourceMapData.directions.to.coords.lat + "_" +
                    sourceMapData.directions.to.coords.lng;
            } else {
                directions += "adr." + sourceMapData.directions.to.address;
            }
            directions += mode;
            this.dirn = true;
        }

        this.maplinks.bingroad["link"] = bingBase + directions + "&" + mapCentre;
        this.maplinks.bingos["link"] = bingBase + directions + "&" + mapCentre + "&sty=s";
        this.maplinks.bingaerial["link"] = bingBase + directions + "&" + mapCentre + "&sty=h";
        this.maplinks.bingbirdseye["link"] = bingBase + directions + "&" + mapCentre + "&sty=b";
    }
},
{
    site: "OpenStreetMap",
    image: "osmLogo16x16.png",
    id: "osm",
    dirn: false,
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
    generate: function(sourceMapData) {
        var osmBase = "https://www.openstreetmap.org/#map=";
        var zoom = "12/";
        var mapCentre = sourceMapData.centreCoords.lat + "/" + sourceMapData.centreCoords.lng;

        this.maplinks.osmStandard["link"] = osmBase + zoom + mapCentre;
        this.maplinks.osmCycle["link"] = osmBase + zoom + mapCentre + "&layers=C";
        this.maplinks.osmTransport["link"] = osmBase + zoom + mapCentre + "&layers=T";
        this.maplinks.osmMapQuestOpen["link"] = osmBase + zoom + mapCentre + "&layers=Q";
        this.maplinks.osmHumanitarian["link"] = osmBase + zoom + mapCentre + "&layers=H";
    }
},
{
    site: "Wikimedia Labs",
    image: "wmLabsLogo16x16.png",
    id: "wmLabs",
    dirn: false,
    maplinks:
    {
        wmGeoHack: {
            name: "GeoHack"
        },
        wikiminiatlas: {
            name: "Wiki Mini Atlas"
        }
    },
    generate: function(sourceMapData) {
        var geohackBase = "https://tools.wmflabs.org/geohack/geohack.php?params=";
        var mapCentre = sourceMapData.centreCoords.lat + "_N_" + sourceMapData.centreCoords.lng + "_E";
        this.maplinks.wmGeoHack["link"] = geohackBase + mapCentre;

        var wikiminiatlasBase = "https://wma.wmflabs.org/iframe.html?";
        mapCentre = sourceMapData.centreCoords.lat + "_" + sourceMapData.centreCoords.lng;
        zoom = "10";
        this.maplinks.wikiminiatlas["link"] = wikiminiatlasBase + mapCentre + "_0_0_en_" + zoom + "_englobe=Earth";
    }
},
{
    site: "Wikimapia",
    image: "wikimapiaLogo16x16.png",
    id: "wikimapia",
    dirn: false,
    maplinks:
    {
        wikimapiaSatellite: {
            name: "Satellite"
        },
        wikimapiaMap: {
            name: "Maps"
        }
    },
    generate: function(sourceMapData) {
        var wikimapiaBase = "http://wikimapia.org/#lang=en&";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "z=12";
        this.maplinks.wikimapiaSatellite["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=b"; //m=b seems to be an optional default anyway
        this.maplinks.wikimapiaMap["link"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=w";
    }
},
{
    site: "Geocaching",
    image: "geocachingLogo16x16.png",
    id: "geocaching",
    dirn: false,
    maplinks:
    {
        geocaching: {
            name: "Map"
        }
    },
    generate: function(sourceMapData) {
        var geocachingBase = "https://www.geocaching.com/map/#?";
        var mapCentre = "ll=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "z=14";
        this.maplinks.geocaching["link"] = geocachingBase + mapCentre + '&' + zoom;
    }
},
{
    site: "what3words",
    image: "w3wLogo.png",
    id: "w3w",
    dirn: false,
    maplinks:
    {
        what3words: {
            name: "Map"
        }
    },
    generate: function(sourceMapData) {
        var w3wBase = "https://map.what3words.com/";
        var mapCentre = sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        this.maplinks.what3words["link"] = w3wBase + mapCentre;
    }
}
];
