# MapSwitcher

Chrome extension to switch from one online map provider to another, maintaining (as far as possible) the map centre, zoom level, and directions of the source map.

## Browsers supported
- Chromium - Tested
- Chrome -  Partially tested
- Opera - Unknown

## Mapping services supported

### Input mapping services

##### With directions
(no intermediate waypoints)
- Google
- Bing
- OpenStreetMap

##### Without directions
- Wikimapia
- Wikimedia Labs
  - Geohack info page
- Geocaching

### Output mapping services

##### With directions
(no intermediate waypoints)
- Google
- Bing
- OpenStreetMap (only for routes with coordinate-specified waypoints)

##### Without directions
- Wikimapia
- Wikimedia Labs
  - Geohack info page
  - WikiMiniAtlas
- Geocaching
- what3words


## Known issues

Where directions are specified by address (not coordinates), different services can geocode these in radically different ways. So the routes may not start or finish where they did on the input mapping service. Where available, coordinates are used instead, but not all services make the coordinates of each waypoint on the route available.
