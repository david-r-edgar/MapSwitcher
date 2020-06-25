/* global
  globalThis,
  Blob,
  tippy */

let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

// An instance of this class is the main view object for the extension popup.
class MapLinksView {
  constructor (tabCatSvcMap, settings, directionsTabs) {
    this.tabCatSvcMap = tabCatSvcMap
    this.settings = settings
    this.directionsTabs = directionsTabs
  }

  getIdFromName (name) {
    return name.replace(/[^a-zA-Z0-9]/g, '')
  }

  getTabPaneIdFromName (name) {
    return this.getIdFromName(name) + '_tabpane'
  }

  getTabTabIdFromName (name) {
    return this.getIdFromName(name) + '_tabtab'
  }

  getCatIdFromName (name) {
    return this.getIdFromName(name) + '_cat'
  }

  getServiceIdFromName (name) {
    return this.getIdFromName(name) + '_service'
  }

  createEmptyTab (tab) {
    const tabPaneId = this.getTabPaneIdFromName(tab)
    const tabTabId = this.getTabTabIdFromName(tab)

    // create the tab pane
    const tabPaneHTML = `<div id="${tabPaneId}" class="tab-pane"><div class=sourceDescr></div><div class=maplinkbox></div></div>`
    const tabPaneContainer = document.getElementById('tabPaneContainer')
    tabPaneContainer.innerHTML += tabPaneHTML

    // create the 'tab' itself
    const tabTabHTML = `<li id="${tabTabId}" class=""><a href="#${tabPaneId}">${tab}</a></li>`
    const tabTabContainer = document.getElementById('tabTabContainer')
    tabTabContainer.innerHTML += tabTabHTML
  }

  createEmptyCat (cat, tabElem) {
    const catId = this.getCatIdFromName(cat)
    const catHTML = `<div class="maplinkcat" id="${catId}"><h4>${cat}</h4></div>`
    const maplinkbox = tabElem.getElementsByClassName('maplinkbox')[0]
    maplinkbox.innerHTML += catHTML
  }

  createPlaceholderService (service, catElem) {
    const serviceId = this.getServiceIdFromName(service)
    const placeholderServiceLine = `<div id="${serviceId}" class="serviceLine"/>`
    catElem.innerHTML += placeholderServiceLine
  }

  tabCatSvcSetup () {
    const view = this
    this.tabCatSvcMap.forEach((catSvcMap, tab) => {
      // create tab
      view.createEmptyTab(tab)
      const tabId = this.getTabPaneIdFromName(tab)
      const tabElem = document.getElementById(tabId)
      catSvcMap.forEach((svcMap, cat) => {
        // create cat
        view.createEmptyCat(cat, tabElem)
        const catId = this.getCatIdFromName(cat)
        const catElem = document.getElementById(catId)
        svcMap.forEach((settings, service) => {
          // create service placeholder
          if (!settings.hidden) {
            view.createPlaceholderService(service, catElem)
          }
        })
      })
    })
  }

  setupTabSourceDescr () {
    this.tabCatSvcMap.forEach((_, tab) => {
      const tabId = this.getTabPaneIdFromName(tab)
      const tabSourceDescr = document.querySelector('#' + tabId + ' .sourceDescr')
      if (this.directionsTabs[tab]) {
        tabSourceDescr.innerHTML = '<div class="descrItem"><span class="descrVal directionsDescr"></span></div>'
      } else {
        tabSourceDescr.innerHTML = '<div class="descrItem"><span class="lbl">Location:</span> &nbsp; <span class="descrVal sourceLocnVal"></span></div>' +
          '<div class="descrItem"><span class="lbl">Extracted from:</span> &nbsp; <span class="descrVal sourceExtrFromVal"></span></div>'
      }
    })
  }

  // find the first tab with a service for directions, and the first tab with
  // a service for regular non-directions maps
  // FIXME surely there's a better way of doing this? maybe just iterate through settings?
  findFirstTabs () {
    this.firstTabs = {}
    for (let [tab, catList] of this.tabCatSvcMap) {
      for (let [, serviceList] of catList) {
        for (let [, settings] of serviceList) {
          if (!this.firstTabs.directions && settings.type === 'directions') {
            this.firstTabs.directions = tab
          }
          if (!this.firstTabs.regular && (!settings.type || !settings.type === 'directions')) {
            this.firstTabs.regular = tab
          }
          if (this.firstTabs.directions && this.firstTabs.regular) {
            return
          }
        }
      }
    }
  }

  prepareTabs (tabType) {
    this.findFirstTabs()
    const tab = this.firstTabs[tabType]
    const tabPaneId = this.getTabPaneIdFromName(tab)
    const tabTabId = this.getTabTabIdFromName(tab)

    const tabPane = document.getElementById(tabPaneId)
    tabPane.classList.add('active')

    const tabTab = document.getElementById(tabTabId)
    tabTab.classList.add('active')
  }

