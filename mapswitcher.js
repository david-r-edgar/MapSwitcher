
var availableLinks = {}

let outputMaps = [
{
    site: "Google",
    image: "googleMapsLogo16x16.png",
    maplinks:
    {
        googlemaps: "Maps",
        googleterrain: "Terrain",
        googleearth: "Earth"
    },
    generate: function(sourceMapData) {
        var googleBase = "https://www.google.co.uk/maps/";
        var directions = "";
        var mapCentre = "@" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng + ",";
        var zoom = "14z";

        if ("directions" in sourceMapData) {
            directions = "dir/" + sourceMapData.directions.from + "/" + sourceMapData.directions.to + "/";
        }

        availableLinks["googlemaps"] = googleBase + directions + mapCentre + zoom;
        availableLinks["googleterrain"] = googleBase + directions + mapCentre + zoom + "/data=!5m1!1e4";
        availableLinks["googleearth"] = googleBase + directions + mapCentre + "1891m/data=!3m1!1e3!5m1!1e4";
    }
},
{
    site: "Bing",
    image: "bingLogo16x16",
    maplinks:
    {
        bingroad: "Road",
        bingaerial: "Aerial",
        bingbirdseye: "Bird's eye",
        bingos: "Ordnance Survey"
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
            directions = "rtp=adr." + sourceMapData.directions.from + "~adr." + sourceMapData.directions.to + mode;
        }

        availableLinks["bingroad"] = bingBase + directions + "&" + mapCentre;
        availableLinks["bingos"] = bingBase + directions + "&" + mapCentre + "&sty=s";
        availableLinks["bingaerial"] = bingBase + directions + "&" + mapCentre + "&sty=h";
        availableLinks["bingbirdseye"] = bingBase + directions + "&" + mapCentre + "&sty=b";
    }
},
{
    site: "OpenStreetMap",
    image: "osmLogo16x16.png",
    maplinks:
    {
        osmStandard: "Standard",
        osmCycle: "Cycle Map",
        osmTransport: "Transport",
        osmMapQuestOpen: "MapQuest Open",
        osmHumanitarian: "Humanitarian"
    },
    generate: function(sourceMapData) {
        var osmBase = "https://www.openstreetmap.org/#map=";
        var zoom = "12/";
        var mapCentre = sourceMapData.centreCoords.lat + "/" + sourceMapData.centreCoords.lng;

        availableLinks["osmStandard"] = osmBase + zoom + mapCentre;
        availableLinks["osmCycle"] = osmBase + zoom + mapCentre + "&layers=C";
        availableLinks["osmTransport"] = osmBase + zoom + mapCentre + "&layers=T";
        availableLinks["osmMapQuestOpen"] = osmBase + zoom + mapCentre + "&layers=Q";
        availableLinks["osmHumanitarian"] = osmBase + zoom + mapCentre + "&layers=H";
    }
},
{
    site: "Wikimedia Labs",
    image: "wmGeohackToolsLogo.png",
    maplinks:
    {
        wmGeoHack: "GeoHack",
        wikiminiatlas: "Wiki Mini Atlas"
    },
    generate: function(sourceMapData) {
        var geohackBase = "https://tools.wmflabs.org/geohack/geohack.php?params=";
        var mapCentre = sourceMapData.centreCoords.lat + "_N_" + sourceMapData.centreCoords.lng + "_E";
        availableLinks["wmGeoHack"] = geohackBase + mapCentre;

        var wikiminiatlasBase = "https://wma.wmflabs.org/iframe.html?";
        mapCentre = sourceMapData.centreCoords.lat + "_" + sourceMapData.centreCoords.lng;
        zoom = "10";
        availableLinks["wikiminiatlas"] = wikiminiatlasBase + mapCentre + "_0_0_en_" + zoom + "_englobe=Earth";
    }
},
{
    site: "Wikimapia",
    image: "wikimapiaLogo16x16.png",
    maplinks:
    {
        wikimapiaSatellite: "Satellite",
        wikimapiaMap: "Map"
    },
    generate: function(sourceMapData) {
        var wikimapiaBase = "http://wikimapia.org/#lang=en&";
        var mapCentre = "lat=" + sourceMapData.centreCoords.lat + "&lon=" + sourceMapData.centreCoords.lng;
        var zoom = "z=12";
        availableLinks["wikimapiaSatellite"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=b"; //m=b seems to be an optional default anyway
        availableLinks["wikimapiaMap"] = wikimapiaBase + mapCentre + '&' + zoom + "&m=w";
    }
},
{
    site: "Geocaching",
    image: "geocachingLogo16x16.png",
    maplinks:
    {
        geocaching: "Map"
    },
    generate: function(sourceMapData) {
        var geocachingBase = "https://www.geocaching.com/map/#?";
        var mapCentre = "ll=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "z=14";
        availableLinks["geocaching"] = geocachingBase + mapCentre + '&' + zoom;
    }
},
{
    site: "what3words",
    image: "w3wLogo.png",
    maplinks:
    {
        what3words: "Map"
    },
    generate: function(sourceMapData) {
        var w3wBase = "https://map.what3words.com/";
        var mapCentre = sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        availableLinks["what3words"] = w3wBase + mapCentre;
    }
}
];


document.addEventListener('DOMContentLoaded', function() {

    $(".maplink").on("click", function() {
        var mlid = $(this).attr('id');
        if (availableLinks.hasOwnProperty(mlid)) {
            chrome.tabs.create({url: availableLinks[mlid]});
        }
    });

    chrome.tabs.executeScript({file: "jquery-2.2.4.min.js"}, function(){
        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        }, function(result) {
            if (result && result[0] && (result[0].centreCoords != null)) {
                for (outputMap of outputMaps) {
                    outputMap.generate(result[0]);
                }
            } else {
                $("#nomap").show();
                $("#maplinkbox").hide();
            }
        });
    });

});

