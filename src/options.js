function save_options() {
    var mapChecks = {};
    $("#mapsTickList input").each(function() {
        mapChecks[$(this).attr("id")] = $(this).is(':checked');
    });
    chrome.storage.sync.set(mapChecks, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 1500);
    });
}

function restore_options() {
    var mapDefaults = {};
    for (outputMapService of outputMapServices) {
        mapEntry =
            "<tr>" +
            "<label for\"" + outputMapService.id + "\"><td class='imgcell'><img src=\"../image/" + outputMapService.image + "\"></td>"  + "<td class='mapnamecell'>" + outputMapService.site + "</td></label>" +
            "<td class='chkboxcell'><input type=\"checkbox\" id=\"" + outputMapService.id + "\" /></td>" +
            "</tr>";
            $("#mapsTickList").append(mapEntry);
        mapDefaults[outputMapService.id] = true;
    }
    chrome.storage.sync.get(mapDefaults, function(items) {
        $("#mapsTickList input").each(function() {
            $(this).prop('checked', items[$(this).attr("id")]);
        });
    });
}
$(document).ready(restore_options);
document.getElementById('save').addEventListener('click', save_options);
