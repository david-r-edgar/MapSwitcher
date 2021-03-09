# Test URLs

Provided below are a non-comprehensive set of URLs which are useful for test purposes. (In particular they are helpful for identifying when extractors start failing.)

## Directions

### Multi-segment: >2 waypoints

#### Specified as coords

- BRouter: https://brouter.de/brouter-web/#map=10/55.4679/8.6615/standard&lonlats=9.97171,53.564783;10.122835,54.31412;8.465955,55.472133

- Yandex: https://yandex.com/maps/?l=trf%2Ctrfe&ll=42.803235%2C54.365100&mode=routes&rtext=51.660781%2C39.200269~51.533557%2C46.034257~56.326797%2C44.006516&rtt=auto&ruri=ymapsbm1%3A%2F%2Fgeo%3Fll%3D39.200%252C51.661%26spn%3D0.646%252C0.418%26text%3D%25D0%25A0%25D0%25BE%25D1%2581%25D1%2581%25D0%25B8%25D1%258F%252C%2520%25D0%2592%25D0%25BE%25D1%2580%25D0%25BE%25D0%25BD%25D0%25B5%25D0%25B6~~ymapsbm1%3A%2F%2Fgeo%3Fll%3D44.007%252C56.327%26spn%3D0.572%252C0.238%26text%3D%25D0%25A0%25D0%25BE%25D1%2581%25D1%2581%25D0%25B8%25D1%258F%252C%2520%25D0%259D%25D0%25B8%25D0%25B6%25D0%25BD%25D0%25B8%25D0%25B9%2520%25D0%259D%25D0%25BE%25D0%25B2%25D0%25B3%25D0%25BE%25D1%2580%25D0%25BE%25D0%25B4&z=6.35

- Google - with named waypoints and dropped waypoints: https://www.google.com/maps/dir/Melbourne+VIC,+Australia/Canberra+ACT,+Australia/Sydney+NSW,+Australia/@-36.5094868,143.3376049,6.32z/data=!4m35!4m34!1m15!1m1!1s0x6ad646b5d2ba4df7:0x4045675218ccd90!2m2!1d144.9630576!2d-37.8136276!3m4!1m2!1d146.3987499!2d-38.6688249!3s0x6b2bd9ee8fe0942f:0x77e692686418fe55!3m4!1m2!1d148.2085764!2d-36.5296604!3s0x6b234f7f477ac8ef:0x28a476840c5108e3!1m10!1m1!1s0x6b164ca3b20b34bb:0x400ea6ea7695970!2m2!1d149.124417!2d-35.3075!3m4!1m2!1d149.7509481!2d-33.8609918!3s0x6b1186779f9ebc7b:0xbf35f17ac6ef3ad!1m5!1m1!1s0x6b129838f39a743f:0x3017d681632a850!2m2!1d151.2092955!2d-33.8688197!3e0

#### Specified as addresses
- Bing: https://www.bing.com/maps/?rtp=adr.Ullapool,%20Highland~adr.Kinlochewe,%20Highland~adr.Shiel%20Bridge,%20Ross-Shire~adr.Oban%20Railway%20Station,%20Railway%20Pier,%20Oban%20PA34%204LW~&mode=d&cp=57.26242605075075~-6.166952704878934&lvl=7&sty=s (it's expected that several output services are unable to use addresses without coords)


### Point to point: 2 waypoints

#### Specified as coords

- Google: https://www.google.com/maps/dir/San+Francisco,+CA,+USA/New+York,+NY,+USA/@38.3946634,-116.2823354,4z/data=!3m1!4b1!4m14!4m13!1m5!1m1!1s0x80859a6d00690021:0x4a501367f076adff!2m2!1d-122.4194155!2d37.7749295!1m5!1m1!1s0x89c24fa5d33f083b:0xc80b8f06e177fe62!2m2!1d-74.0059728!2d40.7127753!3e0


#### Specified as addresses

- Bing: https://www.bing.com/maps/?rtp=adr.Boise,%20Idaho,%20United%20States~adr.Baton%20Rouge,%20Louisiana,%20United%20States~&mode=d&cp=38.10742880250442~-111.90390144319697&lvl=4 (it's expected that several output services are unable to use addresses without coords)

- Waze: https://www.waze.com/en-GB/livemap/directions?to=ll.-33.8688197%2C151.2092955&from=place.ChIJrf08OilsEmsR4NQyFmh9AQU

### Directions (other cases)

- Missing start point: https://www.bing.com/maps/?rtp=adr.~pos.27_00024_Strada%20di%20Villa%20Cucuzza%2027,%2000024%20Tivoli%20Rome~&cp=42.24294068331044~12.727743577639025&lvl=8

- Missing end point: https://www.bing.com/maps/?rtp=adr.Vila%20Franca%20de%20Xira,%20Portugal%202600~adr.~&cp=38.831294302680035~-8.838409915044574&lvl=9&sty=h

## Regular maps

- Latitude & longitude both negative: https://www.google.com/maps/@-41.1457639,-71.3340641,13.1z

- Minimum scale: https://www.openstreetmap.org/#map=0/-23/130

- Maximum scale: https://mapwith.ai/rapid#background=Maxar-Premium&disable_features=boundaries&map=24.00/-6.82018/39.28822

- Near a border: https://demo.f4map.com/#lat=41.2943321&lon=45.0143813&zoom=14&3d=false&camera.theta=0.9

- Browse map: https://www.geocaching.com/map/#?ll=50.97691,11.0277&z=12

- Search map: https://www.geocaching.com/play/map/?lat=47.608376&lng=-122.347891&zoom=15&asc=true&sort=distance

