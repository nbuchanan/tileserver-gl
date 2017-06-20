// Check to see if Mapbox GL JS is supported in user's browser
if (!mapboxgl.supported()) {
    alert("Mapbox GL JS is not supported by your browser.");
}

// Create map control
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'http://localhost:9001/styles/apex-style1.json', //stylesheet location
    center: [-78.8465, 35.905], // starting position
    zoom: 12 // starting zoom
});

// Add Mapbox controls
map.addControl(new mapboxgl.FullscreenControl());

map.addControl(new mapboxgl.NavigationControl({position: 'top-right'}));

var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    }
});
map.addControl(draw);

// // Toggle styles
// var layerList = document.getElementById('menu');
// var inputs = layerList.getElementsByTagName('input');
//
// function switchLayer(layer) {
//     var layerId = layer.target.id;
//     map.setStyle('http://localhost:9001/styles/' + layerId + '.json');
// }
//
// for (var i = 0; i < inputs.length; i++) {
//     inputs[i].onclick = switchLayer;
// }

// TODO pull this dynamically from datasets
// Set AOI to move to based upon button
var rduBounds = [[-79.116, 35.759], [-78.577, 36.051]]; // lower left, upper right
document.getElementById('zoomToAOI').addEventListener('click', function() {
    map.fitBounds(rduBounds);
});

// TODO read this from URL
// Draw bounding box for extract AOI(s)
map.on('load', function () {

    map.addLayer({
        'id': 'maine',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [
                        [-79.116, 35.759],
                        [-79.116, 36.051],
                        [-78.577, 36.051],
                        [-78.577, 35.759],
                        [-79.116, 35.759]
                ]}
            }
        },
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#e18310',
            'line-width': 3,
            'line-dasharray': [3, 3],
            'line-gap-width': 1,
            'line-blur': 0,
            'line-opacity': 0.7
        }
    });
});

// Show cursor coordinates in WGS1984
map.on('mousemove', function (e) {
    document.getElementById('coordinatesDisplay').innerHTML = sprintf('LAT/LNG : %.8g , %.8g', e.lngLat.lat, e.lngLat.lng);
});

// Go to location component
// TODO Implement this

// Measure component
// TODO Is this needed?
