
// A class representing the combined default config + user settings
// Used by the main mapSwitcher routine, the mapLinks view, and the options page.
class Config {
  constructor (defaultConfig, userSettings) {
    this.defaultConfig = defaultConfig
    this.config = userSettings
    this.config = this.mergeConfig(this.config, defaultConfig)
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
      this.directionsTabs = {}
      this.getServicesMap().forEach((serviceSettings) => {
        if (serviceSettings.type === 'directions') {
          this.directionsTabs[serviceSettings.tab] = true
        }
      })
    }
    return this.directionsTabs
  }

  // returns an array of tab names which have non-direction services in
  getRegularMappingTabs () {

  }
}

export default Config
