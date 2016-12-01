/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if ("undefined" === typeof browser) {
    browser = chrome;
}


/**
 * Sorts elements matching the given selector inside the element this is called
 * on, based on the ascending numeric value of their "data-sort" attribute.
 *
 * Elements with no such attribute specified are placed at the end of the list in
 * arbitrary order.
 */
jQuery.fn.sortElems = function sortElems(sel) {
    $(sel, this[0]).sort(dec_sort).appendTo(this[0]);
    function dec_sort(a, b){
        if ('undefined' === $(a).data("sort")) { return 1; }
        if ('undefined' === $(b).data("sort")) { return -1; }
        return ($(b).data("sort")) < ($(a).data("sort")) ? 1 : -1; }
}


function updateSelectAllNone() {
    var totalServices = $("#mapsTickList .outpServiceEnabledChk").length;
    var servicesOn = $("#mapsTickList .outpServiceEnabledChk").filter(function( index ) {
        return $(this).prop("checked");
    }).length;
    if (servicesOn == totalServices) {
        $("#selectAllNone").prop("checked", true);
    } else {
        $("#selectAllNone").prop("checked", false);
    }
}

$("#selectAllNone").change(function(ev) {
    var checked = $("#selectAllNone").prop("checked");
    $(".chkboxcell .outpServiceEnabledChk").each(function() {
        $(this).prop("checked", checked);
    });
});


/**
 * Saves the extension options in browser storage.
 */
function save_options() {
    var mapChecks = {};
    $("#mapsTickList .outpServiceEnabledChk").each(function() {
        mapChecks[$(this).attr("id")] = $(this).is(":checked");
    });
    browser.storage.local.set(mapChecks, function() {
        $("#status").text("Options saved.");
        setTimeout(function() {
            $("#status").text("");
        }, 1500);
    });
}

/**
 * Loads the extension options from browser storage.
 */
function restore_options() {
    var mapEnabledDefaults = {};
    var prioDefaults = {};
    $("#mapsTickList tbody").html("");
    for (outputMapService of outputMapServices) {
        mapEntry =
            "<tr class=omsrvRow>" +
            "<td class=\"fa fa-bars dragcell\"></td>" +
            "<label for\"" + outputMapService.id + "\"><td class='imgcell'><img src=\"../image/" + outputMapService.image + "\"></td>"  + "<td class='mapnamecell'>" + outputMapService.site + "</td></label>" +
            "<td class='chkboxcell'><input type=\"checkbox\" class='outpServiceEnabledChk' id=\"" + outputMapService.id + "\" /></td>" +
            "</tr>";
            $("#mapsTickList tbody").append(mapEntry);
        mapEnabledDefaults[outputMapService.id] = true;
        prioDefaults["prio/" + outputMapService.id] =
            (outputMapService.prio !== undefined) ? outputMapService.prio : 999;
    }
    browser.storage.local.get(mapEnabledDefaults, function(items) {
        $("#mapsTickList .outpServiceEnabledChk").each(function() {
            $(this).prop("checked", items[$(this).attr("id")]);
        });
        updateSelectAllNone();
    });
    $("#mapsTickList .outpServiceEnabledChk").change(updateSelectAllNone);

    browser.storage.local.get(prioDefaults, function(prio) {
        //iterate through all rows; look up new prio, set data-sort attrib on tr
        $("#mapsTickList tr.omsrvRow").each(function(){
            var row = $(this);
            var id = $(row).find("td.chkboxcell input").attr("id");
            $(this).attr("data-sort", prio["prio/" + id]);
        });

        $("#mapsTickList").sortElems("> tbody > tr.omsrvRow");
    });
}

function optionsSorted(event, ui) {
    var mapPriorities = {};
    var newPriority = 1;
    $("tr.omsrvRow").each(function() {
        var row = $(this);
        var id = $(row).find("td.chkboxcell input").attr("id");
        for (outputMapService of outputMapServices) {
            if (outputMapService.id === id) {
                //outputMapService.prio = newPriority;
                mapPriorities["prio/" + id] = newPriority;
                break;
            }
        }
        newPriority++;
    });

    browser.storage.local.set(mapPriorities, function() {
    });
}


$(document).ready(function() {
    restore_options();
    $( "#sortable" ).sortable({
        stop: optionsSorted
    });
});
$("#cancel").click(restore_options);
document.getElementById("save").addEventListener("click", save_options);
