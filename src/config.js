/* global
  globalThis,
  fetch */

let browser
if (typeof browser === 'undefined') {
  browser = globalThis.chrome // eslint-disable-line no-global-assign
}

const DEFAULT_CONFIG = '../config/defaultServices.json'

// A class representing the combined default config + user settings.
// Used by the main mapSwitcher routine, the mapLinks view, and the options page.
// The config dictates the tab, category and service hierarchy.
class Config {
  constructor (defaultConfig, userSettings) {
    this.defaultConfig = defaultConfig
    this.config = userSettings
    this.config = this.mergeConfig(this.config, defaultConfig)
  }

  // FIXME is there a better way to structure initial load?
  // perhaps construct, then initialise?
  static async create () {
    const loadedConfig = await Config.loadConfig()
    const defaultConfig = new Map(loadedConfig)
    const userSettings = Config.loadUserSettings()
    return new Config(defaultConfig, userSettings)
  }

  static async loadConfig () {
    const response = await fetch(browser.runtime.getURL(DEFAULT_CONFIG))
    return response.json()
  }

  static loadUserSettings () {
    return new Map([
      // FOR TESTING
      //   ['someservice', {cat: 'somecat', tab: 'sometab'}],
      //   ['waze', {cat: 'wazewazewazewazecat', tab: 'wazewazewazewazetab'}]
      // [ 'google', { 'cat': 'General purpose', 'tab': 'Regular mapping', 'hidden': false }],
      // [ "osm", { "cat": "General purpose", "tab": "Regular mapping" }],
      // [ "bing", { "cat": "General purpose", "tab": "Regular mapping" }]
      // [ "googleDirections", { "cat": "General purpose", "tab": "Regular mapping", "type": "directions" }],
      // [ "google", { "cat": "Directions", "tab": "Directions" }]
    ])
  }

  async loadConfigsAndSettings () {
  }

  mergeConfig (config, defaultConfig) {
    // for each key in defaultConfig, if it doesn't exist in settings, add it
    //
    // it's not a straightforward 'union' of maps since we want to keep the
    // order of 'config', but also keep any values it has set
    defaultConfig.forEach((value, key) => {
      if (!config.has(key)) {
        config.set(key, value)
      }
    })
    return config
  }

  // returns a Map of tabs, each of which contains a Map of categories, each of those
  // containing a Map of services
  getHierarchicalMap () {
    if (!this.tabMap) {
      this.tabMap = new Map()
      this.config.forEach((serviceSettings, service) => {
        if (!this.tabMap.has(serviceSettings.tab)) {
          this.tabMap.set(serviceSettings.tab, new Map())
        }
        if (!(this.tabMap.get(serviceSettings.tab)).get(serviceSettings.cat)) {
          (this.tabMap.get(serviceSettings.tab)).set(serviceSettings.cat, new Map())
        }
        const { 'cat': _, 'tab': __, ...otherSettings } = serviceSettings

        this.tabMap.get(serviceSettings.tab).get(serviceSettings.cat).set(service, otherSettings)
      })
    }
    return this.tabMap
  }

  // returns a Map, with service names as keys and their settings as the values
  getServicesMap () {
    return this.config
  }

  // returns an array of tab names which have direction services in
  getDirectionsTabs () {
    if (!this.directionsTabs) {
      this.directionsTabs = []
      this.getServicesMap().forEach((serviceSettings) => {
        if (serviceSettings.type === 'directions') {
          this.directionsTabs.push(serviceSettings.tab)
        }
      })
    }
    return this.directionsTabs
  }

  // returns an array of tab names which have regular (non-direction) services in
  getRegularMappingTabs () {
    if (!this.regularMappingTabs) {
      this.regularMappingTabs = []
      this.getServicesMap().forEach((serviceSettings) => {
        if (serviceSettings.type !== 'directions') {
          this.regularMappingTabs.push(serviceSettings.tab)
        }
      })
    }
    return this.regularMappingTabs
  }
}

export default Config
