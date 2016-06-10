
CodeGrid = codegrid.CodeGrid("http://localhost/codegrid-js/tiles/", jsonWorldGrid);

$(document).ready(function() {
    chrome.tabs.executeScript({file: "vendor/jquery/jquery-2.2.4.min.js"}, function(){
      chrome.tabs.executeScript({file: "mapUtil.js"}, function() {
        chrome.tabs.executeScript({
            file: "dataExtractor.js"
        }, function(result) {
            if (result && result[0] && (result[0].centreCoords != null)) {
                if (result[0].directions != null) {
                    $("#maplinkbox #withDirns").append("<h4>Directions</h4>");
                    $("#maplinkbox #withoutDirns").append("<h4>Other Maps</h4>");
                }
                for (outputMap of outputMaps) {
                    outputMap.generate(result[0], function(mapSite,
                                                           dirnLinks, plainMapLinks) {
                        var dirnLinkHtml = "";
                        if (dirnLinks) {
                            dirnLinkHtml =
                                "<div>" +
                                "<span><img src=\"image/" + mapSite.image + "\"></span> " +
                                "<span>" + mapSite.site + "</span> ";
                            Object.keys(dirnLinks).forEach(dirnLink => {
                                dirnLinkHtml += "<a class=\"maplink\" target=\"_blank\" id=\"" +
                                    dirnLink + "\" href=\"" +
                                    dirnLinks[dirnLink].link + "\">" +
                                    dirnLinks[dirnLink].name + "</a> ";
                            });
                            dirnLinkHtml += "</div>";
                            $("#maplinkbox #withDirns").append(dirnLinkHtml);
                        }

                        var plainMapHtml = "";
                        if (plainMapLinks) {
                            plainMapHtml =
                                "<div>" +
                                "<span><img src=\"image/" + mapSite.image + "\"></span> " +
                                "<span>" + mapSite.site + "</span> ";
                            Object.keys(plainMapLinks).forEach(plainMapLink => {
                                plainMapHtml += "<a class=\"maplink\" target=\"_blank\" id=\"" +
                                    plainMapLink + "\" href=\"" +
                                    plainMapLinks[plainMapLink].link + "\">" +
                                    plainMapLinks[plainMapLink].name + "</a> ";
                            });
                            plainMapHtml += "</div>";
                            $("#maplinkbox #withoutDirns").append(plainMapHtml);
                        }
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

