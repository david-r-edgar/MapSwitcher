
var availableLinks = {}

let outputMaps = [
{
    generate: function(sourceMapData) {
        var bingBase = "http://bing.com/maps/default.aspx?";
        var directions = "";
        var mapCentre = "cp=" + sourceMapData.centreCoords.lat + "~" + sourceMapData.centreCoords.lng;

        if (("dirFrom" in sourceMapData) && ("dirTo" in sourceMapData)) {
            directions = "rtp=adr." + sourceMapData["dirFrom"] + "~adr." + sourceMapData["dirTo"];
        }

        availableLinks["bingroad"] = bingBase + directions + "&" + mapCentre;
        availableLinks["bingos"] = bingBase + directions + "&" + mapCentre + "&sty=s";
        availableLinks["bingaerial"] = bingBase + directions + "&" + mapCentre + "&sty=h";
        availableLinks["bingbirdseye"] = bingBase + directions + "&" + mapCentre + "&sty=b";
    }
},
{
    generate: function(sourceMapData) {
        var googleBase = "https://www.google.co.uk/maps/";
        var directions = "";
        var mapCentre = "@" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng + ",";
        var zoom = "14z";

        if (("dirFrom" in sourceMapData) && ("dirTo" in sourceMapData)) {
            directions = "dir/" + sourceMapData["dirFrom"] + "/" + sourceMapData["dirTo"] + "/";
        }

        availableLinks["googlemaps"] = googleBase + directions + mapCentre + zoom;
        availableLinks["googleterrain"] = googleBase + directions + mapCentre + zoom + "/data=!5m1!1e4";
        availableLinks["googleearth"] = googleBase + directions + mapCentre + "1891m/data=!3m1!1e3!5m1!1e4";
    }
},
{
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
    generate: function(sourceMapData) {
        var geohackBase = "https://tools.wmflabs.org/geohack/geohack.php?params=";
        var mapCentre = sourceMapData.centreCoords.lat + "_N_" + sourceMapData.centreCoords.lng + "_E";
        availableLinks["wmGeoHack"] = geohackBase + mapCentre;
    }
},
{
    generate: function(sourceMapData) {
        var geocachingBase = "https://www.geocaching.com/map/#?";
        var mapCentre = "ll=" + sourceMapData.centreCoords.lat + "," + sourceMapData.centreCoords.lng;
        var zoom = "z=14";
        availableLinks["geocaching"] = geocachingBase + mapCentre + '&' + zoom;
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

