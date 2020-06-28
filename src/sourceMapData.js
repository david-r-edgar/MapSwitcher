/* global
  calculateStdZoomFromResolution, calculateResolutionFromStdZoom,
  codegrid, jsonWorldGrid,
  CoordTransform, OsGridRef */

class SourceMapData {
  constructor (sourceMapData) {
    Object.assign(this, sourceMapData)
  }

  getStandardZoom (options) {
    // FIXME eslint reports parsing errors with optional chaining operator
    // let zoom = options?.default ? options.default : 12
    let zoom = (options && options.default) ? options.default : 12
    const min = (options && options.min)
    const max = (options && options.max)

    if (this.resolution) {
      zoom = calculateStdZoomFromResolution(
        this.resolution, this.centreCoords.lat, min, max)
      // FIXME options?.min, options?.max
    }

    return zoom
  }

  normaliseOSGBCoords () {
    const osGR = new OsGridRef(this.osgbCentreCoords.e,
      this.osgbCentreCoords.n)
    const osLL = OsGridRef.osGridToLatLong(osGR)
    const wgs84LL = CoordTransform.convertOSGB36toWGS84(osLL)
    this.centreCoords = {
      lat: wgs84LL._lat,
      lng: wgs84LL._lon
    }
  }

  async normaliseLambertCoords () {
    const request = new window.Request(`http://www.loughrigg.org/wgs84Lambert/lambert_wgs84/${this.lambertCentreCoords.e}/${this.lambertCentreCoords.n}`)
    const response = await window.fetch(request)
    const { lat, lng } = await response.json()
    this.centreCoords = { lat, lng }
  }

  async normaliseGooglePlace () {
    const request = new window.Request(`https://www.google.com/maps?q=${this.googlePlace}`)
    const initOptions = {
      credentials: 'omit'
    }
    const response = await window.fetch(request, initOptions)
    const responseBlob = await response.blob()
    const blobtext = await responseBlob.text()
    // coords are given many times in the response, but some others are shifted to one side
    const googleRe = /preview\/place\/[^/]+\/@([-0-9.]+),([-0-9.]+),[-0-9.]+a,([0-9.]+)y/
    const resultArray = blobtext.match(googleRe)
    this.centreCoords = {
      lat: resultArray[1],
      lng: resultArray[2]
    }
    this.resolution = calculateResolutionFromStdZoom(resultArray[3], resultArray[1])
  }

  // Put the extracted data in a standard format, and perform any necessary checks
  // to ensure the extracted data object is suitable for output use.
  //
  // The main functionality is to convert from unusual coordinate systems to WGS84.
  async normaliseExtractedData () {
    // return new Promise(function (resolve, reject) {

    if (this.centreCoords) {
      // regular wgs84 coords extracted
      return
    }

    if (this.osgbCentreCoords) {
      // osgb36 coords specified
      this.normaliseOSGBCoords()
      return
    }

    if (this.lambertCentreCoords) {
      // Lambert Conic Conformal coords specified
      await this.normaliseLambertCoords()
      return
    }

    if (this.googlePlace) {
      // named google place (a map is being shown in search results, but
      // we don't know how to extract the coords)
      await this.normaliseGooglePlace()
      return
    }

    // if we reach here, then have no coords of any recognised format
    throw new Error('extracted data not in recognised format')
  }

  normaliseRoute () {
    if (this.directions && this.directions.route) {
      // routes without at least 2 waypoints are invalid - so just delete them
      if (this.directions.route.length < 2) {
        delete this.directions
      }
    }
  }

  // Gets the two letter country code for the current location of the map shown
  // in the current tab. If the country code can be found, it is stored in the
  // extracted data object passed as argument.
  async getCountryCode () {
    // CodeGrid is a service for identifying the country within which a coordinate
    // falls. The first-level identification tiles are loaded client-side, so most
    // of the time, no further request is necessary. But in cases where the coordinate
    // is close to an international boundary, additional levels of tiles, with more
    // detail, are reqested from the specified host.
    const CodeGrid = codegrid.CodeGrid('https://www.loughrigg.org/codegrid-js/tiles/', jsonWorldGrid) // eslint-disable-line no-global-assign
    const self = this

    await new Promise(function (resolve) {
      if (self.centreCoords) {
        CodeGrid.getCode(
          Number(self.centreCoords.lat),
          Number(self.centreCoords.lng),
          function (error, countryCode) {
            if (!error) {
              self.countryCode = countryCode
              resolve()
            }
          })
      }
    })
  }

  determineSourceDataType () {
    return this.directions ? 'directions' : 'regular'
  }

  getSourceInfo () {
    const sourceMapDataInfo = {
      centreCoords: this.centreCoords,
      locationDescr: this.locationDescr
    }

    if (this.directions && this.directions.route) {
      sourceMapDataInfo.directions = {
        numWpts: this.directions.route.length,
        mode: this.directions.mode
      }
    }

    return sourceMapDataInfo
  }

  static async build (extractedData) {
    const sourceMapData = new SourceMapData(extractedData)
    await sourceMapData.normaliseExtractedData()
    await sourceMapData.normaliseRoute()
    await sourceMapData.getCountryCode()
    return sourceMapData
  }
}

export default SourceMapData
