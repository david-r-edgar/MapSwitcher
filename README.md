# MapSwitcher

Chrome extension to switch from one online map provider to another, maintaining (as far as possible) the map centre, zoom level, and directions of the source map.

## Installation

Most users will want to use the released version, [available on the Chrome Store](https://chrome.google.com/webstore/detail/map-switcher/fanpjcbgdinjeknjikpfnldfpnnpkelb).

### To install the development version
If you're interested in contributing to its development, modifying the extension for your own use, or simply using the most recent code, you should follow these steps:
- Clone this repository
- Open `chrome://extensions/` in your browser
- Check the 'Developer Mode' checkbox
- Choose 'Load unpacked extension...' and select the root directory (which contains `manifest.json`)

### Building the release version

You can build the release version using npm:
```
nvm use
npm install
npm run build
```
This will clean and build into `./release`, generating or copying all necessary files. It can be tested using the `chrome://extensions` 'Load unpacked extension...' option (see above), and also packed through the same page.

## Mapping services supported

### Input mapping services

##### With directions
- Google
- Bing
- OpenStreetMap
- Waze
- Here
- Yandex
- BRouter web

##### Without directions
- Wikimapia
- Wikimedia Labs
  - Geohack info page
- Geocaching
- OpenSeaMap
- Stamen
- Streetmap.co.uk
- GPX Editor
- TopoZone
- SunCalc
- SysMaps
- OpenCycleMap
- Facebook (pages and events)
- CalTopo
- Strava
  - Rides
  - Routes
  - Global Heatmap
- F4map
- OpenTopoMap
- Qwant
- Mapillary
- Komoot
- Waymarked Trails
- Rightmove
- OnTheMarket
- Zoopla
- PrimeLocation
- Peakbagger
- NGI / IGN (Belgium)
- OSMaps
- Windy
- Flightradar24
- CyclOSM
- nakarte.me
- Mapmyindia
- Map With AI RapiD
- NLS

### Output mapping services

##### With directions
- Google
- Bing
- Here
- BRouter web

##### With limited directions
(These services only support single segment directions, no 'via' points.)
- OpenStreetMap (only for routes with coordinate-specified waypoints)
- Yandex

##### Without directions
- Waze
- Wikimapia
- Wikimedia Labs
  - Geohack info page
  - WikiMiniAtlas
- Geocaching
- what3words
- OpenSeaMap
- Stamen
- GPX Editor
- Streetmap.co.uk (UK)
- NGI / IGN (Belgium)
- OpenCycleMap
- TopoZone (US)
- SysMaps (UK)
- Strava
  - Global Heatmap
- F4map
- OpenTopoMap
- CalTopo (US + CA)
- Qwant
- Mapillary
- Komoot
- Waymarked Trails
- OSMaps
- Windy
- OpenWeatherMap
- Flightradar24
- CyclOSM
- nakarte.me
- Mapmyindia
- Map With AI RapiD
- NLS (UK)

### Utilities
- GPX download
- Copy to clipboard
- SunCalc
- Boulter (coordinate conversion)
- Flickr (map of nearby photos)

## Known issues

- Where directions are specified by address (not coordinates), different services can geocode these in radically different ways. So the routes may not start or finish where they did on the input mapping service. Where available, coordinates are used instead, but not all services make the coordinates of each waypoint on the route available.
- Zoom / scale may not always be exact, depending on the limitations of the input & output map services
- Directions handle multi-segment routes (with intermediate specified locations) where possible. Only some services (google, microsoft) support this. In these cases, output services which only support single segments will show maps from the first location to the last location.
- Waze currently fails to handle zoom. The parameters do not work as its own documentation suggests they should.
- Waze output routing has been disabled, as deep-linking to coordinates currently doesn't work properly.
