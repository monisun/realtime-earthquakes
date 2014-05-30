var showRes = function (data) {
    $('#result').text(JSON.stringify(data, null, '  '));
}; 

var createMarker = function(infowindow, latlng, title, url, map) {
    var marker = new google.maps.Marker({       
        position: latlng, 
        map: map,
        title: title     
    }); 
    google.maps.event.addListener(marker, 'click', function() { 
        if (infowindow) {
            infowindow.close();
        }
        if (url) {
            infowindow.setContent('<a href='+url+' target="_blank">'+title+'</a>');
        } else {
            infowindow.setContent('<p>'+title+'</p>');
        }
        infowindow.open(map, marker);
    }); 
    return marker;  
}
 
var renderDownloadMap = function(data) {
    var count = parseInt(data.metadata.count);
    if (count == 0) {
        //no earthquakes found
        window.alert("No earthquakes found!");
    } else {
        //North America bounds:
        var swBound = new google.maps.LatLng(21.640363, -136.236425);
        var neBound = new google.maps.LatLng(56.525132, -62.056739);
        var bounds = new google.maps.LatLngBounds(swBound, neBound);
        var MAX_MAG_FILTER = 0.0;
        //center to first data point
        var firstLatLng = new google.maps.LatLng(bounds.getCenter());
        var mapOptions = {
          center: firstLatLng,
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map2 = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
        map2.fitBounds(bounds);
        
        //render markers:
        var latlng;
        var marker;
        var infowindow = new google.maps.InfoWindow();
        for (var i=0; i<count; i++) {
            if (data.features[i].properties.mag >= MAX_MAG_FILTER) {
                latlng = new google.maps.LatLng(data.features[i].geometry.coordinates[1], data.features[i].geometry.coordinates[0]);
                if (bounds.contains(latlng)) {
                    marker = createMarker(infowindow, latlng, data.features[i].properties.title, data.features[i].properties.url, map2);
                }
            }
        }
    }
    
};

var renderGetEarthquakeInfoMap = function(data) {
    var count = parseInt(data.length);
    var MAX_MAG_FILTER = 0.0;
    if (count > 0) {
        //center to first data point
        var firstLatLng = new google.maps.LatLng(data[0].gps.coordinates[1], data[0].gps.coordinates[0]);
        var mapOptions = {
          center: firstLatLng,
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map2 = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
        var bounds = new google.maps.LatLngBounds();
        //render markers:
        var latlng;
        var marker;
        var infowindow = new google.maps.InfoWindow();
        for (var i=0; i<count; i++) {
            if (data[i].mag >= MAX_MAG_FILTER) {
                latlng = new google.maps.LatLng(data[i].gps.coordinates[1], data[i].gps.coordinates[0]);
                bounds.extend(latlng);
                marker = createMarker(infowindow, latlng, data[i].title, null, map2);
            }
        }
        map2.fitBounds (bounds);  
    } else {
        //no earthquakes found
        window.alert("No earthquakes found!");
    } 
};

$(document).ready(function() {
    $('#download').click(
        function(e) {
            var data = $('#formDownloadEarthquakeInfo').serialize();
            $.ajax(
                { url: '/download/' + $('#inputDownloadTimeRange').val(),
                  type: 'POST', 
                  data: data,
                  success: renderDownloadMap
                }
            );  
        }   
    );
    
    $('#getearthquakeinfo').click(
        function(e) {
            var data = $('#formGetEarthquakeInfo').serialize();
            $.ajax(
                { url: '/earthquakes.json/',
                  type: 'GET', 
                  data: data,
                  success: renderGetEarthquakeInfoMap
                }
            );  
        }   
    );
    
    $('#debug_link').click(
            function(e) {
                $('#debug').toggleClass("hidden");
                e.preventDefault(); 
            }
        );
    
});

