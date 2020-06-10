/* global
  globalThis,
  Blob,
  tippy */

import OutputMaps from './outputMaps.js'

let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

const insertServiceLineIntoCategory = function (categoryElem, serviceLine, prio) {
  let lastNonMatchingElem
  for (let elem of categoryElem.children) {
    if (elem.getAttribute('data-sort') > prio) break
    lastNonMatchingElem = elem
  }
  lastNonMatchingElem.insertAdjacentHTML('afterend', serviceLine)
}

/**
 * Main view object for the extension popup.
 */
const MapLinksView = {

  /** Number of direction segments in the source map data. */
  sourceDirnSegs: 0,

  /**
     * Returns the appropriate jquery selector for the given map service category,
     * based on the number of direction segments.
     *
     * @param {category} OutputMaps category for which the selector is requested.
     */
  getSelector: function (category) {
    if (OutputMaps.category.multidirns === category && this.sourceDirnSegs >= 2) {
      return 'multiSegDirns'
    } else if (OutputMaps.category.multidirns === category && this.sourceDirnSegs === 1) {
      return 'singleSegDirns'
    } else if (OutputMaps.category.singledirns === category && this.sourceDirnSegs > 0) {
      return 'singleSegDirns'
    } else if (OutputMaps.category.misc === category) {
      return 'misc'
    } else if (OutputMaps.category.special === category) {
      return 'special'
    } else {
      return 'noDirns'
    }
  },

  /**
     * Returns the section title for the given map service category, based
     * on the number of direction segments.
     *
     * @param {category} OutputMaps category for which the title is requested.
     */
  getTitle: function (category) {
    let title = ''
    switch (category) {
      case OutputMaps.category.multidirns:
        if (this.sourceDirnSegs >= 2) {
          title = 'Directions, full'
        } else {
          title = 'Directions'
        }
        break
      case OutputMaps.category.singledirns:
        if (this.sourceDirnSegs >= 2) {
          title = 'Directions, single segment only'
        } else {
          title = 'Directions'
        }
        break
      case OutputMaps.category.misc:
        title = 'Miscellaneous'
        break
      case OutputMaps.category.special:
        title = 'Special'
        break
      default:
        if (this.sourceDirnSegs >= 1) {
          title = 'Other Maps'
        } else {
          title = 'Map Services'
        }
        break
    }
    return title
  },

  /**
     * Adds links to a map service to a particular category
     *
     * @param {category} Category in which to add this map service.
     * @param {mapService} Object containing data about the particular map service.
     * @param {mapLinks} All the map links to be added.
     * @param {note} Content for an optional explanatory note.
     */
  addMapServiceLinks: function (category, mapService, mapLinks, note) {
    const thisView = this
    const selector = this.getSelector(category)
    const categoryElem = document.getElementById(selector)

    if (categoryElem.children.length === 0) {
      const title = document.createElement('h4')
      title.innerText = this.getTitle(category)
      categoryElem.appendChild(title)
    }

    let prioDefaults = {}
    prioDefaults['prio/' + mapService.id] = mapService.prio !== undefined ? mapService.prio : 999

    browser.storage.local.get(prioDefaults, function (prio) {
      mapService.prio = prio['prio/' + mapService.id]

      const serviceLine = thisView.buildLineOfLinks(mapService.id,
        mapService,
        mapLinks,
        note)
      insertServiceLineIntoCategory(categoryElem, serviceLine, mapService.prio)

      if (note && note.length) {
        tippy('.linknote', {
          content: note
        })
      }
    })
  },

  addUtility: function (mapService, id, name) {
    // only add the title once
    const utilityElem = document.getElementById('utility')
    if (utilityElem.innerText.length === 0) {
      const title = document.createElement('h4')
      title.innerText = 'Utilities'
      utilityElem.appendChild(title)
    }

    // create div for mapService if not one already
    let mapServiceIdElem = document.getElementById(mapService.id)
    if (!mapServiceIdElem || mapServiceIdElem.innerText.length === 0) {
      utilityElem.insertAdjacentHTML('beforeend', "<div id='" + mapService.id +
        "' class='serviceLine' data-sort='" + mapService.prio + "'>" +
        '<span class="linkLineImg"><img src="../image/' + mapService.image + '"></span> ' +
        '<span class="serviceName">' + mapService.site + '</span></div>')
    }

    const linkHtml = " <a href='#' class=\"maplink\" id='" + id + "'>" + name + '</a>'
    // get it again (now that's it been created)
    mapServiceIdElem = document.getElementById(mapService.id)
    mapServiceIdElem.insertAdjacentHTML('beforeend', linkHtml)
  },

  /**
     * Adds links for file downloads (such as GPX)
     *
     * @param {mapService} Object containing data about the particular map service.
     * @param {id} Identifying string for this link.
     * @param {name} Display name for the link.
     * @param {fileGenerator} Function to invoke to create the file contents.
     */
  addFileDownload: function (mapService, id, name, fileGenerator) {
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
  },

  addUtilityLink: function (mapService, id, name, utilFunction) {
    this.addUtility(mapService, id, name)

    const idElem = document.getElementById(id)
    idElem.addEventListener('click', utilFunction)
  },

  /**
     * Adds a note for a map service.
     *
     * @param {mapService} Object representing the map service.
     * @param {note} Text content of the note to be displayed.
     */
  addNote: function (mapService, note) {
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
  },

  /**
    * Utility function which builds the HTML for all the map links belonging to a specific
    * map service.
    *
    * @param {string} id - id for the main map service div.
    * @param {object} mapSite - the output object representing the map service
    * @param {object} links - the map links to add, containing URLs and names for each
    * @param {note} note - a note for this map service, if applicable
    * @return {string} the HTML for the line
    */
  buildLineOfLinks: function (id, mapSite, links, note) {
    let html = ''
    if (links) {
      html =
        "<div id='" + id + "' class='serviceLine' data-sort='" + mapSite.prio + "'>" +
        '<span class="linkLineImg"><img src="../image/' + mapSite.image + '"></span> ' +
        '<span class="serviceName">' + mapSite.site + '</span> '
      Object.keys(links).forEach(link => {
        html += '<a class="maplink" target="_blank" id="' +
          link + '" href="' +
          links[link].link + '">' +
          links[link].name + '</a> '
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
      html += '</div>'
    }
    return html
  }

}

export default MapLinksView
