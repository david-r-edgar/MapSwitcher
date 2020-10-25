/* global
  globalThis,
  Blob,
  tippy */

import OutputMaps from './outputMaps.js'

let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

// An instance of this class is the main view object for the extension popup.
class MapLinksView {
  constructor (config) {
    this.config = config
  }

  // Main view display routine
  // - first set up anything that doesn't depend on the source data
  //   - set up the tabs, categories and service placeholders (based on the config)
  //   - set up the per-tab description lines
  // - get the general info about the source data, and then this for each tab
  // - show warning modal if necessary
  // - construct output lines of links for each output service
  // - work out what the first tab is, and set it to be initially active
  // - set up the click handlers etc. to make tab switching work
  // - hide the animated loading dots
  //
  // FIXME review what actually needs to be async / await here
  async display (sourceMapData) {
    this.tabCatSvcSetup()
    this.setupTabSourceDescr()
    const sourceMapDataInfo = sourceMapData.getSourceInfo()
    this.showInfo(sourceMapDataInfo)
    this.showWarnings(sourceMapData)
    this.constructOutputs(sourceMapData)
    const sourceDataType = sourceMapData.determineSourceDataType()
    this.prepareTabs(sourceDataType)
    this.tabSetup()
    await this.loaded()
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

  getCatIdFromName (name, tabName) {
    return this.getIdFromName(name) + '_' + this.getIdFromName(tabName) + '_cat'
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

  createEmptyCat (cat, tabElem, tab) {
    const catId = this.getCatIdFromName(cat, tab)
    const catHTML = `<div class="maplinkcat" id="${catId}"><h4>${cat}</h4></div>`
    const maplinkbox = tabElem.getElementsByClassName('maplinkbox')[0]
    maplinkbox.innerHTML += catHTML
  }

  createPlaceholderService (service, catElem) {
    const serviceId = this.getServiceIdFromName(service)
    const placeholderServiceLine = `<div id="${serviceId}" class="serviceLine"/>`
    catElem.innerHTML += placeholderServiceLine
  }

  // creates DOM elements for tabs, categories and services
  tabCatSvcSetup () {
    const view = this
    this.config.getHierarchicalMap().forEach((catSvcMap, tab) => {
      view.createEmptyTab(tab)
      const tabId = this.getTabPaneIdFromName(tab)
      const tabElem = document.getElementById(tabId)
      catSvcMap.forEach((svcMap, cat) => {
        view.createEmptyCat(cat, tabElem, tab)
        const catId = this.getCatIdFromName(cat, tab)
        const catElem = document.getElementById(catId)
        svcMap.forEach((settings, service) => {
          if (!settings.hidden) {
            view.createPlaceholderService(service, catElem)
          }
        })
      })
    })
  }

  setupTabSourceDescr () {
    const directionsTabs = this.config.getDirectionsTabs()
    const regularMappingTabs = this.config.getRegularMappingTabs()

    this.config.getHierarchicalMap().forEach((_, tab) => {
      const tabId = this.getTabPaneIdFromName(tab)
      const tabSourceDescr = document.querySelector('#' + tabId + ' .sourceDescr')
      if (regularMappingTabs.includes(tab)) {
        tabSourceDescr.innerHTML += '<div class="descrItem"><span class="lbl">Location:</span> &nbsp; <span class="descrVal sourceLocnVal"></span></div>' +
          '<div class="descrItem"><span class="lbl">Extracted from:</span> &nbsp; <span class="descrVal sourceExtrFromVal"></span></div>'
      }
      if (directionsTabs.includes(tab)) {
        tabSourceDescr.innerHTML += '<div class="descrItem"><span class="descrVal directionsDescr"></span></div>'
      }
    })
  }

  prepareTabs (tabType) {
    const tab = tabType === 'directions' ? this.config.getDirectionsTabs()[0] : this.config.getRegularMappingTabs()[0]

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
    const catId = this.getCatIdFromName(category, tab)
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
  // @param {mapService} Object containing data about the particular map service.
  // @param {mapLinks} All the map links to be added.
  // @param {note} Content for an optional explanatory note.
  addMapServiceLinks (mapService, mapLinks, note) {
    const serviceConfig = this.config.getConfigForService(mapService.id)

    // don't show links if user options hides it
    // FIXME can we avoid calling the OutputMaps generator in the first place for hidden services?
    if (serviceConfig.hidden) {
      return
    }

    const siteName = serviceConfig.name
    const imageFilename = serviceConfig.image

    const newServiceLine = this.buildLineOfLinks(siteName, imageFilename, mapLinks, note)
    this.insertServiceLineIntoCategory(mapService.id, newServiceLine)

    if (note && note.length) {
      tippy('.linknote', {
        content: note
      })
    }

    this.showCatAndTab(serviceConfig.cat, serviceConfig.tab)
  }

  addUtility (mapService, id, name) {
    const serviceId = this.getServiceIdFromName(mapService.id) // FIXME why are we using the id as a name?
    const serviceElem = document.getElementById(serviceId)

    if (serviceElem.innerText.length === 0) {
      serviceElem.insertAdjacentHTML('beforeend', `<span id='${mapService.id}'>` +
        `<span class="linkLineImg"><img src="../image/${mapService.image}"></span> ` +
        `<span class="serviceName">${mapService.site}</span></span>`)
    }

    const linkHtml = `<a href='#' class='maplink' id='${id}'>${name}</a>`
    serviceElem.innerHTML += linkHtml

    const settingsForService = this.config.getServicesMap().get(mapService.id)
    this.showCatAndTab(settingsForService.cat, settingsForService.tab)
  }

  // Adds links for file downloads (such as GPX)
  //
  // @param {mapService} Object containing data about the particular map service.
  // @param {id} Identifying string for this link.
  // @param {name} Display name for the link.
  // @param {fileGenerator} Function to invoke to create the file contents.
  addFileDownload (mapService, id, name, fileGenerator) {
    const serviceConfig = this.config.getConfigForService(mapService.id)
    // don't show links if user options hides the service
    if (serviceConfig.hidden) {
      return
    }

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
    const serviceConfig = this.config.getConfigForService(mapService.id)
    // don't show links if user options hides the service
    if (serviceConfig.hidden) {
      return
    }

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
  buildLineOfLinks (serviceName, imageFilename, links, note) {
    let html = ''
    if (links) {
      html =
        `<span class="linkLineImg"><img src="../image/${imageFilename}"></span> ` +
        `<span class="serviceName">${serviceName}</span> `
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

  displayNonUpdatingWarning (warning) {
  // display modal with warning for non-updating sources
    var modal = document.getElementById('warningModal')
    modal.style.display = 'block'

    document.getElementById('nonUpdatingHost').textContent = warning

    const close = document.getElementsByClassName('modalClose')[0]

    close.onclick = function () {
      modal.style.display = 'none'
    }
    modal.onclick = function (event) {
      if (event.target === modal) {
        modal.style.display = 'none'
      }
    }
  }

  showInfo (sourceMapDataInfo) {
    // set source coords and description
    Array.from(document.getElementsByClassName('sourceLocnVal')).map(elem => {
      elem.textContent =
      Number(sourceMapDataInfo.centreCoords.lat).toFixed(7) + ', ' +
      Number(sourceMapDataInfo.centreCoords.lng).toFixed(7)
    })
    Array.from(document.getElementsByClassName('sourceExtrFromVal')).map(elem => {
      if (undefined === sourceMapDataInfo.locationDescr) {
        elem.textContent = 'currently displayed map'
      } else {
        elem.textContent = sourceMapDataInfo.locationDescr
      }
    })

    // show directions category; set directions description
    if (sourceMapDataInfo.directions) {
      var dirnDescr = sourceMapDataInfo.directions.numWpts + ' waypoint route'
      const mode = (sourceMapDataInfo.directions.mode === 'transit')
        ? 'public transport'
        : sourceMapDataInfo.directions.mode
      dirnDescr += ', travelling by ' + mode
      Array.from(document.getElementsByClassName('directionsDescr')).map((elem) => {
        elem.textContent = dirnDescr
      })
    }
  }

  showWarnings (sourceMapData) {
    if (sourceMapData.nonUpdating !== undefined) {
      this.displayNonUpdatingWarning(sourceMapData.nonUpdating)
    }
  }

  // Iterates through the map services to request each one to generate its links.
  constructOutputs (sourceMapData) {
    for (const outputMapService of OutputMaps.services) {
      outputMapService.generate(sourceMapData, this)
    }
  }

  // Hide the animated loading dots.
  loaded () {
    const loadingElem = document.getElementsByClassName('loading')[0]
    loadingElem.style.display = 'none'
    const mainTabBox = document.getElementById('mainBorderBox')
    mainTabBox.style.display = 'inline-block'
    const nomapbox = document.getElementById('nomapbox')
    nomapbox.style.display = 'none'
  }

  // Handles cases where no coordinates are available from the page, or another problem
  // has occured.
  static handleNoCoords () {
    const loadingElem = document.getElementsByClassName('loading')[0]
    loadingElem.style.display = 'none'
    const nomapElem = document.getElementById('nomap')
    nomapElem.style.display = 'block'
    const maplinkboxElem = document.getElementById('tabContainer')
    maplinkboxElem.style.display = 'none'
  }
}

export default MapLinksView
