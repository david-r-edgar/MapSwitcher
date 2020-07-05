/* global
  globalThis,
  confirm,
  Sortable */

import { ConfigManager, ServiceConfig } from './config.js'

// The Web Extension API is implemented on different root objects in different browsers.
// Firefox uses 'browser'. Chrome uses 'chrome'.
// Checking here allows us to use a common 'browser' everywhere.
let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

class Options {
  // FIXME is this fn common with mapLinksView?
  getIdFromName (name) {
    return name.replace(/[^a-zA-Z0-9]/g, '')
  }

  getTabIdFromName (name) {
    return this.getIdFromName(name) + '_tab'
  }

  // FIXME is this fn common with mapLinksView?
  getCatIdFromName (name, tabName) {
    return this.getIdFromName(name) + '_' + this.getIdFromName(tabName) + '_cat'
  }

  createEmptyTab (tab) {
    const tabId = this.getTabIdFromName(tab)
    const tabHTML =
      `<div id="${tabId}" class=optionsTab>` +
        '<div class=tabHeader>' +
          '<span class="dragcell">' +
            Options.dragBarsSVG +
          '</span>' +
          `<h3 class='tabTitle'>${tab}</h3>` +
        '</div>' +
        '<div class="sortableCategoryContainer categoryContainer"></div>' +
      '</div>'
    const tabCatSrvContainer = document.getElementById('tabCatSrvContainer')
    tabCatSrvContainer.innerHTML += tabHTML
  }

  createEmptyCat (cat, tab, tabElem) {
    const catId = this.getCatIdFromName(cat, tab)
    const catHTML =
      `<table id="${catId}" class=srvTickList>` +
        '<thead>' +
          '<th class="dragcell">' +
            Options.dragBarsSVG +
          '</th>' +
          `<th colspan=2 class='catTitle'>${cat}</th>` +
          `<th><input type="checkbox" id="${catId + '_selectAllNone'}" class=selectAllNone cat="${catId}"/> </th>` +
        '</thead>' +
        '<tbody class="sortableServiceContainer">' +
        '</tbody>' +
      '</table>'
    tabElem.innerHTML += catHTML
  }

  createService (service, catBody, catId, configForService) {
    const listName = catId

    // need to get image & site from OutputMaps
    const serviceImage = `../image/${configForService.image}`
    const directionsSuffix = configForService.type === 'directions' ? ' directions' : ''
    const siteName = configForService.name + directionsSuffix
    const checked = configForService.hidden ? '' : 'checked'

    const serviceHTML =
      '<tr class=omsrvRow>' +
        '<td class="dragcell">' +
          Options.dragBarsSVG +
        '</td>' +
        '<td class=imgcell>' +
          `<label for="${service}"><img src="${serviceImage}"></label>` +
        '</td>' +
        '<td class=mapnamecell>' +
          `<label for="${service}">${siteName}</label>` +
        '</td>' +
        '<td class=chkboxcell>' +
          `<input type=checkbox class=outpServiceEnabledChk ${checked} id="${service}" cat="${listName}" />` +
        '</td>' +
      '</tr>'

    catBody.innerHTML += serviceHTML
  }

