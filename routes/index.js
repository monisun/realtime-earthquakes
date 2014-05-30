var express = require('express');
var router = express.Router();
var http = require('http');

/* GET: homepage */
router.get('/', function(req, res) {
  res.render('index', { title: 'Earthquakes' });
});

/* PUT/POST: Query USGS for earthquake data. Persist to DB. */
var downloadearthquake = function(req, res) {
    // get time range
    var timerange = req.body.downloadtimerange || req.params.downloadtimerange;
	if (!timerange) { 
		res.send({result:'error', message:'a time range is required'}
	)};    
    //check timerange is valid
    if (!(timerange == 'hour' || timerange == 'day' || timerange == 'week' || timerange == 'month')) {
        res.send({result:'error', message:'invalid time range: ' + timerange}
    )};
    //request earthquake data from USGS
    var urlPrefix = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_';
    var urlSuffix = '.geojson';
    var url = urlPrefix + timerange + urlSuffix;    /* concat to form url, i.e. 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson' */
    http.get(url, function(result) {
        var body = '';
        result.on('data', function(chunk) {
            body += chunk;
        });
        result.on('end', function() {
            var data = JSON.parse(body);
            //write to DB:
            // set DB variable
            var db = req.db;
            // set db collection
            var collection = db.get('earthquake');  
            var count = data.metadata.count;
            var updated = data.metadata.generated;  //USGS feed last updated time
            var current;
            for (var i=0; i < count; i++) {
                current = data.features[i];
                // submit and update to DB: store in order {longitude, latitude}
                //GeoJSON in mongoDB stores in order {long, lat}; show in order {lat, long}
                collection.update(
                    { id : current.id },
                    { id : current.id,
                      time: parseInt(current.properties.time),
                      mag: parseFloat(current.properties.mag),
                      title: current.properties.title,
                      gps: {
                            type : "Point",
                            coordinates : [
                                parseFloat(current.geometry.coordinates[0]),
                                parseFloat(current.geometry.coordinates[1])
                            ]},
                       updated : parseInt(updated)
                    },
                    { upsert : true},
                    function (err) {
                        if (err) {
                            console.log(err);
                            res.send({result:'error', message: "Error adding/updating earthquake info the database: ", err: err});
                        }
                    });
            }
            res.send(data); 
        });
    }).on('error', function(e) {
          console.log("Got error: ", e);
    });
};


/* GET: Query DB for earthquake data. */
var getearthquake = function(req, res) {
    var on = req.query.on || req.params.on;
    var since = req.query.since || req.params.since;
    var over = req.query.over || req.params.over;
    var lat = req.query.nearLat || req.params.nearLat;
    var long = req.query.nearLong || req.params.nearLong;
    var radius = req.query.radius || req.params.radius || 5;  //default is 5 miles if not inputed
    //db
    var db = req.db;
    var collection = db.get('earthquake');
	var criteria = {};
	if (on) {
		//returns earthquakes on the same day (UTC) as the unix timestamp
        //convert from sec to milliseconds
        var start = new Date(parseInt(on)*1000);
        var end = new Date(parseInt(on)*1000);
        criteria.time = { $gte: parseInt(start.setUTCHours(0)), $lte: parseInt(end.setUTCHours(23)) };
	}
    if (since) {
        //returns earthquakes since the unix timestamp
        if (criteria.time && criteria.time.$gte) {
            var currentGte = criteria.time.$gte;
            criteria.time.$gte = Math.min(currentGte, parseInt(since)*1000);
        } else {
            criteria.time = { $gte: parseInt(since)*1000 };
        }
    }
    if (over) {
        //returns earthquakes > mag
        criteria.mag = { $gt: parseFloat(over) };
    }
    if (lat && long) {
        //returns earthquakes within 5 (or radius) miles of lat, long
        var radiusInMeters = parseFloat(radius) * 1609.34;  //convert to meters. MongoDB supports GeoJSON distance in meters.
        var gpsArray = [parseFloat(long) , parseFloat(lat)];
        var geoCriteria = { type : "Point", coordinates : gpsArray };
        criteria.gps = 
				{ $near : 
                    { $geometry : geoCriteria,
                      $maxDistance : radiusInMeters
					}
				};
    }
    
    //execute query:
	collection.find(
		criteria, 
		{},
		function (err, doc) {
        if (err) {
            res.send({result:'error', message: "error occurred when querying for earthquakes."});
			console.log(err);
        } else {
            res.send(doc);
        }
    });
};

/* POST and PUT: download earthquake data from USGS.gov */
router.put('/download', downloadearthquake);
router.put('/download/:timerange', downloadearthquake);
router.post('/download', downloadearthquake);
router.post('/download/:timerange', downloadearthquake);
/* GET: query DB to get earthquake data */
router.get('/earthquakes.json', getearthquake);
router.get('/earthquakes.json:inputOn?/:inputSince?/:inputOver?/:inputNearLat?/:inputNearLong?/:inputRadius?', getearthquake);

module.exports = router;
