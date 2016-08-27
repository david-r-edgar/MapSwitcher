/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Coordinate transformations, lat/Long WGS-84 <=> OSGB36  (c) Chris Veness 2005-2012            */
/*   - www.movable-type.co.uk/scripts/coordtransform.js                                           */
/*   - www.movable-type.co.uk/scripts/latlong-convert-coords.html                                 */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * @requires LatLon
 */
 
 
var CoordTransform = {};   // CoordTransform namespace, representing static class


// ellipse parameters
CoordTransform.ellipse = { 
  WGS84:        { a: 6378137,     b: 6356752.3142,   f: 1/298.257223563 },
  GRS80:        { a: 6378137,     b: 6356752.314140, f: 1/298.257222101 },
  Airy1830:     { a: 6377563.396, b: 6356256.910,    f: 1/299.3249646   }, 
  AiryModified: { a: 6377340.189, b: 6356034.448,    f: 1/299.32496     }, 
  Intl1924:     { a: 6378388.000, b: 6356911.946,    f: 1/297.0         }
};


// helmert transform parameters from WGS84 to other datums
CoordTransform.datumTransform = { 
  toOSGB36:  { tx: -446.448,  ty:  125.157,   tz: -542.060,  // m
               rx:   -0.1502, ry:   -0.2470,  rz:   -0.8421, // sec
                s:   20.4894 },                              // ppm
  toED50:    { tx:   89.5,    ty:   93.8,     tz:  123.1,    // m
               rx:    0.0,    ry:    0.0,     rz:    0.156,  // sec
                s:   -1.2 },                                 // ppm
  toIrl1975: { tx: -482.530,  ty:  130.596,   tz: -564.557,  // m
               rx:   -1.042,  ry:   -0.214,   rz:   -0.631,  // sec
                s:   -8.150 } };                             // ppm
  // ED50: og.decc.gov.uk/en/olgs/cms/pons_and_cop/pons/pon4/pon4.aspx
  // strictly, Ireland 1975 is from ETRF89: qv 
  // www.osi.ie/OSI/media/OSI/Content/Publications/transformations_booklet.pdf
  // www.ordnancesurvey.co.uk/oswebsite/gps/information/coordinatesystemsinfo/guidecontents/guide6.html#6.5

               
/**
 * Convert lat/lon point in OSGB36 to WGS84
 *
 * @param  {LatLon} pOSGB36: lat/lon in OSGB36 reference frame
 * @return {LatLon} lat/lon point in WGS84 reference frame
 */
CoordTransform.convertOSGB36toWGS84 = function(pOSGB36) {
  var eAiry1830 = CoordTransform.ellipse.Airy1830;
  var eWGS84 = CoordTransform.ellipse.WGS84;
  var txToOSGB36 = CoordTransform.datumTransform.toOSGB36;
  var txFromOSGB36 = {};  // negate the 'to' transform to get the 'from'
  for (var param in txToOSGB36) txFromOSGB36[param] = -txToOSGB36[param];
  var pWGS84 = CoordTransform.convertEllipsoid(pOSGB36, eAiry1830, txFromOSGB36, eWGS84);
  return pWGS84;
}


/**
 * Convert lat/lon point in WGS84 to OSGB36
 *
 * @param  {LatLon} pWGS84: lat/lon in WGS84 reference frame
 * @return {LatLon} lat/lon point in OSGB36 reference frame
 */
CoordTransform.convertWGS84toOSGB36 = function(pWGS84) {
  var eWGS84 = CoordTransform.ellipse.WGS84;
  var eAiry1830 = CoordTransform.ellipse.Airy1830;
  var txToOSGB36 = CoordTransform.datumTransform.toOSGB36;
  var pOSGB36 = CoordTransform.convertEllipsoid(pWGS84, eWGS84, txToOSGB36, eAiry1830);
  return pOSGB36;
}


/**
 * Convert lat/lon from one ellipsoidal model to another
 *
 * q.v. Ordnance Survey 'A guide to coordinate systems in Great Britain' Section 6
 *      www.ordnancesurvey.co.uk/oswebsite/gps/docs/A_Guide_to_Coordinate_Systems_in_Great_Britain.pdf
 *
 * @private
 * @param {LatLon}   point: lat/lon in source reference frame
 * @param {Number[]} e1:    source ellipse parameters
 * @param {Number[]} t:     Helmert transform parameters
 * @param {Number[]} e1:    target ellipse parameters
 * @return {Coord} lat/lon in target reference frame
 */
CoordTransform.convertEllipsoid = function(point, e1, t, e2) {

  // -- 1: convert polar to cartesian coordinates (using ellipse 1)

  var lat = point.lat().toRad(); 
  var lon = point.lon().toRad(); 

  var a = e1.a, b = e1.b;
  
  var sinPhi = Math.sin(lat);
  var cosPhi = Math.cos(lat);
  var sinLambda = Math.sin(lon);
  var cosLambda = Math.cos(lon);
  var H = 24.7;  // for the moment

  var eSq = (a*a - b*b) / (a*a);
  var nu = a / Math.sqrt(1 - eSq*sinPhi*sinPhi);

  var x1 = (nu+H) * cosPhi * cosLambda;
  var y1 = (nu+H) * cosPhi * sinLambda;
  var z1 = ((1-eSq)*nu + H) * sinPhi;


  // -- 2: apply helmert transform using appropriate params
  
  var tx = t.tx, ty = t.ty, tz = t.tz;
  var rx = (t.rx/3600).toRad();  // normalise seconds to radians
  var ry = (t.ry/3600).toRad();
  var rz = (t.rz/3600).toRad();
  var s1 = t.s/1e6 + 1;          // normalise ppm to (s+1)

  // apply transform
  var x2 = tx + x1*s1 - y1*rz + z1*ry;
  var y2 = ty + x1*rz + y1*s1 - z1*rx;
  var z2 = tz - x1*ry + y1*rx + z1*s1;


  // -- 3: convert cartesian to polar coordinates (using ellipse 2)

  a = e2.a, b = e2.b;
  var precision = 4 / a;  // results accurate to around 4 metres

  eSq = (a*a - b*b) / (a*a);
  var p = Math.sqrt(x2*x2 + y2*y2);
  var phi = Math.atan2(z2, p*(1-eSq)), phiP = 2*Math.PI;
  while (Math.abs(phi-phiP) > precision) {
    nu = a / Math.sqrt(1 - eSq*Math.sin(phi)*Math.sin(phi));
    phiP = phi;
    phi = Math.atan2(z2 + eSq*nu*Math.sin(phi), p);
  }
  var lambda = Math.atan2(y2, x2);
  H = p/Math.cos(phi) - nu;

  return new LatLon(phi.toDeg(), lambda.toDeg(), H);
}