- Google Satellite, unusual zoom parameter: https://www.google.com/maps/@53.4016168,-1.9301034,834a,35y,133.51h/data=!3m1!1e3

- NGI/IGN: https://topomapviewer.ngi.be/?x=648833.54&y=670721.26&zoom=11&l=en&baseLayer=ngi.cartoweb.topo.be

- streetmap.co.uk: https://www.streetmap.co.uk/map.srf?X=318088&Y=176467&A=Y&Z=106

- Cyclosm: https://www.cyclosm.org/#map=12/-34.9182/138.6174/cyclosm

- nakarte.me: https://nakarte.me/#m=18/50.06441/14.41323&l=Czt

- OpenWeather: https://openweathermap.org/weathermap?basemap=map&cities=true&layer=temperature&lat=46.29903&lon=8.47527&zoom=10

- MapmyIndia: https://maps.mapmyindia.com/@tfiosjoaa,oeiqfsvja,le,l,t,fzdata

- NLS side by side: https://maps.nls.uk/geo/explore/side-by-side/#zoom=15&lat=51.58231&lon=0.49097&layers=1&right=BingHyb

- NLS explore: https://maps.nls.uk/geo/explore/#zoom=16&lat=51.48377&lon=-0.11459&layers=6&b=1

- Sysmaps DE topo: http://www.sysmaps.co.uk/sysmaps_bkg.html?layers=B00000000000000000000000FFFFFTFFFTFFTTTTT&lat=51.3184&lon=9.4958 (**Failing**)

- Sysmaps OSGB: http://www.sysmaps.co.uk/sysmaps_os.html?!55.9550465~-3.1827409

- Sysmaps IGN FR: https://www.sysmaps.co.uk/sysmaps_ign2.html

- Waze: https://www.waze.com/en-GB/livemap/directions?latlng=51.3184%2C9.4958&zoom=15

## Special map cases

- Custom map: https://www.google.com/maps/d/viewer?ie=UTF8&hl=en&msa=0&z=13&mid=1Qau52q093LkUcvO3wzsvscXlnkg&ll=53.452152151956845%2C-2.214619999999996

## Search results

- Search results, map in right-hand column: https://www.google.com/search?q=machu+picchu&oq=macchu+pi&aqs=chrome.1.69i57j0l7.3186j0j7&client=ubuntu&sourceid=chrome&ie=UTF-8

- Search results, map at top: https://www.google.com/search?q=Dorset+Street&oq=Dorset+Street&aqs=chrome..69i57&client=ubuntu&sourceid=chrome&ie=UTF-8 (**Not currently supported**)

- Search results, map not in top position: https://www.google.com/search?safe=strict&q=horse+riding+myanmar

- Search results displayed on full-page map (not google maps): https://www.google.com/search?safe=strict&client=ubuntu&sz=0&tbm=lcl&sxsrf=ALeKk025ry0XqSAmIjTAkHiDVQmmr3XyKQ%3A1604247958238&ei=luGeX5uADqmIhbIPqYqOuAg&q=station+road%2C+uk&oq=station+road%2C+uk&gs_l=psy-ab.12...0.0.0.6303.0.0.0.0.0.0.0.0..0.0....0...1c..64.psy-ab..0.0.0....0.-3n98yH3TpY#rlfi=hd:;si:;mv:[[54.1095733,0.26166150000000005],[51.2798503,-2.7171944999999997]];tbs:lrf:!1m4!1u3!2m2!3m1!1e1!1m4!1u2!2m2!2m1!1e1!1m4!1u16!2m2!16m1!1e1!1m4!1u16!2m2!16m1!1e2!2m1!1e2!2m1!1e16!2m1!1e3!3sIAE,lf:1,lf_ui:2

## Social media

- Facebook event: https://www.facebook.com/events/217567725294368/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22search_results%22%2C%22surface%22%3A%22search%22%7D]%7D

- Facebook page: https://www.facebook.com/hornvenue

- Facebook place: https://www.facebook.com/places/Things-to-do-in-Weymouth-Dorset/108451039178633

- Facebook place search: https://www.facebook.com/search/places/?q=madrid (**Failing**)

## Other services

- Geohack: https://geohack.toolforge.org/geohack.php?pagename=Flamengo_Park&params=22.921_S_43.17_W_type:landmark_region:BR

- Boulter: http://boulter.com/gps/#15.20071%2C44.60037

- Wikipedia, specified in page (title position): https://en.wikipedia.org/wiki/Bridge_of_Sighs

- Wikipedia, in infobox and in text, degrees: https://en.wikipedia.org/wiki/Slade_Hall

- Wikipedia, in page, degrees and minutes: https://en.wikipedia.org/wiki/Almirantazgo_Fjord

- Wikipedia, in infobox, degrees and minutes: https://en.wikipedia.org/wiki/Mekong

- Wikipedia, in infobox, degrees, minutes and seconds: https://en.wikipedia.org/wiki/Stoppani_Glacier

- Peakbagger, single peak: https://www.peakbagger.com/peak.aspx?pid=10966

- Peakbagger, list of peaks: https://www.peakbagger.com/list.aspx?lid=12240 (should match displayed map)

- Strava heatmap (URL): https://www.strava.com/heatmap#12.10/170.44176/-45.88426/hot/all

- Strava activity (tile): https://www.strava.com/activities/1126517520

## No permanent URL available

- https://www.rightmove.co.uk/ (pick any property)

- https://www.zoopla.co.uk/ (pick any property)

- https://www.onthemarket.com/ (pick any property)

- https://www.primelocation.com/ (pick a property; some may fail due to not having lat & lng specified in header meta)
