
/**
 * CodeGrid is a service for identifying the country within which a coordinate
 * falls. The first-level identification tiles are loaded client-side, so most
 * of the time, no further request is necessary. But in cases where the coordinate
 * is close to an international boundary, additional levels of tiles, with more
 * detail,  are reqested from the specified host.
 */
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
 * Main view object for the extension popup.
 */
var MapLinksView = {

    /** Enumeration of the type of map service */
    category: {
        multidirns: 2,
        singledirns: 1,
        plain: 0
    },

    /** Number of direction segments in the source map data. */
    sourceDirnSegs: 0,

    /**
     * Returns the appropriate jquery selector for the given map service category, based
     * on the number of direction segments.
     */
    getSelector: function(category) {
        if (this.category.multidirns === category && this.sourceDirnSegs >= 2) {
            return "#multiSegDirns";
        } else if (this.category.multidirns === category && this.sourceDirnSegs === 1) {
            return "#singleSegDirns";
        } else if (this.category.singledirns === category && this.sourceDirnSegs > 0) {
            return "#singleSegDirns";
        } else {
            return "#noDirns";
        }
    },

    /**
     * Returns the section title for the given map service category, based
     * on the number of direction segments.
     */
    getTitle: function(category) {
        var title = "";
        if (this.sourceDirnSegs >= 2) {
            switch (category) {
                case this.category.multidirns:
                    title = "Directions, full";
                    break;
                case this.category.singledirns:
                    title = "Directions, single segment only";
                    break;
                default:
                    title = "Other Maps";
                    break;
            }
        } else if (this.sourceDirnSegs === 1) {
            switch (category) {
                case this.category.multidirns:
                case this.category.singledirns:
                    title = "Directions";
                    break;
                default:
                    title = "Other Maps";
                    break;
            }
        } else {
            title = "Map Services";
        }
        return title;
    },

    /**
     * Adds links to a map service to a particular category
     *
     * @param {category} Category in which to add this map service
     * @param {mapService} Object containing data about the particular map service.
     * @param {mapLinks} All the map links to be added.
     * @param {note} Content for an optional explanatory note.
     */
    addMapServiceLinks: function(category, mapService, mapLinks, note) {
        var selector = this.getSelector(category);

        if (0 == $(selector).children().length) {
            $(selector).append("<h4>" + this.getTitle(category) + "</h4>");
        }

        $(selector).append(this.buildLineOfLinks(mapService.id,
                                                   mapService,
                                                   mapLinks,
                                                   note));
        $(selector).sortDivs();

        if (note && note.length) {
            $(".linknote").tipsy({gravity: 's', opacity: 1, fade: true});
        }
    },

    /**
     * Adds links for file downloads (such as GPX)
     *
     * @param {mapService} Object containing data about the particular map service.
     * @param {note} Content for an optional explanatory note.
     */
    addFileDownload: function(mapService, id, name, fileGenerator, note) {

        //only add the title once
        if ($("#downloads").text().length === 0) {
            $("#downloads").append("<h4>Downloads</h4>");
        }

        html =  "<div id='" + mapService.id + "' class='serviceLine' data-sort='" + mapService.prio + "'>" +
                "<span class=\"linkLineImg\"><img src=\"../image/" + mapService.image + "\"></span> " +
                "<span class=\"serviceName\">" + mapService.site + "</span> ";
        html += "<a href='#' class=\"maplink\" id='" + id + "'>" + name + "</a>"
        html += "</div>";

        $("#downloads").append(html);

        $("#" + id).click(function() {
            var fileData = fileGenerator();
            var filename = fileData.name;
            var contentBlob = new Blob([fileData.content], {type: fileData.type});
            var gpxURL = URL.createObjectURL(contentBlob);
            chrome.downloads.download({
                url: gpxURL,
                filename: filename
            });
        });

        if (note && note.length) {
            $(".linknote").tipsy({gravity: 's', opacity: 1, fade: true});
        }
    },

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
    buildLineOfLinks: function (id, mapSite, links, note) {
        var html = "";
        if (links) {
                html =
                "<div id='" + id + "' class='serviceLine' data-sort='" + mapSite.prio + "'>" +
                "<span class=\"linkLineImg\"><img src=\"../image/" + mapSite.image + "\"></span> " +
                "<span class=\"serviceName\">" + mapSite.site + "</span> ";
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

}





var MapSwitcher = {

    /**
    * Checks the object containing extracted data returned by the content script.
    *
    * @param {object} extractedData - Data object extracted by the dataExtractor.
    * @return Promise which resolves if the data validates, or rejects if not.
    */
    validateExtractedData: function(extractedData) {
        return new Promise(function(resolve, reject) {
            if (extractedData && extractedData[0] && (extractedData[0].centreCoords != null)) {
                resolve(extractedData);
            } else {
                reject(extractedData);
            }
        });
    },

    /**
    * Gets the two letter country code for the current location of the map shown
    * in the current tab. If the country code can be found, it is stored in the
    * extracted data object passed as argument.
    *
    * @param {object} extractedData - Data object extracted by the dataExtractor.
    * @return Promise which resolves on success with the extracted data object.
    */
    getCountryCode: function(extractedData) {
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
    },

    /**
    * Handles cases where no coordinates are available from the page, or another problem
    * has occured.
    *
    * @param {object} sourceMapData - Data object extracted by the dataExtractor.
    */
    handleNoCoords: function(sourceMapData) {
        $("#nomap").show();
        $("#maplinkbox").hide();
    },

    /**
    * Main method of the map switcher popup.
    *
    * Only run once the dataExtractor has been executed on the current tab.
    * Iterates throught the map services to request them to generate their links.
    *
    * @param sourceMapData
    */
    run: function(sourceMapData) {
        if (sourceMapData.directions && sourceMapData.directions.route) {
            MapLinksView.sourceDirnSegs = sourceMapData.directions.route.length - 1;
        }

        for (outputMapService of outputMapServices) {
            (function(outputMapService) { //dummy immediately executed fn to save variables

                mapOptDefaults = {}
                mapOptDefaults[outputMapService.id] = true;

                chrome.storage.sync.get(mapOptDefaults, function(options) {
                    if (options[outputMapService.id]) {
                        outputMapService.generate(sourceMapData, MapLinksView);
                    }
                });
            })(outputMapService);
        }
    },

    /**
    * Hide the animated loading dots.
    */
    loaded: function(s) {
        $(".loading").hide();
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
        .then(s => MapSwitcher.validateExtractedData(s.result[2]))
        .then(s => MapSwitcher.getCountryCode(s))
        .then(s => MapSwitcher.run(s[0])) //pass the result of the dataExtractor script
        .then(s => MapSwitcher.loaded(s))
        .catch(s => (MapSwitcher.handleNoCoords(s)));
});

