
/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });

}


var extractedMapData = {}
var availableLinks = {}

function parseGoogleURL(url) {
    var parser = document.createElement('a');
    parser.href = url;
    var hostname = parser.hostname;
    var google = "google";
    if (hostname.indexOf(google) <= -1) {
        return false;
    }

    var re = /@([-0-9.]+),([-0-9.]+),/;
    coordArray = parser.pathname.match(re);
    if (coordArray && coordArray.length >= 3) {
        extractedMapData["centreLat"] = coordArray[1];
        extractedMapData["centreLng"] = coordArray[2];
    }

    //TODO correct legal characters for locations in google URL?
    re = /dir\/([-A-Za-z0-9%'+,]+)\/([-A-Za-z0-9%'+,]+)\//;
    coordArray = parser.pathname.match(re);
    if (coordArray && coordArray.length >= 3) {
        extractedMapData["dirFrom"] = coordArray[1];
        extractedMapData["dirTo"] = coordArray[2];
    }

    return true;
}


function buildBingURLs(extractedMapData) {

    var bingBase = "http://bing.com/maps/default.aspx?";
    var directions = "";
    var mapCentre = "cp=" + extractedMapData["centreLat"] + "~" + extractedMapData["centreLng"];

    if (("dirFrom" in extractedMapData) && ("dirTo" in extractedMapData)) {
        console.log(extractedMapData["dirFrom"]);
        console.log(extractedMapData["dirTo"]);

        directions = "rtp=adr." + extractedMapData["dirFrom"] + "~adr." + extractedMapData["dirTo"];
    }

    availableLinks["bingroad"] = bingBase + directions + "&" + mapCentre;
    availableLinks["bingos"] = bingBase + directions + "&" + mapCentre + "&sty=s";
    availableLinks["bingaerial"] = bingBase + directions + "&" + mapCentre + "&sty=h";
    availableLinks["bingbirdseye"] = bingBase + directions + "&" + mapCentre + "&sty=b";

    console.log(availableLinks["bingroad"]);
    console.log(availableLinks["bingos"]);
}







document.addEventListener('DOMContentLoaded', function() {

    $(".maplink").on("click", function() {
        var mlid = $(this).attr('id');
        if (availableLinks.hasOwnProperty(mlid)) {
            chrome.tabs.create({url: availableLinks[mlid]});
        }
    });

    getCurrentTabUrl(function(url) {
        console.log('Extracting coords from ' + url);

        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        });


        var matched = false;

        //Attempt to parse each type of input map document.
        //Any that match return true and populate the extracted data object;
        //others return false and have no effect.
        matched = matched || parseGoogleURL(url);
        //matched = matched || parseBingURL(url);

        //If we found a match, we now have extracted data which we can use to
        //construct URLs for all the other services.
        if (matched) {
            buildBingURLs(extractedMapData);
        }
    });
});
