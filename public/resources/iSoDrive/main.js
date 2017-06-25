// var mapboxgl = require("@mapbox/mapbox-gl-native/mapbox-gl-js/js/mapbox-gl.js");

// Check to see if Mapbox GL JS is supported in user's browser
if (!mapboxgl.supported()) {
    alert('Mapbox GL JS is not supported by your browser.');
}

var GLOBAL_REFERENCE_LAYER = 'countries.mbtiles';
var AOIS_LAYER_ID = 'AOIs';
var OPERATIONAL_DATA_LAYER_ID = 'Footprints';

// TODO make these configurable
var STYLE_JSON_URL = 'http://localhost:9001/styles/osm-bright.json';
var BASE_DATA_JSON_URL = 'http://localhost:9001/base.json';
var ISO_LAYER_TYPES_URL = 'http://localhost:9001/iso-types.json';
var OPERATIONAL_DATA_JSON_URL = 'http://localhost:9001/iso.json';

// Create map control
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: STYLE_JSON_URL //stylesheet location
    // center: [-78.8465, 35.905], // starting position
    // zoom: 9 // starting zoom
});

// Add Mapbox controls
map.addControl(new mapboxgl.FullscreenControl());

map.addControl(new mapboxgl.NavigationControl({position: 'top-right'}));

map.addControl(new mapboxgl.ScaleControl({maxWidth: 150, unit: 'metric'}));

// var draw = new MapboxDraw({
//     displayControlsDefault: false,
//     controls: {
//         polygon: true,
//         trash: true
//     }
// });
// map.addControl(draw);
//
// var downloadButton = document.getElementById('download');
// downloadButton.onclick = function() {
//     var data = draw.getAll();
//     if (data.features.length > 0) {
//         var area = turf.area(data);
//         // restrict to area to 2 decimal points
//         var rounded_area = Math.round(area*100)/100;
//         var answer = document.getElementById('downloadQ-area');
//         answer.innerHTML = '<p><strong>' + rounded_area + '</strong></p><p>square meters</p>';
//     } else {
//         alert("Use the draw tools to draw a polygon!");
//     }
// };

// Set AOI to move to based upon button
var aoiFootprints = [];
var currentAOIIndex = 0;
// document.getElementById('zoomToAOI').addEventListener('click', function() {
//     var bounds = aoiFootprints[currentAOIIndex];
//     map.fitBounds(bounds);
//     if (++currentAOIIndex === aoiFootprints.length) {
//         currentAOIIndex = 0;
//     }
// });

function addCustomSources() {

    map.addSource('operationalDataBoundaries', {
        type: 'geojson',
        data: OPERATIONAL_DATA_JSON_URL
    });
}

function addCustomLayers() {

    map.addLayer({
        'id': OPERATIONAL_DATA_LAYER_ID,
        'type': 'fill',
        'source': 'operationalDataBoundaries',
        'layout': {},
        'paint': {
            'fill-color': '#e10c0b',
            'fill-opacity': 0.3,
            'fill-outline-color': '#2e2e2e'
        }
    });
}

// Takes in a GeoJSON FeatureCollection and returns the HTML to display
function createQueryResultBody(features) {
    var result = '';
    features.forEach(function (feature) {
        var props = feature.properties;
        result += props.type + ' <a href=\"file://' + props.filePath + '\") title=\"View file in folder\">' + props.fileName + '</a> (' + props.sizeReadable + ')<br/>';
    });
    return result;
}

// Draw bounding box for extract AOI(s) and operational data footprints
map.on('load', function () {
    addCustomSources();
    addCustomLayers();
});

// Load extents for base data AOIs (no obvious way to do this by way of map control)
$.get(BASE_DATA_JSON_URL, function(data) {
    data.features.forEach(function (feature) {
        if (feature.properties.fileName !== GLOBAL_REFERENCE_LAYER) {
            // Added lower left and upper right points from extent polygon
            var ll = feature.geometry.coordinates[0][0];
            var ur = feature.geometry.coordinates[0][2];
            aoiFootprints.push(new mapboxgl.LngLatBounds(ll, ur));
        }
    });
});

// Load found data types
var toggleableLayerIds = [ OPERATIONAL_DATA_LAYER_ID ];
$.get(ISO_LAYER_TYPES_URL, function(data) {
    console.log('Found types:');
    data.forEach(function (foundType) {
        console.log('\t' + foundType);
    });
});

// Show cursor coordinates in WGS1984
map.on('mousemove', function (e) {
    document.getElementById('coordinatesDisplay').innerHTML = sprintf('LAT/LNG : %.8g , %.8g', e.lngLat.lat, e.lngLat.lng);
});

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function (e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('layerToggleMenu');
    layers.appendChild(link);
}

// Allow user to click on operation data footprints and get info
// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
map.on('click', OPERATIONAL_DATA_LAYER_ID, function (e) {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(createQueryResultBody(e.features))
        .addTo(map);
});

// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', OPERATIONAL_DATA_LAYER_ID, function () {
    map.getCanvas().style.cursor = 'pointer';
});

// Change it back to a pointer when it leaves.
map.on('mouseleave', OPERATIONAL_DATA_LAYER_ID, function () {
    map.getCanvas().style.cursor = '';
});

// Go to location component
// TODO Implement this

// Measure component
// TODO Is this needed?
