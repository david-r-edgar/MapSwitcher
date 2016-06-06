

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.executeScript({file: "vendor/jquery/jquery-2.2.4.min.js"}, function(){
        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        }, function(result) {
            if (result && result[0] && (result[0].centreCoords != null)) {
                let mapsWithDirns = "";
                let mapsWithoutDirns = "";
                for (outputMap of outputMaps) {
                    outputMap.generate(result[0]);
                    mapHtml =
                        "<div>" +
                        "<span><img src=\"image/" + outputMap.image + "\"></span> " +
                        "<span>" + outputMap.site + "</span> ";
                    Object.keys(outputMap.maplinks).forEach(maplink => {
                        mapHtml += "<a class=\"maplink\" target=\"_blank\" id=\"" +
                            maplink + "\" href=\"" +
                            outputMap.maplinks[maplink].link + "\">" +
                            outputMap.maplinks[maplink].name + "</a> ";
                    });
                    mapHtml += "</div>";
                    if (outputMap.dirn) {
                        mapsWithDirns += mapHtml;
                    } else {
                        mapsWithoutDirns += mapHtml;
                    }
                }
                if (mapsWithDirns.length) {
                    $("#maplinkbox").append("<h4>Directions</h4>");
                    $("#maplinkbox").append(mapsWithDirns);
                    $("#maplinkbox").append("<h4>Other Maps</h4>");
                }
                $("#maplinkbox").append(mapsWithoutDirns);
            } else {
                $("#nomap").show();
                $("#maplinkbox").hide();
            }
        });
    });
});

