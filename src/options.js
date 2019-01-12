/* global
  browser, chrome, confirm,
  jQuery, $,
  OutputMaps */

/**
 * The Web Extension API is implemented on different root objects in different browsers.
 * Firefox uses 'browser'. Chrome uses 'chrome'.
 * Checking here allows us to use a common 'browser' everywhere.
 */
if (typeof browser === 'undefined') {
  browser = chrome // eslint-disable-line no-global-assign
}

/**
 * Sorts elements matching the given selector inside the element this is called
 * on, based on the ascending numeric value of their "data-sort" attribute.
 *
 * Elements with no such attribute specified are placed at the end of the list in
 * arbitrary order.
 */
jQuery.fn.sortElems = function sortElems (sel) {
  $(sel, this[0]).sort(decSort).appendTo(this[0])
  function decSort (a, b) {
    if ($(a).data('sort') === 'undefined') { return 1 }
    if ($(b).data('sort') === 'undefined') { return -1 }
    return ($(b).data('sort')) < ($(a).data('sort')) ? 1 : -1
  }
}

function updateSelectAllNone () {
  // update all the 'select all/none' checkboxes
  $('.selectAllNone').each(function () {
    var targetList = $(this).attr('cat')
    var totalServices = $('#' + targetList + ' .outpServiceEnabledChk').length
    var servicesOn = $('#' + targetList + ' .outpServiceEnabledChk').filter(function () {
      return $(this).prop('checked')
    }).length
    if (servicesOn === totalServices) {
      $('#' + targetList + ' .selectAllNone').prop('checked', true)
    } else {
      $('#' + targetList + ' .selectAllNone').prop('checked', false)
    }
  })
}

$('.selectAllNone').change(function (ev) {
  var checked = $(ev.target).prop('checked')
  var targetList = $(ev.target).attr('cat')
  $('#' + targetList + ' .chkboxcell .outpServiceEnabledChk').each(function () {
    $(this).prop('checked', checked)
  })
  saveOptions()
})

/**
 * Saves the extension options in browser storage.
 */
function saveOptions () {
  $('#status').text('Saving...')
  var mapChecks = {}
  $('.srvTickList .outpServiceEnabledChk').each(function () {
    mapChecks[$(this).attr('id')] = $(this).is(':checked')
  })
  browser.storage.local.set(mapChecks, function () {
    setTimeout(function () {
      $('#status').text('Options saved.')
    }, 1000)
  })
}

/**
 * Loads the extension options from browser storage.
 */
function restoreOptions () {
  var mapEnabledDefaults = {}
  var prioDefaults = {}
  let listName
  $('#mapsTickList tbody').html('')
  $('#utilsTickList tbody').html('')
  for (let outputMapService of OutputMaps.services) {
    switch (outputMapService.cat) {
      case OutputMaps.category.utility:
      case OutputMaps.category.download:
        listName = 'utilsTickList'
        break
      default:
        listName = 'mapsTickList'
        break
    }

    const mapEntry =
      '<tr class=omsrvRow>' +
      '<td class="fa fa-bars dragcell"></td>' +
      '<label for"' + outputMapService.id + "\"><td class='imgcell'><img src=\"../image/" + outputMapService.image + '"></td>' + "<td class='mapnamecell'>" + outputMapService.site + '</td></label>' +
      "<td class='chkboxcell'><input type=\"checkbox\" class='outpServiceEnabledChk' id=\"" + outputMapService.id +
      '" cat="' + listName + '" /></td>' + '</tr>'
    $('#' + listName + ' tbody').append(mapEntry)

    mapEnabledDefaults[outputMapService.id] = true
    prioDefaults['prio/' + outputMapService.id] =
            (outputMapService.prio !== undefined) ? outputMapService.prio : 999
  }
  browser.storage.local.get(mapEnabledDefaults, function (items) {
    $('.srvTickList .outpServiceEnabledChk').each(function () {
      $(this).prop('checked', items[$(this).attr('id')])
    })
    updateSelectAllNone()
  })
  $('.srvTickList .outpServiceEnabledChk').change(updateSelectAllNone)

  browser.storage.local.get(prioDefaults, function (prio) {
    // iterate through all rows; look up new prio, set data-sort attrib on tr
    $('.srvTickList tr.omsrvRow').each(function () {
      var row = $(this)
      var id = $(row).find('td.chkboxcell input').attr('id')
      $(this).attr('data-sort', prio['prio/' + id])
    })

    $('#mapsTickList').sortElems('> tbody > tr.omsrvRow')
    $('#utilsTickList').sortElems('> tbody > tr.omsrvRow')
  })

  $('.outpServiceEnabledChk').change(saveOptions)
}

function resetToDefaults () {
  var result = confirm('Reset all options to initial defaults?')
  if (result) {
    browser.storage.local.clear()
    restoreOptions()
    $('#status').text('Default options restored.')
  }
}

function optionsSorted (event, ui) {
  $('#status').text('Saving...')
  var mapPriorities = {}
  var newPriority = 1
  $('tr.omsrvRow').each(function () {
    var row = $(this)
    var id = $(row).find('td.chkboxcell input').attr('id')
    for (let outputMapService of OutputMaps.services) {
      if (outputMapService.id === id) {
        // outputMapService.prio = newPriority;
        mapPriorities['prio/' + id] = newPriority
        break
      }
    }
    newPriority++
  })

  browser.storage.local.set(mapPriorities, function () {
    setTimeout(function () {
      $('#status').text('Options saved.')
    }, 1000)
  })
}

$(document).ready(function () {
  restoreOptions()
  $('.sortable').sortable({
    stop: optionsSorted
  })
})

$('#reset').click(resetToDefaults)
