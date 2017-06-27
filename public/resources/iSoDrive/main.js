// var mapboxgl = require("@mapbox/mapbox-gl-native/mapbox-gl-js/js/mapbox-gl.js");

// Check to see if Mapbox GL JS is supported in user's browser
if (!mapboxgl.supported()) {
    alert('Mapbox GL JS is not supported by your browser.');
}

var GLOBAL_REFERENCE_DATA_SOURCE_ID = 'background-vector1';
var OPERATIONAL_DATA_SOURCE_ID = 'operationalDataBoundaries';
var OPERATIONAL_LAYER_PREFIX = 'oplayer-';
var OPERATIONAL_DATA_EXTENT_OPACITY = 0.33;
var OPERATIONAL_DATA_EXTENT_OUTLINE = '#2e2e2e';

// TODO make these configurable
var PORT = 9001;
var STYLE_NAME = 'osm-bright';
var STYLE_JSON_URL = 'http://localhost:' + PORT + '/styles/' + STYLE_NAME + '.json';
var BASE_DATA_JSON_URL = 'http://localhost:' + PORT + '/base.json';
var ISO_LAYER_TYPES_URL = 'http://localhost:' + PORT + '/iso-types.json';
var OPERATIONAL_DATA_JSON_URL = 'http://localhost:' + PORT + '/iso.json';

// See http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=8
var currentColorIndex = -1;
var colorCycle = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5'];
var getColorInCycle = function () {
    var color = colorCycle[++currentColorIndex];
    if (currentColorIndex === colorCycle.length) {
        currentColorIndex = -1;
    }
    return color;
};
var ACTIVE_BUTTON_COLOR = '#3887be';

var createSafeLayerId = function (inputValue) {
    // TODO Improve on this
    return OPERATIONAL_LAYER_PREFIX + inputValue.trim().replace(/\s+/g, '-').toLowerCase();
};

var getUniqueFeatures = function (array, comparatorProperty) {
    var existingFeatureKeys = {};
    // Because features come from tiled vector data, feature geometries may be split
    // or duplicated across tile boundaries and, as a result, features may appear
    // multiple times in query results.
    var uniqueFeatures = array.filter(function (el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
            return true;
        }
    });

    return uniqueFeatures;
};

var getVisibleOperationalLayerIDs = function () {
    var relevantFeatures = new Set();
    var features = map.queryRenderedFeatures();
    features.forEach(function (feature) {
        if (feature.layer.id.startsWith(OPERATIONAL_LAYER_PREFIX)) {
            if (!relevantFeatures.has(feature.layer.id)) {
                relevantFeatures.add(feature.layer.id);
            }
        }
    });
    return Array.from(relevantFeatures);
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
        // TODO Figure out if this type of filter is possible
        // var operationalFeatureFilter = ['!=', '$source', GLOBAL_REFERENCE_DATA_SOURCE_ID];
        // var features = map.queryRenderedFeatures(e.point, {filter: operationalFeatureFilter});
        var visibleOperationalLayers = getVisibleOperationalLayerIDs();
        var features = map.queryRenderedFeatures(e.point, {layers: visibleOperationalLayers});
        if (features) {
            var uniqueFeatures = getUniqueFeatures(features, "filePath");
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(createQueryResultBody(uniqueFeatures))
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
            var colorToUse = getColorInCycle();
            addOperationalLayer(foundType, colorToUse, OPERATIONAL_DATA_EXTENT_OUTLINE, OPERATIONAL_DATA_EXTENT_OPACITY);
            // TODO Figure out best way to make layer toggle color same as 'colorToUse'
            createLayerToggle(foundType, relevantLayerTypes[foundType], ACTIVE_BUTTON_COLOR);
        });
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
var createLayerToggle = function (layerName, layerAbbr, color) {
    var layerId = createSafeLayerId(layerName);

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.id = layerId;
    link.textContent = layerAbbr !== '' ? layerAbbr : layerName;
    link.backgroundColor = color;

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

// Go to location component
// TODO Implement this

// Measure component
// TODO Is this needed?
// // See https://www.mapbox.com/mapbox-gl-js/example/measure/
