var express = require('express');
var router = express.Router();
var http = require('http');
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/earthquake');

/* cron job to download the latest earthquake data once per minute and persist to DB (mongoDB) */
var CronJob = require('cron').CronJob;

var job = new CronJob({
  cronTime: '0 * * * * *',
  onTick: function() {
    // runs once per minute to request earthquake USGS data for the past 7 days
    var url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
    http.get(url, function(result) {
        var body = '';
        result.on('data', function(chunk) {
            body += chunk;
        });
        result.on('end', function() {
            var data = JSON.parse(body);
            //write to DB:
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
                            console.log("Error adding/updating earthquake info the database: "  + err);
                        }
                    });
            }
        });
    }).on('error', function(e) {
          console.log("Got error: ", e);
    });
  },
  start: true,
  timeZone: "America/Los_Angeles"
});

module.exports = job;

