/* global
  confirm,
  Sortable */

import { ConfigManager, ServiceConfig } from './config.js'

class Options {
  static loadOptions () {
    const options = new Options()
    options.build()
  }

  async build () {
    this.configManager = await ConfigManager.create()
    await this.configManager.getServiceConfig().loadUserSettings()
    const tabCatSvcMap = this.configManager.getServiceConfig().getHierarchicalMap(true)
    this.insertResetButton()
    this.tabCatSvcSetup(tabCatSvcMap)
    this.updateEnabledOrDisabled()
    this.makeSortable('sortableTabContainer', 'tabs')
    this.makeSortable('sortableCategoryContainer', 'categories')
    this.makeSortable('sortableServiceContainer', 'services')
  }

  isValidNameCharacter (character, index) {
    const re = /[^"\\<>]/
    return re.test(character)
  }

  createEmptyTab (tab) {
    const tabHTML =
      `<div class=optionsTab data-tab-name="${tab}">` +
        '<div class=tabHeader>' +
          '<span class="dragcell">' +
            Options.dragBarsSVG +
          '</span>' +
          `<h3 class='tabTitle' contenteditable>${tab}</h3>` +
        '</div>' +
        '<div class="sortableCategoryContainer categoryContainer">' +
          '<div class=newCatButton><a href="#0" title="Add a new category">+</a></div>' +
        '</div>' +
      '</div>'
    const tabCatSrvContainer = document.getElementById('tabCatSrvContainer')
    tabCatSrvContainer.insertAdjacentHTML('beforeend', tabHTML)
  }

  createEmptyCat (cat, tabElem) {
    const catHTML =
      `<table class=srvTickList data-cat-name="${cat}">` +
        '<thead>' +
          '<th class="dragcell">' +
            Options.dragBarsSVG +
          '</th>' +
          `<th colspan=3 class='catTitle' contenteditable>${cat}</th>` +
        '</thead>' +
        '<tbody class="sortableServiceContainer">' +
        '</tbody>' +
      '</table>'
    const tabNewCatButton = tabElem.getElementsByClassName('newCatButton')[0]
    tabNewCatButton.insertAdjacentHTML('beforebegin', catHTML)
  }

  createService (service, catBody, configForService) {
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
          `<input type=checkbox class=outpServiceEnabledChk title="Show or hide this service" ${checked} id="${service}" />` +
        '</td>' +
      '</tr>'

    catBody.insertAdjacentHTML('beforeend', serviceHTML)
  }

  setServiceEnabledOrDisabled (svcId, enabled) {
    const svcElems = document.querySelectorAll(`label[for="${svcId}"]`)
    svcElems.forEach(svcElem => {
      if (enabled) {
        svcElem.classList.remove('noActiveServices')
      } else {
        svcElem.classList.add('noActiveServices')
      }
    })
  }

  updateEnabledOrDisabled (ev) {
    const tabCatSvcMap = this.configManager.getServiceConfig().getHierarchicalMap(true)

    tabCatSvcMap.forEach((catSvcMap, tab) => {
      const tabElem = document.querySelector(`div[data-tab-name="${tab}"]`)
      const tabServices = tabElem.querySelectorAll('.outpServiceEnabledChk:checked')
      if (tabServices.length) {
        tabElem.classList.remove('noActiveServices')
      } else {
        tabElem.classList.add('noActiveServices')
      }

      catSvcMap.forEach((svcMap, cat) => {
        const catElem = tabElem.querySelector(`table[data-cat-name="${cat}"]`)
        if (catElem) {
          const catServices = catElem.querySelectorAll('.outpServiceEnabledChk:checked')
          if (catServices.length) {
            catElem.classList.remove('noActiveServices')
          } else {
            catElem.classList.add('noActiveServices')
          }
        }

        // initialise services on load / drag etc.
        svcMap.forEach((settings, svc) => {
          this.setServiceEnabledOrDisabled(svc, !settings.hidden)
        })
      })
    })

    // handle services which have just been checked/unchecked
    if (ev && ev.target) {
      this.setServiceEnabledOrDisabled(ev.target.id, ev.target.checked)
    }
  }

  buildNewCatName (tab, prefix) {
    const catsInThisTab = []
    tab.querySelectorAll('.srvTickList').forEach(catElem => {
      catsInThisTab.push(catElem.attributes['data-cat-name'].value)
    })
    let suffix = 1
    let proposedCatName
    do {
      proposedCatName = `${prefix}-${suffix}`
      suffix++
    } while (catsInThisTab.includes(proposedCatName))
    return proposedCatName
  }

  userAddNewCat (ev) {
    const tabElem = ev.srcElement.closest('.optionsTab')
    const newCatName = this.buildNewCatName(tabElem, 'new-category')
    this.createEmptyCat(newCatName, tabElem.querySelector('.categoryContainer'))
    this.makeSortable('sortableServiceContainer', 'services')
    this.saveOptions()
    const catElem = tabElem.querySelector(`.srvTickList[data-cat-name="${newCatName}"]`)
    this.setupEventListenersForCat(catElem)
  }

  setupEventListenersForCat (cat) {
    // to edit the contenteditable category name
    cat.querySelector('.catTitle').addEventListener('beforeinput', ev => {
      if (!this.isValidNameCharacter(ev.data, document.getSelection().baseOffset)) {
        ev.preventDefault()
      }
    })
    cat.querySelector('.catTitle').addEventListener('input', ev => {
      const nameToBeSet = ev.target.textContent
      ev.target.closest('.srvTickList').attributes['data-cat-name'].value = nameToBeSet
      this.saveOptions()
    })

    // handle enabled/disabled checkbox toggle for each individual service
    cat.querySelectorAll('.outpServiceEnabledChk').forEach(chkBox => {
      chkBox.addEventListener('change', ev => {
        this.updateEnabledOrDisabled(ev)
        this.saveOptions()
      })
    })
  }

  setupEventListenersForTab (tab) {
    // to add a new category on user request
    tab.querySelector('.newCatButton').addEventListener('click', (ev) => {
      this.userAddNewCat(ev)
    })
    // to edit the contenteditable tab name
    tab.querySelector('.tabTitle').addEventListener('beforeinput', ev => {
      if (!this.isValidNameCharacter(ev.data, document.getSelection().baseOffset)) {
        ev.preventDefault()
      }
    })
    tab.querySelector('.tabTitle').addEventListener('input', ev => {
      const nameToBeSet = ev.target.textContent
      ev.target.closest('.optionsTab').attributes['data-tab-name'].value = nameToBeSet
      this.saveOptions()
    })
  }

  setupAllEventListeners () {
    document.querySelectorAll('.optionsTab').forEach(tab => {
      this.setupEventListenersForTab(tab)
      tab.querySelectorAll('.srvTickList').forEach(catElem => {
        this.setupEventListenersForCat(catElem)
      })
    })
  }

  tabCatSvcSetup (tabCatSvcMap) {
    tabCatSvcMap.forEach((catSvcMap, tab) => {
      this.createEmptyTab(tab)
      const tabElem = document.querySelector(`div[data-tab-name="${tab}"] .categoryContainer`)
      catSvcMap.forEach((svcMap, cat) => {
        this.createEmptyCat(cat, tabElem)
        const catTable = tabElem.querySelector(`table[data-cat-name="${cat}"]`)
        const catBody = catTable.querySelector('tbody')
        svcMap.forEach((settings, service) => {
          const configForService = this.configManager.getServiceConfig().getConfigForService(service)
          this.createService(service, catBody, configForService)
        })
      })
    })
    this.setupAllEventListeners()
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

    // update the view in case there are newly enabled or disabled cats or tabs
    this.updateEnabledOrDisabled()
  }

  insertResetButton () {
    const optionsElem = document.getElementById('resetContainer')
    const buttonHTML =
      '<button id="reset">' +
        '<svg viewBox="0 0 512 512" >' +
          '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#undo"></use>' +
        '</svg>' +
        '&nbsp;Reset to defaults...' +
      '</button>'
    optionsElem.insertAdjacentHTML('beforeend', buttonHTML)
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
