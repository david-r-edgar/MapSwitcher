/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if ("undefined" === typeof browser) {
    browser = chrome;
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
    var mapDefaults = {};
    $("#mapsTickList tbody").html("");
    for (outputMapService of outputMapServices) {
        mapEntry =
            "<tr>" +
            "<label for\"" + outputMapService.id + "\"><td class='imgcell'><img src=\"../image/" + outputMapService.image + "\"></td>"  + "<td class='mapnamecell'>" + outputMapService.site + "</td></label>" +
            "<td class='chkboxcell'><input type=\"checkbox\" class='outpServiceEnabledChk' id=\"" + outputMapService.id + "\" /></td>" +
            "</tr>";
            $("#mapsTickList tbody").append(mapEntry);
        mapDefaults[outputMapService.id] = true;
    }
    browser.storage.local.get(mapDefaults, function(items) {
        $("#mapsTickList .outpServiceEnabledChk").each(function() {
            $(this).prop("checked", items[$(this).attr("id")]);
        });
        updateSelectAllNone();
    });
    $("#mapsTickList .outpServiceEnabledChk").change(updateSelectAllNone);
}
$(document).ready(restore_options);
$("#cancel").click(restore_options);
document.getElementById("save").addEventListener("click", save_options);
