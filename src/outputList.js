import google from './outputs/google.js'
import googleDirections from './outputs/googleDirections.js'
import bing from './outputs/bing.js'
import bingDirections from './outputs/bingDirections.js'
import osmDirections from './outputs/osmDirections.js'
import hereDirections from './outputs/hereDirections.js'
import yandexDirections from './outputs/yandexDirections.js'
import brouterDirections from './outputs/brouterDirections.js'
import osm from './outputs/osm.js'
import here from './outputs/here.js'
import yandex from './outputs/yandex.js'
import wikimapia from './outputs/wikimapia.js'
import waze from './outputs/waze.js'
import f4map from './outputs/f4map.js'
import opentopomap from './outputs/opentopomap.js'
import qwant from './outputs/qwant.js'
import mapillary from './outputs/mapillary.js'
import nakarte from './outputs/nakarte.js'
import streetmap from './outputs/streetmap.js'
import ngiign from './outputs/ngiign.js'
import topozone from './outputs/topozone.js'
import sysmaps from './outputs/sysmaps.js'
import caltopo from './outputs/caltopo.js'
import ordnancesurvey from './outputs/ordnancesurvey.js'
import mapmyindia from './outputs/mapmyindia.js'
import nls from './outputs/nls.js'
import brouter from './outputs/brouter.js'
import geocaching from './outputs/geocaching.js'
import gpxeditor from './outputs/gpxeditor.js'
import openCycleMap from './outputs/openCycleMap.js'
import komoot from './outputs/komoot.js'
import openseamap from './outputs/openseamap.js'
import waymarkedtrails from './outputs/waymarkedtrails.js'
import cyclosm from './outputs/cyclosm.js'
import strava from './outputs/strava.js'
import wmLabs from './outputs/wmLabs.js'
import suncalc from './outputs/suncalc.js'
import boulter from './outputs/boulter.js'
import openweather from './outputs/openweather.js'
import flickr from './outputs/flickr.js'
import windy from './outputs/windy.js'
import what3words from './outputs/what3words.js'
import stamen from './outputs/stamen.js'
import flightradar24 from './outputs/flightradar24.js'
import MapWithAIRapiD from './outputs/MapWithAIRapiD.js'
import dlgpx from './outputs/dlgpx.js'
import clipboard from './outputs/clipboard.js'
import heavensAbove from './outputs/heavensAbove.js'
import openrailwaymap from './outputs/openrailwaymap.js'

const outputs = {
  google,
  googleDirections,
  bing,
  bingDirections,
  osmDirections,
  hereDirections,
  yandexDirections,
  brouterDirections,
  osm,
  here,
  yandex,
  wikimapia,
  waze,
  f4map,
  opentopomap,
  qwant,
  mapillary,
  nakarte,
  streetmap,
  ngiign,
  topozone,
  sysmaps,
  caltopo,
  ordnancesurvey,
  mapmyindia,
  nls,
  brouter,
  geocaching,
  gpxeditor,
  openCycleMap,
  komoot,
  waymarkedtrails,
  openseamap,
  cyclosm,
  strava,
  wmLabs,
  suncalc,
  boulter,
  openweather,
  flickr,
  windy,
  what3words,
  stamen,
  flightradar24,
  MapWithAIRapiD,
  dlgpx,
  clipboard,
  heavensAbove,
  openrailwaymap
}

outputs.init = async function () {
  for (const [id, service] of Object.entries(outputs)) {
    service.id = id
  }
}

export default outputs
