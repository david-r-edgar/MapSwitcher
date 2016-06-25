
CodeGrid = codegrid.CodeGrid("http://www.loughrigg.org/codegrid-js/tiles/", jsonWorldGrid);

/**
 * Sorts divs inside the element this is called on, based on the ascending numeric
 * value of their "data-sort" attribute.
 *
 * Divs with no such attribute specified are placed at the end of the list in
 * arbitrary order.
 */
jQuery.fn.sortDivs = function sortDivs() {
    $("> div", this[0]).sort(dec_sort).appendTo(this[0]);
    function dec_sort(a, b){
        if ('undefined' === $(a).data("sort")) { return 1; }
        if ('undefined' === $(b).data("sort")) { return -1; }
        return ($(b).data("sort")) < ($(a).data("sort")) ? 1 : -1; }
}


/**
 * Utility function which builds the HTML for all the map links belonging to a specific
 * map service.
 *
 * @param {string} id - id for the main map service div.
 * @param {object} mapSite - the output object representing the map service
 * @param {object} links - the map links to add, containing URLs and names for each
 * @param {note} note - a note for this map service, if applicable
 * @return {string} the HTML for the line
 */
function buildLineOfLinks(id, mapSite, links, note) {
    var html = "";
    if (links) {
            html =
            "<div id='" + id + "' data-sort='" + mapSite.prio + "'>" +
            "<span><img src=\"../image/" + mapSite.image + "\"></span> " +
            "<span>" + mapSite.site + "</span> ";
        Object.keys(links).forEach(link => {
            html += "<a class=\"maplink\" target=\"_blank\" id=\"" +
                link + "\" href=\"" +
                links[link].link + "\">" +
                links[link].name + "</a> ";
        });

        if (note && note.length) {
            html += "<span class=\"fa fa-sticky-note-o linknote\" title='" + note + "'></span>";
        }
        html += "</div>";
    }
    return html;
}



/**
 * Checks the object containing extracted data returned by the content script.
 *
 * @param {object} extractedData - Data object extracted by the dataExtractor.
 * @return Promise which resolves if the data validates, or rejects if not.
 */
function validateExtractedData(extractedData) {
    return new Promise(function(resolve, reject) {
        if (extractedData && extractedData[0] && (extractedData[0].centreCoords != null)) {
            resolve(extractedData);
        } else {
            reject(extractedData);
        }
    });
}



/**
 * Gets the two letter country code for the current location of the map shown
 * in the current tab. If the country code can be found, it is stored in the
 * extracted data object passed as argument.
 *
 * @param {object} extractedData - Data object extracted by the dataExtractor.
 * @return Promise which resolves on success with the extracted data object.
 */
function getCountryCode(extractedData) {
    return new Promise(function(resolve, reject) {
        if (extractedData && extractedData[0] && (extractedData[0].centreCoords != null)) {
            CodeGrid.getCode(
                Number(extractedData[0].centreCoords.lat),
                Number(extractedData[0].centreCoords.lng),
                function (error, countryCode) {
                    if (!error) {
                        extractedData[0].countryCode = countryCode;
                        resolve(extractedData);
                    }
                });
        }
    });
}



/**
 * Handles cases where no coordinates are available from the page, or another problem
 * has occured.
 *
 * @param {object} sourceMapData - Data object extracted by the dataExtractor.
 */
function handleNoCoords(sourceMapData) {
    $("#nomap").show();
    $("#maplinkbox").hide();
}


/**
 * Main method of the map switcher popup.
 *
 * Only run once the dataExtractor has been executed on the current tab.
 * Iterates throught the map services to request them to generate their links.
 *
 * @param sourceMapData
 */
function run(sourceMapData) {
    if (sourceMapData.directions != null) {
        $("#withDirns").append("<h4>Directions</h4>");
        $("#withoutDirns").append("<h4>Other Maps</h4>");
    }
    for (outputMap of outputMaps) {
        (function(outputMap) { //dummy immediately executed fn to save variables

            mapOptDefaults = {}
            mapOptDefaults[outputMap.id] = true;

            chrome.storage.sync.get(mapOptDefaults, function(options) {
                if (options[outputMap.id]) {
                    outputMap.generate(sourceMapData,
                        function(mapSite, dirnLinks, plainMapLinks, note) {
                        $("#withDirns").append(buildLineOfLinks(outputMap.id,
                                                                mapSite,
                                                                dirnLinks,
                                                                note));
                        $("#withDirns").sortDivs();
                        $("#withoutDirns").append(buildLineOfLinks(outputMap.id,
                                                                   mapSite,
                                                                   plainMapLinks,
                                                                   note));
                        $("#withoutDirns").sortDivs();

                        if (note && note.length) {
                            $(".linknote").tipsy({gravity: 's'});
                        }
                    });
                }
            });
        })(outputMap);
    }
}



/**
 * Entry routine.
 *
 * Injects content scripts into the current tab (including the most important, the data
 * extractor), which reads data from the map service.
 * Then performs some auxiliary methods before executing the main method run() which
 * generates all the links.
 */
$(document).ready(function() {
    new ScriptExecution()
        .executeScripts("vendor/jquery/jquery-2.2.4.min.js",
                        "src/mapUtil.js",
                        "src/dataExtractor.js")
        .then(s => validateExtractedData(s.result[2]))
        .then(s => getCountryCode(s))
        .then(s => run(s[0])) //pass the result of the dataExtractor script
        .catch(s => (handleNoCoords(s)));
});

