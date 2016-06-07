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
    for (outputMap of outputMaps) {
        mapEntry =
            "<li>" +
            "<label for\"" + outputMap.id + "\"><img src=\"image/" + outputMap.image + "\">"  + outputMap.site + "</label>" +
            "<input type=\"checkbox\" id=\"" + outputMap.id + "\" />" +
            "</li>";
            $("#mapsTickList").append(mapEntry);
        mapDefaults[outputMap.id] = true;
    }
    //$("#mapsTickList input").each(function() {
    //    mapDefaults[$(this).attr("id")] = true;
    //});
    chrome.storage.sync.get(mapDefaults, function(items) {
        $("#mapsTickList input").each(function() {
            $(this).prop('checked', items[$(this).attr("id")]);
        });
    });
}
$(document).ready(restore_options);
document.getElementById('save').addEventListener('click', save_options);
