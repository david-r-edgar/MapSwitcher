
var availableLinks = {}

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.executeScript({file: "vendor/jquery/jquery-2.2.4.min.js"}, function(){
        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        }, function(result) {
            if (result && result[0] && (result[0].centreCoords != null)) {
                for (outputMap of outputMaps) {
                    outputMap.generate(result[0]);
                }
                $(".maplink").each(function() {
                    var mlid = $(this).attr('id');
                    if (availableLinks.hasOwnProperty(mlid)) {
                        $(this).attr('href', availableLinks[mlid]);
                    }
                });
            } else {
                $("#nomap").show();
                $("#maplinkbox").hide();
            }
        });
    });
});

