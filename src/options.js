/* global
  browser, chrome, confirm,
  XPathResult,
  Sortable,
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
 * Sorts elements under the element identified by the given selector,
 * based on the ascending numeric value of their "data-sort" attribute.
 *
 * Elements with no such attribute specified are placed at the end of the list in
 * arbitrary order.
 */
function sortChildren (xpathSelector) {
  const parent = document.evaluate(xpathSelector,
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  [...parent.children]
    .sort((a, b) => +a.getAttribute('data-sort') > +b.getAttribute('data-sort') ? 1 : -1)
    .map(node => parent.appendChild(node))
}

function updateSelectAllNone () {
  // update all the 'select all/none' checkboxes
  Array.from(document.getElementsByClassName('selectAllNone')).forEach(chkBox => {
    const targetListElem = document.getElementById(chkBox.getAttribute('cat'))
    const services = targetListElem.getElementsByClassName('outpServiceEnabledChk')
    const servicesOn = Array.from(services).filter(serviceChkBox => {
      return serviceChkBox.checked
    }).length
    targetListElem.getElementsByClassName('selectAllNone')[0].checked =
      (servicesOn === services.length)
  })
}

Array.from(document.getElementsByClassName('selectAllNone')).forEach(selectAllChkBox => {
  selectAllChkBox.addEventListener('change', ev => {
    const targetList = ev.target.getAttribute('cat')
    document.querySelectorAll('#' + targetList + ' .chkboxcell .outpServiceEnabledChk').forEach(chkBox => {
      chkBox.checked = ev.target.checked
    })
    saveOptions()
  })
})

/**
 * Saves the extension options in browser storage.
 */
function saveOptions () {
  document.getElementById('status').textContent = 'Saving...'
  let mapChecks = {}
  document.querySelectorAll('.srvTickList .outpServiceEnabledChk').forEach(chkBox => {
    mapChecks[chkBox.id] = chkBox.checked
  })
  browser.storage.local.set(mapChecks, function () {
    setTimeout(function () {
      document.getElementById('status').textContent = 'Options saved.'
    }, 1000)
  })
}

/**
 * Loads the extension options from browser storage.
 */
function restoreOptions () {
  let mapEnabledDefaults = {}
  let prioDefaults = {}
  let listName
  document.getElementById('mapsTickList').getElementsByTagName('tbody')[0].innerText = ''
  document.getElementById('utilsTickList').getElementsByTagName('tbody')[0].innerText = ''
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
      '<td class="dragcell">' +
        '<svg viewBox="0 0 512 512">' +
          '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#bars"></use>' +
        '</svg>' +
      '</td>' +
      '<label for"' + outputMapService.id + "\"><td class='imgcell'><img src=\"../image/" + outputMapService.image + '"></td>' + "<td class='mapnamecell'>" + outputMapService.site + '</td></label>' +
      "<td class='chkboxcell'><input type=\"checkbox\" class='outpServiceEnabledChk' id=\"" + outputMapService.id +
      '" cat="' + listName + '" /></td>' + '</tr>'
    document.getElementById(listName).getElementsByTagName('tbody')[0].insertAdjacentText('beforeend', mapEntry)

    mapEnabledDefaults[outputMapService.id] = true
    prioDefaults['prio/' + outputMapService.id] =
            (outputMapService.prio !== undefined) ? outputMapService.prio : 999
  }
  browser.storage.local.get(mapEnabledDefaults, function (items) {
    document.querySelectorAll('.srvTickList .outpServiceEnabledChk').forEach(chkBox => {
      chkBox.checked = items[chkBox.id]
    })

    updateSelectAllNone()
  })

  document.querySelectorAll('.srvTickList .outpServiceEnabledChk').forEach(chkBox => {
    chkBox.addEventListener('change', updateSelectAllNone)
  })

  browser.storage.local.get(prioDefaults, function (prio) {
    // iterate through all rows; look up new prio, set data-sort attrib on tr
    document.querySelectorAll('.srvTickList tr.omsrvRow').forEach(row => {
      let id = row.querySelector('td.chkboxcell input').id
      row.setAttribute('data-sort', prio['prio/' + id])
    })

    sortChildren('//*[@id="mapsTickList"]//tbody')
    sortChildren('//*[@id="utilsTickList"]//tbody')
  })

  Array.from(document.getElementsByClassName('outpServiceEnabledChk')).forEach(elem => {
    elem.addEventListener('change', saveOptions)
  })
}

function resetToDefaults () {
  const result = confirm('Reset all options to initial defaults?')
  if (result) {
    browser.storage.local.clear()
    restoreOptions()
    document.getElementById('status').textContent = 'Default options restored.'
  }
}

function optionsSorted (event, ui) {
  document.getElementById('status').textContent = 'Saving...'
  let mapPriorities = {}
  let newPriority = 1
  document.querySelectorAll('tr.omsrvRow').forEach(rowElem => {
    let id = rowElem.querySelector('td.chkboxcell input').id
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
      document.getElementById('status').textContent = 'Options saved.'
    }, 1000)
  })
}

function optionsLoaded () {
  restoreOptions()

  const sortableContainers = document.getElementsByClassName('sortable')
  Array.from(sortableContainers).map((container) => {
    Sortable.create(container, {
      animation: 150,
      handle: '.dragcell',
      chosenClass: 'sortableChosen',
      ghostClass: 'sortableGhost',
      onEnd: optionsSorted
    })
  })
}

if (
  document.readyState === 'complete' ||
    (document.readyState !== 'loading' && !document.documentElement.doScroll)
) {
  optionsLoaded()
} else {
  document.addEventListener('DOMContentLoaded', optionsLoaded)
}

document.getElementById('reset').addEventListener('click', resetToDefaults)
