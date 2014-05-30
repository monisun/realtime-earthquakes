/* I verified that this simple set of unit tests is working correctly. */

var http = require('http');
var assert = require('assert');

/* Unit Tests for HTTP JSON API */
//Test ON: Verify all results occurred on same UTC Date as param
http.get("http://localhost:3000/earthquakes.json/?on=1401262283&since=&over=&nearLat=&nearLong=&radius=", function(result) {
        var body = '';
        result.on('data', function(chunk) {
            body += chunk;
        });
        result.on('end', function() {
            body = JSON.parse(body);
            var count = body.length;
            for (var i=0; i<count; i++) {
                var onUTCDate = new Date(1401262283000);
                var currentDate = body[i].time;
                var currentUTCDate = new Date(currentDate);
                assert.equal(onUTCDate.getUTCDate(), currentUTCDate.getUTCDate(), "failed. current UTC date: " + currentDate);
                console.log("passed: UTC date:" + currentUTCDate);  
            } 
        });
});

//Test SINCE: Verify all results occurred after since UTC time
http.get("http://localhost:3000/earthquakes.json/?on=&since=1401229094&over=2&nearLat=&nearLong=&radius=", function(result) {
        var body = '';
        result.on('data', function(chunk) {
            body += chunk;
        });
        result.on('end', function() {
            body = JSON.parse(body);
            var count = body.length;
            for (var i=0; i<count; i++) {
                var currentDate = body[i].time;
                assert.equal(1401229094000 <= currentDate, true, "failed. current UTC date: " + currentDate);
                console.log("passed: all dates after (or on) SINCE " + currentDate);  
            }   
        });
});

//Test NEAR: GPS 36.772, 125.9181 within 600 mi. Should only return 1 result.
http.get("http://localhost:3000/earthquakes.json/?on=&since=&over=&nearLat=36.772&nearLong=125.9181&radius=600", function(result) {
        var body = '';
        result.on('data', function(chunk) {
            body += chunk;
        });
        result.on('end', function() {
            assert.equal(JSON.parse(body).length, 1, "failed. actual: " + JSON.parse(body).length);
            console.log("passed: " + JSON.parse(body).length);  
        });
});


//Test MAGNITUDE: Verify all results occurred after since UTC time
http.get("http://localhost:3000/earthquakes.json/?on=&since=1401229094&over=2&nearLat=&nearLong=&radius=", function(result) {
        var body = '';
        result.on('data', function(chunk) {
            body += chunk;
        });
        result.on('end', function() {
            body = JSON.parse(body);
            var count = body.length;
            for (var i=0; i<count; i++) {
                var mag = body[i].mag;
                assert.equal(mag > 2.0, true, "failed. current mag: " + mag);
                console.log("passed: all magnitudes > 2 : " + mag);  
            }    
        });
});