  // sets up click events etc. to enable tab functionality
  tabSetup () {
    const myTabs = document.querySelectorAll('ul.nav-tabs > li')
    function myTabClicks (tabClickEvent) {
      for (let i = 0; i < myTabs.length; i++) {
        myTabs[i].classList.remove('active')
      }
      const clickedTab = tabClickEvent.currentTarget
      clickedTab.classList.add('active')
      tabClickEvent.preventDefault()
      const myContentPanes = document.querySelectorAll('.tab-pane')
      for (let i = 0; i < myContentPanes.length; i++) {
        myContentPanes[i].classList.remove('active')
      }
      const anchorReference = tabClickEvent.target
      const activePaneId = anchorReference.getAttribute('href')
      const activePane = document.querySelector(activePaneId)
      activePane.classList.add('active')
    }
    for (let i = 0; i < myTabs.length; i++) {
      myTabs[i].addEventListener('click', myTabClicks)
    }
  }

  showCatAndTab (category, tab) {
    const catId = this.getCatIdFromName(category)
    const catElem = document.getElementById(catId)
    catElem.classList.add('inUse')

    const tabPaneId = this.getTabPaneIdFromName(tab)
    const tabPaneElem = document.getElementById(tabPaneId)
    tabPaneElem.classList.add('inUse')

    const tabTabId = this.getTabTabIdFromName(tab)
    const tabTabElem = document.getElementById(tabTabId)
    tabTabElem.classList.add('inUse')
  }

  insertServiceLineIntoCategory (service, serviceLineContents) {
    const serviceId = this.getServiceIdFromName(service)
    const serviceElem = document.getElementById(serviceId)
    if (serviceElem) {
      serviceElem.innerHTML += serviceLineContents
    }
  }

  // Adds links to a map service to a particular category
  //
  // @param {category} Category in which to add this map service.
  // @param {mapService} Object containing data about the particular map service.
  // @param {mapLinks} All the map links to be added.
  // @param {note} Content for an optional explanatory note.
  addMapServiceLinks (_, mapService, mapLinks, note) {
    const newServiceLine = this.buildLineOfLinks(mapService, mapLinks, note)
    this.insertServiceLineIntoCategory(mapService.id, newServiceLine)

    if (note && note.length) {
      tippy('.linknote', {
        content: note
      })
    }

    const settingsForService = this.settings.get(mapService.id)
    this.showCatAndTab(settingsForService.cat, settingsForService.tab)
  }

  addUtility (mapService, id, name) {
    const serviceId = this.getServiceIdFromName(mapService.id) // FIXME why are we using the id as a name?
    const serviceElem = document.getElementById(serviceId)

    if (serviceElem.innerText.length === 0) {
      serviceElem.insertAdjacentHTML('beforeend', `<span id='${mapService.id}` +
        `' data-sort='${mapService.prio}'>` +
        `<span class="linkLineImg"><img src="../image/${mapService.image}"></span> ` +
        `<span class="serviceName">${mapService.site}</span></span>`)
    }

    const linkHtml = `<a href='#' class='maplink' id='${id}'>${name}</a>`
    serviceElem.innerHTML += linkHtml

    const settingsForService = this.settings.get(mapService.id)
    this.showCatAndTab(settingsForService.cat, settingsForService.tab)
  }

  // Adds links for file downloads (such as GPX)
  //
  // @param {mapService} Object containing data about the particular map service.
  // @param {id} Identifying string for this link.
  // @param {name} Display name for the link.
  // @param {fileGenerator} Function to invoke to create the file contents.
  addFileDownload (mapService, id, name, fileGenerator) {
    this.addUtility(mapService, id, name)

    const idElem = document.getElementById(id)
    idElem.addEventListener('click', () => {
      const fileData = fileGenerator()
      const filename = fileData.name
      const contentBlob = new Blob([fileData.content], { type: fileData.type })
      const gpxURL = URL.createObjectURL(contentBlob)
      browser.downloads.download({
        url: gpxURL,
        filename: filename
      })
    })
  }

  addUtilityLink (mapService, id, name, utilFunction) {
    this.addUtility(mapService, id, name)

    const idElem = document.getElementById(id)
    idElem.addEventListener('click', utilFunction)
  }

  // Adds a note for a map service.
  //
  // @param {mapService} Object representing the map service.
  // @param {note} Text content of the note to be displayed.
  addNote (mapService, note) {
    if (note && note.length) {
      const mapServiceIdElem = document.getElementById(mapService.id)
      mapServiceIdElem.innerHTML += ' ' +
        "<span class=linknote title=''>" +
          '<svg viewBox="0 0 512 512">' +
            '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#sticky-note">' +
            '</use>' +
          '</svg>' +
        '</span>'
      tippy('.linknote', {
        content: note
      })
    }
  }

  // Utility function which builds the HTML for all the map links belonging to a specific
  // map service.
  //
  // @param {object} mapSite - the output object representing the map service
  // @param {object} links - the map links to add, containing URLs and names for each
  // @param {note} note - a note for this map service, if applicable
  // @return {string} the HTML for the line
  buildLineOfLinks (mapSite, links, note) {
    let html = ''
    if (links) {
      html =
        `<span class="linkLineImg"><img src="../image/${mapSite.image}"></span> ` +
        `<span class="serviceName">${mapSite.site}</span> `
      links.forEach(link => {
        html += `<a class="maplink" target="_blank" href="${link.url}">${link.name}</a> `
      })

      if (note && note.length) {
        html +=
        "<span class=linknote title=''>" +
          '<svg viewBox="0 0 512 512">' +
            '<use href="../vendor/font-awesome-5.8.2_stripped/icons.svg#sticky-note">' +
            '</use>' +
          '</svg>' +
        '</span>'
      }
    }
    return html
  }
}

export default MapLinksView
