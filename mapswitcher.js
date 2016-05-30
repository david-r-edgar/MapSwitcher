
var availableLinks = {}

//TODO refactor so that we can call all such routines with one command
function buildBingURLs(sourceMapData) {

    var bingBase = "http://bing.com/maps/default.aspx?";
    var directions = "";
    var mapCentre = "cp=" + sourceMapData["centreLat"] + "~" + sourceMapData["centreLng"];

    if (("dirFrom" in sourceMapData) && ("dirTo" in sourceMapData)) {
        console.log(sourceMapData["dirFrom"]);
        console.log(sourceMapData["dirTo"]);

        directions = "rtp=adr." + sourceMapData["dirFrom"] + "~adr." + sourceMapData["dirTo"];
    }

    availableLinks["bingroad"] = bingBase + directions + "&" + mapCentre;
    availableLinks["bingos"] = bingBase + directions + "&" + mapCentre + "&sty=s";
    availableLinks["bingaerial"] = bingBase + directions + "&" + mapCentre + "&sty=h";
    availableLinks["bingbirdseye"] = bingBase + directions + "&" + mapCentre + "&sty=b";
}

function buildGoogleURLs(sourceMapData) {

    var googleBase = "https://www.google.co.uk/maps/";
    var mapCentre = "@" + sourceMapData["centreLat"] + "," + sourceMapData["centreLng"] + ",";
    var zoom = "17z";

    availableLinks["googlemaps"] = googleBase + mapCentre + zoom;
    availableLinks["googleterrain"] = googleBase + mapCentre + zoom + "/data=!5m1!1e4";
    availableLinks["googleearth"] = googleBase + mapCentre + "1891m/data=!3m1!1e3!5m1!1e4";
}


document.addEventListener('DOMContentLoaded', function() {

    $(".maplink").on("click", function() {
        var mlid = $(this).attr('id');
        if (availableLinks.hasOwnProperty(mlid)) {
            chrome.tabs.create({url: availableLinks[mlid]});
        }
    });

    chrome.tabs.executeScript({
        file: "dataExtractor.js"
    }, function(result) {
        if (result && result[0]
            && (result[0].centreLat !== null)
            && (result[0].centreLng !== null)) {
            buildBingURLs(result[0]);
            buildGoogleURLs(result[0]);
        }
    });

});