  updateSelectAllNone () {
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

  setupEventListeners () {
    // handle change for each individual service (enabled checkbox)
    document.querySelectorAll('.srvTickList .outpServiceEnabledChk').forEach(chkBox => {
      chkBox.addEventListener('change', ev => {
        this.updateSelectAllNone()
        this.saveOptions()
      })
    })

    // handle change for category select all / select none checkbox
    Array.from(document.getElementsByClassName('selectAllNone')).forEach(selectAllChkBox => {
      selectAllChkBox.addEventListener('change', ev => {
        const targetList = ev.target.getAttribute('cat')
        document.querySelectorAll('#' + targetList + ' .chkboxcell .outpServiceEnabledChk').forEach(chkBox => {
          chkBox.checked = ev.target.checked
        })
        this.saveOptions()
      })
    })
  }

  tabCatSvcSetup (tabCatSvcMap) {
    tabCatSvcMap.forEach((catSvcMap, tab) => {
      this.createEmptyTab(tab)
      const tabId = this.getTabIdFromName(tab)
      const tabElem = document.querySelector(`#${tabId} .categoryContainer`)
      catSvcMap.forEach((svcMap, cat) => {
        this.createEmptyCat(cat, tab, tabElem)
        const catId = this.getCatIdFromName(cat, tab)
        const catTable = document.getElementById(catId)
        const catBody = catTable.querySelector('tbody')
        svcMap.forEach((settings, service) => {
          const configForService = this.configManager.getServiceConfig().getConfigForService(service)
          this.createService(service, catBody, catId, configForService)
        })
      })
    })
    this.setupEventListeners()
    this.updateSelectAllNone()
  }

  makeSortable (containerClassName, group) {
    const sortableContainers = document.getElementsByClassName(containerClassName)
    Array.from(sortableContainers).map((container) => {
      Sortable.create(container, {
        animation: 150,
        handle: '.dragcell',
        chosenClass: 'sortableChosen',
        ghostClass: 'sortableGhost',
        onEnd: () => { this.saveOptions() },
        group: group
      })
    })
  }

  async saveOptions () {
    document.getElementById('status').textContent = 'Saving...'

    // start new service config (doesn't yet replace old one)
    const newServiceConfig = await ServiceConfig.create()
    newServiceConfig.initialiseEmptyUserSettings()

    // iterate through tabs, categories and services in the order they're displayed
    document.querySelectorAll('.optionsTab').forEach(tabElem => {
      const tabTitle = tabElem.querySelector('.tabTitle').textContent

      tabElem.querySelectorAll('.srvTickList').forEach(catElem => {
        const catTitle = catElem.querySelector('.catTitle').textContent

        catElem.querySelectorAll('.outpServiceEnabledChk').forEach(svcElem => {
          const hidden = !svcElem.checked

          // for each service, call function to config to set
          newServiceConfig.setConfigForService(svcElem.id, { tab: tabTitle, cat: catTitle, hidden })
        })
      })
    })

    await this.configManager.setServiceConfig(newServiceConfig)

    // saving to local storage takes almost no time, so use a fake timeout for better UX
    setTimeout(function () {
      document.getElementById('status').textContent = 'Options saved.'
    }, 500)
  }

  insertResetButton () {
    const optionsElem = document.getElementById('resetContainer')
    const buttonHTML =
      '<button id="reset">' +
        '<svg viewBox="0 0 512 512" >' +
          '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#undo"></use>' +
        '</svg>' +
        'Reset to defaults...' +
      '</button>'
    optionsElem.innerHTML += buttonHTML
    document.getElementById('reset').addEventListener('click', () => { this.resetToDefaults() })
  }

  removeResetButton () {
    const resetButton = document.getElementById('reset')
    resetButton.remove()
  }

  // reset to defaults, if user confirms
  // - clear storage
  // - remove everything dynamic from the DOM we created on initial build
  // - reload (create a new options object and rebuild)
  async resetToDefaults () {
    const result = confirm('Reset all options to initial defaults?')
    if (result) {
      await this.configManager.getServiceConfig().clearUserSettings()
      const tabCatSrvContainer = document.getElementById('tabCatSrvContainer')
      tabCatSrvContainer.textContent = ''
      this.removeResetButton()
      Options.loadOptions()
      document.getElementById('status').textContent = 'Default options restored.'
    }
  }

  async build () {
    this.configManager = await ConfigManager.create()
    await this.configManager.getServiceConfig().loadUserSettings()
    const tabCatSvcMap = this.configManager.getServiceConfig().getHierarchicalMap(true)
    this.tabCatSvcSetup(tabCatSvcMap)
    this.makeSortable('sortableTabContainer', 'tabs')
    this.makeSortable('sortableCategoryContainer', 'categories')
    this.makeSortable('sortableServiceContainer', 'services')
    this.insertResetButton()
  }

  static loadOptions () {
    const options = new Options()
    options.build()
  }
}

Options.dragBarsSVG =
  '<svg viewBox="0 0 512 512">' +
    '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#bars"></use>' +
  '</svg>'

if (
  document.readyState === 'complete' ||
    (document.readyState !== 'loading' && !document.documentElement.doScroll)
) {
  Options.loadOptions()
} else {
  document.addEventListener('DOMContentLoaded', Options.loadOptions)
}
