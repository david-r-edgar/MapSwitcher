

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



function save_options() {
    var mapChecks = {};
    $("#mapsTickList .outpServiceEnabledChk").each(function() {
        mapChecks[$(this).attr("id")] = $(this).is(":checked");
    });
    chrome.storage.sync.set(mapChecks, function() {
        var status = document.getElementById("status");
        status.textContent = "Options saved.";
        setTimeout(function() {
            status.textContent = "";
        }, 1500);
    });
}

function restore_options() {
    var mapDefaults = {};
    for (outputMapService of outputMapServices) {
        mapEntry =
            "<tr>" +
            "<label for\"" + outputMapService.id + "\"><td class='imgcell'><img src=\"../image/" + outputMapService.image + "\"></td>"  + "<td class='mapnamecell'>" + outputMapService.site + "</td></label>" +
            "<td class='chkboxcell'><input type=\"checkbox\" class='outpServiceEnabledChk' id=\"" + outputMapService.id + "\" /></td>" +
            "</tr>";
            $("#mapsTickList").append(mapEntry);
        mapDefaults[outputMapService.id] = true;
    }
    chrome.storage.sync.get(mapDefaults, function(items) {
        $("#mapsTickList .outpServiceEnabledChk").each(function() {
            $(this).prop("checked", items[$(this).attr("id")]);
        });
        updateSelectAllNone();
    });
    $("#mapsTickList .outpServiceEnabledChk").change(updateSelectAllNone);
}
$(document).ready(restore_options);
document.getElementById("save").addEventListener("click", save_options);
