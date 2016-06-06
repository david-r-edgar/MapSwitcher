

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.executeScript({file: "vendor/jquery/jquery-2.2.4.min.js"}, function(){
        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        }, function(result) {
            if (result && result[0] && (result[0].centreCoords != null)) {
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
                    $("#maplinkbox").append(mapHtml);
                }
            } else {
                $("#nomap").show();
                $("#maplinkbox").hide();
            }
        });
    });
});

