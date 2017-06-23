#!/usr/bin/env node

'use strict';

var path = require('path'),
    fs = require('fs');

var clone = require('clone');

var gdal = require('gdal-mbt'),
    util = require('util'),
    GeoJSON = require('geojson'),
    turf = require('turf'),
    logger = require('loglevel').noConflict().getLogger('iSoDrive');

var parseMetadataUsingGDAL = function(filePath, drivers) {
    // First attempt to open without specifying drivers
    var ds;
    try {
        ds = gdal.open(filePath);
    } catch (err) {
        logger.debug('Unable to read ' + filePath + ' with default open');
    }

    if (!ds) {
        drivers.foreach(function(driver) {
            logger.debug('Attempting to parse ' + filePath + ' with ' + driver + ' driver');
        });
    }

    if (!ds) {
        logger.error('Error opening dataset at ' + filePath);
        return;
    }

    var driver = ds.driver;
    var driver_metadata = driver.getMetadata();
    if (driver_metadata['DCAP_RASTER'] !== 'YES') {
        logger.error('Source file is not a raster');
        return;
    }

    logger.debug('\t\t\tUsed ' + driver.description + ' driver to open dataset');

    // raster dimensions
    var size = ds.rasterSize;
    // console.log('Size is ' + size.x + ', ' + size.y);

    // geotransform
    var geotransform = ds.geoTransform;

    // corners
    var corners = {
        'UpperLeft' : {x: 0, y: 0},
        'UpperRight' : {x: size.x, y: 0},
        'BottomRight' : {x: size.x, y: size.y},
        'BottomLeft' : {x: 0, y: size.y},
        'Center' : {x: size.x / 2, y: size.y / 2}
    };

    var wgs84 = gdal.SpatialReference.fromEPSG(4326);
    var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);

    // logger.debug('Corner Coordinates:');
    var footprint_map = {};
    var resultInfo = {};

    // if (driver.description === 'RPFTOC') {
    //     logger.debug('FARTS');
    //
    //
    //
    //     resultInfo = GeoJSON.parse(
    //         {
    //             'name': 'farts',
    //             'lng': -75.534,
    //             'lat': 39.123
    //         },
    //         { 'Point': ['lng', 'lat'] }
    //     );
    // } else {
        var corner_names = Object.keys(corners);
        corner_names.forEach(function (corner_name) {
            // convert pixel x,y to the coordinate system of the raster
            // then transform it to WGS84
            var corner = corners[corner_name];
            var pt_orig = {
                x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
                y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
            };
            var pt_wgs84 = coord_transform.transformPoint(pt_orig);
            // var description = util.format('%s (%d, %d) (%s, %s)',
            //     corner_name,
            //     Math.floor(pt_orig.x * 100) / 100,
            //     Math.floor(pt_orig.y * 100) / 100,
            //     gdal.decToDMS(pt_wgs84.x, 'Long'),
            //     gdal.decToDMS(pt_wgs84.y, 'Lat')
            // );
            // logger.debug(description);
            footprint_map[corner_name] = {
                'lat': pt_wgs84.y,
                'lng': pt_wgs84.x
            };
        });

        // logger.debug(JSON.stringify(footprint_map));
        var bbox =
            [[
                [footprint_map['BottomLeft'].lng, footprint_map['BottomLeft'].lat],
                [footprint_map['UpperLeft'].lng, footprint_map['UpperLeft'].lat],
                [footprint_map['UpperRight'].lng, footprint_map['UpperRight'].lat],
                [footprint_map['BottomRight'].lng, footprint_map['BottomRight'].lat],
                [footprint_map['BottomLeft'].lng, footprint_map['BottomLeft'].lat]
            ]];

        resultInfo = GeoJSON.parse({
            'type': driver.description,
            'filePath': path.dirname(filePath),
            'fileName': path.basename(filePath),
            'footprint': bbox
        }, {
            'Polygon': 'footprint'
        });
    // }

    // logger.debug(JSON.stringify(resultInfo));

    return resultInfo;
};

var fromDir = function(startPath, suffix, results) {

    if (!fs.existsSync(startPath)) {
        logger.debug("no dir ", startPath);
        return results;
    }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            fromDir(filename, suffix, results);
        }
        else if (filename.endsWith(suffix)) {
            results.push(filename);
        }
    }

    return results;
};

module.exports.indexLayerMetadata = function(dataDirectory, fileTypes) {
    logger.debug('\r\nScanning data...\r\n');
    var geoJSON = {
        'type': 'FeatureCollection',
        'features': []
    };
    Object.keys(fileTypes).forEach(function(typeName) {
        logger.debug(typeName);
        var fileType = fileTypes[typeName];
        fileType.extensions.forEach(function(extension) {
            logger.debug('\tSearching for files that end with ' + extension);
            var relevantFiles = [];
            fromDir(dataDirectory, extension, relevantFiles);
            relevantFiles.forEach(function(relevantFile) {
                logger.debug('\t\t' + relevantFile);
                var result = parseMetadataUsingGDAL(relevantFile, fileType.gdalDrivers);
                geoJSON.features.push(result);
            });
        });
        logger.debug();
    });

    var result = JSON.stringify(geoJSON);
    logger.debug(result + '\r\n');
    return result;
};