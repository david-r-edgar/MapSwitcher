let outputMaps = [
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
    generate: function(sourceMapData, onSuccess) {
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
            zoom = calculateStdZoomFromResolution(
                sourceMapData.resolution, sourceMapData.centreCoords.lat) + "z";
        }

        this.maplinks.googlemaps["link"] = googleBase + directions + mapCentre + zoom;
        this.maplinks.googleterrain["link"] = googleBase + directions + mapCentre + zoom + "/data=!5m1!1e4";
        this.maplinks.googleearth["link"] = googleBase + directions + mapCentre + zoom + "/data=!3m1!1e3!5m1!1e4";

        if (directions.length > 0) {
            onSuccess(this, this.maplinks, null);
        } else {
            onSuccess(this, null, this.maplinks);
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
    generate: function(sourceMapData, onSuccess) {
        var bingBase = "http://bing.com/maps/default.aspx?";
        var directions = "";
        var mapCentre = "cp=" + sourceMapData.centreCoords.lat + "~" +
                                sourceMapData.centreCoords.lng;
        var zoom = "&lvl=10";

        if ("resolution" in sourceMapData) {
            zoom = "&lvl=" + calculateStdZoomFromResolution(
                                sourceMapData.resolution,
                                sourceMapData.centreCoords.lat);
        }

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
        }

        this.maplinks.bingroad["link"] =
            bingBase + directions + "&" + mapCentre + zoom;
        this.maplinks.bingaerial["link"] =
            bingBase + directions + "&" + mapCentre + zoom + "&sty=h";
        this.maplinks.bingbirdseye["link"] =
            bingBase + directions + "&" + mapCentre + zoom + "&sty=b";

        this.generatedMapLinks = {}
        this.generatedMapLinks.bingroad = this.maplinks.bingroad;
        this.generatedMapLinks.bingaerial = this.maplinks.bingaerial;
        this.generatedMapLinks.bingbirdseye = this.maplinks.bingbirdseye;


        var self = this;
        CodeGrid.getCode (Number(sourceMapData.centreCoords.lat),
                          Number(sourceMapData.centreCoords.lng),
            function (error, countryCode) {
                if (error) {
                    console.log("error");
                } else {
                    if (countryCode === "gb") {
                        self.generatedMapLinks.bingos = {name: self.maplinks.bingos.name,
                            link: (bingBase + directions + "&" + mapCentre + zoom + "&sty=s")}
                    }
                }

                if (directions.length > 0) {
                    onSuccess(self, self.generatedMapLinks, null);
                } else {
                    onSuccess(self, null, self.generatedMapLinks);
                }
            });
    }
},
{
    site: "OpenStreetMap",
    prio: 3,
    image: "osmLogo16x16.png",
    id: "osm",
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
    generate: function(sourceMapData, onSuccess) {
        var osmBase = "https://www.openstreetmap.org/";
        var zoom = "12/";
        var mapCentre = sourceMapData.centreCoords.lat + "/" + sourceMapData.centreCoords.lng;
        var directions = "";

        if ("resolution" in sourceMapData) {
            zoom = calculateStdZoomFromResolution(
                sourceMapData.resolution, sourceMapData.centreCoords.lat) + "/";
        }

        if (sourceMapData.directions &&
                sourceMapData.directions.from &&
                sourceMapData.directions.to) {
            //FIXME if there are only addresses, no coords, how do we handle this?
            if (sourceMapData.directions.from.coords &&
                    sourceMapData.directions.to.coords) {
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

                directions = "directions?" + mode + "route=" +
                    sourceMapData.directions.from.coords.lat + "," +
                    sourceMapData.directions.from.coords.lng + ";" +
                    sourceMapData.directions.to.coords.lat + "," +
                    sourceMapData.directions.to.coords.lng;
            }
        }

        var coreLink = osmBase + directions + "#map=" + zoom + mapCentre;

        this.maplinks.osmStandard["link"] = coreLink;
        this.maplinks.osmCycle["link"] = coreLink + "&layers=C";
        this.maplinks.osmTransport["link"] = coreLink + "&layers=T";
        this.maplinks.osmMapQuestOpen["link"] = coreLink + "&layers=Q";
        this.maplinks.osmHumanitarian["link"] = coreLink + "&layers=H";

        if (directions.length > 0) {
            onSuccess(this, this.maplinks, null);
        } else {
            onSuccess(this, null, this.maplinks);
        }
    }
},
{
    site: "Wikimedia Labs",
    image: "wmLabsLogo16x16.png",
    id: "wmLabs",
    maplinks:
    {
        wmGeoHack: {
            name: "GeoHack"
        },
        wikiminiatlas: {
            name: "Wiki Mini Atlas"
        }
    },
    generate: function(sourceMapData, onSuccess) {
        var geohackBase = "https://tools.wmflabs.org/geohack/geohack.php?params=";
        var mapCentre = sourceMapData.centreCoords.lat + "_N_" + sourceMapData.centreCoords.lng + "_E";
        this.maplinks.wmGeoHack["link"] = geohackBase + mapCentre;

        var wikiminiatlasBase = "https://wma.wmflabs.org/iframe.html?";
        mapCentre = sourceMapData.centreCoords.lat + "_" + sourceMapData.centreCoords.lng;
        zoom = "10";
        this.maplinks.wikiminiatlas["link"] = wikiminiatlasBase + mapCentre + "_0_0_en_" + zoom + "_englobe=Earth";

        onSuccess(this, null, this.maplinks);
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
    generate: function(sourceMapData, onSuccess) {
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

        onSuccess(this, null, this.maplinks);
    }
},
{
    site: "Geocaching",
    image: "geocachingLogo16x16.png",
    id: "geocaching",
    maplinks:
    {
        geocaching: {
            name: "Map"
        }
    },
    generate: function(sourceMapData, onSuccess) {
        var geocachingBase = "https://www.geocaching.com/map/#?";
        var mapCentre = "ll=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "z=14";

        if ("resolution" in sourceMapData) {
            zoom = "z=" +
                calculateStdZoomFromResolution(
                    sourceMapData.resolution, sourceMapData.centreCoords.lat);
        }
        this.maplinks.geocaching["link"] = geocachingBase + mapCentre + '&' + zoom;

        onSuccess(this, null, this.maplinks);
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
    generate: function(sourceMapData, onSuccess) {
        var w3wBase = "https://map.what3words.com/";
        var mapCentre = sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        this.maplinks.what3words["link"] = w3wBase + mapCentre;

        onSuccess(this, null, this.maplinks);
    }
}
];
