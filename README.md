# MapSwitcher

Chrome extension to switch from one online map provider to another, maintaining (as far as possible) the map centre, zoom level, and directions of the source map.

## Installation

Most users will want to use the released version, [available on the Chrome Store](https://chrome.google.com/webstore/detail/map-switcher/fanpjcbgdinjeknjikpfnldfpnnpkelb).

### To install the development version
If you're interested in contributing to its development, modifying the extension for your own use, or simply using the most recent code, you should follow these steps:
- Clone this repository
- Open [chrome://extensions/](chrome://extensions/) in your browser
- Check the 'Developer Mode' checkbox
- Choose 'Load unpacked extension...' and select the root directory (which contains `manifest.json`)

### Building the release version

The included makefile allows you to build for release. Currently you may need to adapt it according to your local set-up. As of 24 June 2016, you must install the 'harmony' branch of uglifyjs in order to mangle ES6 JavaScript code.

`make all` will build into a 'release' directory, generating or copying all necessary files. It can be tested using the chrome://extensions 'Load unpacked extension...' option (see above) and packed through the same page.

## Browsers supported
- Chromium - Tested
- Chrome -  Partially tested
- Opera - Unknown

## Mapping services supported

### Input mapping services

##### With directions
- Google
- Bing
- OpenStreetMap
- Waze
- Here

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

### Output mapping services

##### With directions
- Google
- Bing
- Here

##### With limited directions
(These services only support single segment directions, no 'via' points.)
- OpenStreetMap (only for routes with coordinate-specified waypoints)
- Waze (only for routes with coordinate-specified waypoints)

##### Without directions
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

### Utilities
- GPX download
- OpenWeatherMap
- SunCalc
- Boulter (coordinate conversion)
- Flickr (map of nearby photos)

## Known issues

- Where directions are specified by address (not coordinates), different services can geocode these in radically different ways. So the routes may not start or finish where they did on the input mapping service. Where available, coordinates are used instead, but not all services make the coordinates of each waypoint on the route available.
- Zoom / scale may not always be exact, depending on the limitations of the input & output map services
- Directions handle multi-segment routes (with intermediate specified locations) where possible. Only some services (google, microsoft) support this. In these cases, output services which only support single segments will show maps from the first location to the last location.
- NGI/IGN links are problematic. Conditions must be accepted, and language chosen, before opening the link. The developers clearly half-considered this problem, as permalinks theoretically redirect you after accepting the conditions. But a 400 error occurs (even when opening a permalink in a new browser, without using MapSwitcher).
