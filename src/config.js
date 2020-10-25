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
class ServiceConfig {
  // creates a new instance of the ServiceConfig and loads the default config
  static async create () {
    const serviceConfig = new ServiceConfig()
    await serviceConfig.loadDefaultConfig()
    return serviceConfig
  }

  // loads the default config (packaged json file) and converts to a Map
  async loadDefaultConfig () {
    const response = await fetch(browser.runtime.getURL(DEFAULT_CONFIG))
    const defaultConfigJSON = await response.json()
    this.defaultConfig = new Map(defaultConfigJSON)
    return this.defaultConfig
  }

  // returns promise which resolves on successful retrieval from storage
  loadFromStorage (key) {
    return new Promise((resolve) => {
      browser.storage.local.get(key, function (items) {
        resolve(items[key])
      })
    })
  }

  // returns promise which resolves on successful save to storage
  saveToStorage (key, value) {
    const keyValueObject = {}
    keyValueObject[key] = value
    return new Promise((resolve) => {
      browser.storage.local.set(keyValueObject, function () {
        resolve()
      })
    })
  }

  // returns promise which resolves on successful clear of storage
  clearStorage () {
    return new Promise((resolve) => {
      browser.storage.local.clear()
      resolve()
    })
  }

  // loads user settings, converts them to map, merges in the default config
  async loadUserSettings () {
    const serviceConfig = await this.loadFromStorage('serviceConfig')
    this.config = new Map(serviceConfig)
    this.mergeConfig()
  }

  async saveUserSettings () {
    // FIXME possibly we first want to strip out values like service name, image before storing

    return this.saveToStorage('serviceConfig', [...this.config])
  }

  async clearUserSettings () {
    this.clearStorage()
  }

  async initialiseEmptyUserSettings () {
    this.config = new Map([])
  }

  // for each key in defaultConfig, if it doesn't exist in config, add it
  // also copy across any missing properties from defaultConfig
  mergeConfig () {
    // it's not a straightforward 'union' of maps since we want to keep the
    // order of 'config', but also keep any values it has set
    this.defaultConfig.forEach((defaultServiceSettings, serviceId) => {
      const settingsForService = {
        ...defaultServiceSettings,
        ...(this.config.get(serviceId))
      }
      this.config.set(serviceId, settingsForService)
    })
    return this.config
  }

  // returns a Map of tabs, each of which contains a Map of categories, each of those
  // containing a Map of services
  // FIXME could cache this - used twice on options page load
  getHierarchicalMap (includeHidden) {
    if (!this.tabMap) {
      this.tabMap = new Map()
      this.config.forEach((serviceSettings, service) => {
        if (!includeHidden && serviceSettings.hidden) {
          return
        }

        if (!this.tabMap.has(serviceSettings.tab)) {
          this.tabMap.set(serviceSettings.tab, new Map())
        }
        if (!(this.tabMap.get(serviceSettings.tab)).get(serviceSettings.cat)) {
          (this.tabMap.get(serviceSettings.tab)).set(serviceSettings.cat, new Map())
        }
        const { cat: _, tab: __, ...otherSettings } = serviceSettings

        this.tabMap.get(serviceSettings.tab).get(serviceSettings.cat).set(service, otherSettings)
      })
    }
    return this.tabMap
  }

  // returns a Map of all services, with names as keys and settings as values
  getServicesMap () {
    return this.config
  }

  // gets the config for a specific service
  getConfigForService (service) {
    return this.config.get(service)
  }

  // sets the config for a specific service
  setConfigForService (serviceId, serviceSettings) {
    this.config.set(serviceId, serviceSettings)
  }

  // returns an array of tab names which have direction services in
  getDirectionsTabs () {
    if (!this.directionsTabs) {
      this.directionsTabs = []
      this.config.forEach((serviceSettings) => {
        if (serviceSettings.type === 'directions' && !serviceSettings.hidden) {
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
      this.config.forEach((serviceSettings) => {
        if (serviceSettings.type !== 'directions' && !serviceSettings.hidden) {
          this.regularMappingTabs.push(serviceSettings.tab)
        }
      })
    }
    return this.regularMappingTabs
  }
}

// Holds different types of config object.
// Allows the main ServiceConfig to be replaced when user options are changed.
class ConfigManager {
  static async create () {
    const configManager = new ConfigManager()
    await configManager.createServiceConfig()
    await configManager.validateConfigVersion()
    return configManager
  }

  async createServiceConfig () {
    this.serviceConfig = await ServiceConfig.create()
    return this.serviceConfig
  }

  getServiceConfig () {
    return this.serviceConfig
  }

  // called when user is making changes on options page
  // - merge in default config (for any missed properties)
  // - set the new service config on this object
  // - save the config to local storage
  async setServiceConfig (newServiceConfig) {
    newServiceConfig.mergeConfig()
    this.serviceConfig = newServiceConfig
    await this.serviceConfig.saveUserSettings()
  }

  // for now, we just clear up old config and set the version for the future
  async validateConfigVersion () {
    const manifestData = browser.runtime.getManifest()

    const storageVersion = await this.serviceConfig.loadFromStorage('version')
    // clear up any config in pre-v1 format
    if (!storageVersion || storageVersion < '1.0.0') {
      await this.serviceConfig.clearUserSettings()
    }

    this.serviceConfig.saveToStorage('version', manifestData.version)
  }
}

export { ConfigManager, ServiceConfig }
export default ConfigManager
