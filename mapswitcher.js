
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



function validateExtractedData(extractedData) {
    return new Promise(function(resolve, reject) {
        if (extractedData && extractedData[0] && (extractedData[0].centreCoords != null)) {
            resolve(extractedData);
        } else {
            reject(extractedData);
        }
    });
}


function getCountryCode(extractedData) {
    return new Promise(function(resolve, reject) {
        if (extractedData && extractedData[0] && (extractedData[0].centreCoords != null)) {
            CodeGrid.getCode(
                Number(extractedData[0].centreCoords.lat),
                Number(extractedData[0].centreCoords.lng),
                function (error, countryCode) {
                    if (!error) {
                        extractedData[0].countryCode = countryCode;
                        resolve(extractedData[0]);
                    }
                });
        }
    });
}



function noCoords(sourceMapData) {
    console.log("no coords");
    console.log(sourceMapData);
    $("#nomap").show();
    $("#maplinkbox").hide();
}



function run(sourceMapData) {

    if (sourceMapData.directions != null) {
        $("#withDirns").append("<h4>Directions</h4>");
        $("#withoutDirns").append("<h4>Other Maps</h4>");
    }
    for (outputMap of outputMaps) {
        (function(outputMap) { //dummy immediately executed fn to save variables
            chrome.storage.sync.get(outputMap.id, function(options) {
                if (options[outputMap.id]) {

                    outputMap.generate(sourceMapData,
                                        function(mapSite,
                                                dirnLinks, plainMapLinks) {
                        $("#withDirns").append(buildLineOfLinks(mapSite, dirnLinks));
                        $("#withDirns").sortDivs();
                        $("#withoutDirns").append(buildLineOfLinks(mapSite, plainMapLinks));
                        $("#withoutDirns").sortDivs();
                    });
                }
            });
        })(outputMap);
    }
}




$(document).ready(function() {

    new ScriptExecution()
        .executeScripts("vendor/jquery/jquery-2.2.4.min.js",
                        "mapUtil.js",
                        "dataExtractor.js")
        .then(s => validateExtractedData(s.result[2]))
        .then(s => getCountryCode(s))
        .then(s => run(s)) //pass the result of the dataExtractor script
        .catch(s => (noCoords(s)));
});

