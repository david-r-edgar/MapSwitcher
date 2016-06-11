
CodeGrid = codegrid.CodeGrid("http://localhost/codegrid-js/tiles/", jsonWorldGrid);

function buildLineOfLinks(mapSite, links) {
    var html = "";
    if (links) {
            html =
            "<div>" +
            "<span><img src=\"image/" + mapSite.image + "\"></span> " +
            "<span>" + mapSite.site + "</span> ";
        Object.keys(links).forEach(link => {
            html += "<a class=\"maplink\" target=\"_blank\" id=\"" +
                link + "\" href=\"" +
                links[link].link + "\">" +
                links[link].name + "</a> ";
        });
        html += "</div>";
    }
    return html;
}


$(document).ready(function() {
    chrome.tabs.executeScript({file: "vendor/jquery/jquery-2.2.4.min.js"}, function(){
      chrome.tabs.executeScript({file: "mapUtil.js"}, function() {
        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        }, function(result) {
            if (result && result[0] && (result[0].centreCoords != null)) {
                if (result[0].directions != null) {
                    $("#withDirns").append("<h4>Directions</h4>");
                    $("#withoutDirns").append("<h4>Other Maps</h4>");
                }
                for (outputMap of outputMaps) {
                    outputMap.generate(result[0], function(mapSite,
                                                           dirnLinks, plainMapLinks) {
                        $("#withDirns").append(buildLineOfLinks(mapSite, dirnLinks));
                        $("#withoutDirns").append(buildLineOfLinks(mapSite, plainMapLinks));
                    });
                }
            } else {
                console.log("no coords");
                console.log(result);
                $("#nomap").show();
                $("#maplinkbox").hide();
            }
        });
      });
    });
});

