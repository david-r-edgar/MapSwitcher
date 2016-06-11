
CodeGrid = codegrid.CodeGrid("http://localhost/codegrid-js/tiles/", jsonWorldGrid);

function buildLineOfLinks(mapSite, links) {
    var html = "";
    if (links) {
            html =
            "<div data-sort='" + mapSite.prio + "'>" +
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

jQuery.fn.sortDivs = function sortDivs() {
    $("> div", this[0]).sort(dec_sort).appendTo(this[0]);
    function dec_sort(a, b){
        if ('undefined' === $(a).data("sort")) { return true; }
        if ('undefined' === $(b).data("sort")) { return false; }
        return ($(b).data("sort")) < ($(a).data("sort")) ? 1 : -1; }
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
                        $("#withDirns").sortDivs();
                        $("#withoutDirns").append(buildLineOfLinks(mapSite, plainMapLinks));
                        $("#withoutDirns").sortDivs();
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

