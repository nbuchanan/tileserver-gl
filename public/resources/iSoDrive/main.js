// var mapboxgl = require("@mapbox/mapbox-gl-native/mapbox-gl-js/js/mapbox-gl.js");

// Check to see if Mapbox GL JS is supported in user's browser
if (!mapboxgl.supported()) {
    alert('Mapbox GL JS is not supported by your browser.');
}

var GLOBAL_REFERENCE_LAYER = 'countries.mbtiles';
var OPERATIONAL_DATA_SOURCE_ID = 'operationalDataBoundaries';
var OPERATIONAL_DATA_EXTENT_OPACITY = 0.3;

// TODO make these configurable
var PORT = 9001;
var STYLE_JSON_URL = 'http://localhost:' + PORT + '/styles/osm-bright.json';
var BASE_DATA_JSON_URL = 'http://localhost:' + PORT + '/base.json';
var ISO_LAYER_TYPES_URL = 'http://localhost:' + PORT + '/iso-types.json';
var OPERATIONAL_DATA_JSON_URL = 'http://localhost:' + PORT + '/iso.json';

var createSafeLayerId = function (inputValue) {
    // TODO Improve on this
    return 'layer-' + inputValue.replace(/\s+/g, '-').toLowerCase();
};

// Create map control
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: STYLE_JSON_URL //stylesheet location
});

// Add map controls
var addMapControls = function () {
    map.addControl(new mapboxgl.FullscreenControl());

    map.addControl(new mapboxgl.NavigationControl({position: 'top-right'}));

    map.addControl(new mapboxgl.ScaleControl({maxWidth: 150, unit: 'metric'}));
};

// Register map events
var registerMapEvents = function () {
    // Show cursor coordinates in WGS1984
    map.on('mousemove', function (e) {
        document.getElementById('coordinatesDisplay').innerHTML = sprintf('LAT/LNG : %.8g , %.8g', e.lngLat.lat, e.lngLat.lng);
    });

    // Allow user to click on operation data footprints and get info
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on('click', function (e) {
        // TODO Fix this. HACK HACK HACK
        if (map.getCanvas().style.cursor === 'pointer') {
            var operationalFeatureFilter = ['!=', 'layer.source', 'background-vector1']; // TODO Set this dynamically
            var features = map.queryRenderedFeatures(e.point, operationalFeatureFilter);
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(createQueryResultBody(features))
                .addTo(map);
        }
    });
};

// Draw bounding box for extract AOI(s) and operational data footprints
map.on('load', function () {
    addCustomSources();
    loadLayerTypes();
    addMapControls();
    registerMapEvents();
});

var addCustomSources = function () {
    map.addSource(OPERATIONAL_DATA_SOURCE_ID, {
        type: 'geojson',
        data: OPERATIONAL_DATA_JSON_URL
    });
};

// Load data types found in configured data directory
var loadLayerTypes = function () {
    $.get(ISO_LAYER_TYPES_URL, function (relevantLayerTypes) {
        Object.keys(relevantLayerTypes).forEach(function (foundType) {
            // TODO Dynamically allocate colors based on something like http://colorbrewer2.org/#type=qualitative&n=8
            addOperationalLayer(foundType, '#e10c0b', '#2e2e2e', OPERATIONAL_DATA_EXTENT_OPACITY);
        });

        createLayerToggles(relevantLayerTypes);
    });
};
var addOperationalLayer = function (layerName, fillColor, outlineColor, opacity) {
    var layerId = createSafeLayerId(layerName);
    map.addLayer({
        'id': layerId,
        'type': 'fill',
        'source': OPERATIONAL_DATA_SOURCE_ID,
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'fill-color': fillColor,
            'fill-opacity': opacity,
            'fill-outline-color': outlineColor
        },
        'filter': ['==', 'type', layerName]
    });

    registerMapLayerEvents(layerId);
};

var registerMapLayerEvents = function (layerId) {

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', layerId, function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', layerId, function () {
        map.getCanvas().style.cursor = '';
    });
};

// Dynamically generate layer toggle buttons based on discovered data
var createLayerToggles = function (layerNameMapping) {
    Object.keys(layerNameMapping).forEach(function (layerName) {

        var layerId = createSafeLayerId(layerName);

        var link = document.createElement('a');
        link.href = '#';
        link.className = 'active';
        link.id = layerId;
        link.textContent = layerNameMapping[layerName] !== '' ? layerNameMapping[layerName] : layerName;

        link.onclick = function (e) {
            var clickedLayer = this.id;
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
    });
};

// Takes in a GeoJSON FeatureCollection and returns the HTML to display
var createQueryResultBody = function (features) {
    var result = '';
    features.forEach(function (feature) {
        var props = feature.properties;
        var displayName = props.abbreviation ? props.abbreviation : props.type;
        result += displayName + ' <a href=\"file://' + props.filePath + '\") title=\"View file in folder\">' + props.fileName + '</a> (<i>' + props.sizeReadable + '</i>)<br/>';
    });
    return result;
};

// Set AOI to move to based upon button
var aoiFootprints = [];
var currentAOIIndex = 0;
// // Load extents for reference data AOIs
// var loadReferenceLayerData = function () {
//     $.get(BASE_DATA_JSON_URL, function (data) {
//         data.features.forEach(function (feature) {
//             if (feature.properties.fileName !== GLOBAL_REFERENCE_LAYER) {
//                 // Added lower left and upper right points from extent polygon
//                 var ll = feature.geometry.coordinates[0][0];
//                 var ur = feature.geometry.coordinates[0][2];
//                 aoiFootprints.push(new mapboxgl.LngLatBounds(ll, ur));
//             }
//         });
//     });
// };

// var registerMoveBetweenAOIsEvent = function () {
//     document.getElementById('zoomToAOI').addEventListener('click', function() {
//         var bounds = aoiFootprints[currentAOIIndex];
//         map.fitBounds(bounds);
//         if (++currentAOIIndex === aoiFootprints.length) {
//             currentAOIIndex = 0;
//         }
//     });
// };


// // Draw functionality
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
//     downloadButton.onclick = function() {
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

// Go to location component
// TODO Implement this

// Measure component
// TODO Is this needed?
// // See https://www.mapbox.com/mapbox-gl-js/example/measure/
