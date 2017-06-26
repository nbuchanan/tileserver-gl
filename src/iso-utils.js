#!/usr/bin/env node

'use strict';

var path = require('path'),
    fs = require('fs'),
    filesize = require('filesize');

var clone = require('clone');

var gdal = require('gdal-mbt'),
    util = require('util'),
    GeoJSON = require('geojson'),
    turf = require('turf'),
    logger = require('loglevel').noConflict().getLogger('iSoDrive');

var parseMetadataUsingGDAL = function (filePath, fileType, drivers) {
    // First attempt to open without specifying drivers
    var ds;
    try {
        ds = gdal.open(filePath);
    } catch (err) {
        logger.debug('Unable to read ' + filePath + ' with default open');
    }

    if (!ds) {
        drivers.foreach(function (driver) {
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

    // geotransform
    var geotransform = ds.geoTransform;

    // corners
    var corners = {
        'UpperLeft': {x: 0, y: 0},
        'UpperRight': {x: size.x, y: 0},
        'BottomRight': {x: size.x, y: size.y},
        'BottomLeft': {x: 0, y: size.y},
        'Center': {x: size.x / 2, y: size.y / 2}
    };

    var wgs84 = gdal.SpatialReference.fromEPSG(4326);
    var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);

    var footprint_map = {};
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
        footprint_map[corner_name] = {
            'lat': pt_wgs84.y,
            'lng': pt_wgs84.x
        };
    });

    var bbox =
        [[
            [footprint_map['BottomLeft'].lng, footprint_map['BottomLeft'].lat],
            [footprint_map['UpperLeft'].lng, footprint_map['UpperLeft'].lat],
            [footprint_map['UpperRight'].lng, footprint_map['UpperRight'].lat],
            [footprint_map['BottomRight'].lng, footprint_map['BottomRight'].lat],
            [footprint_map['BottomLeft'].lng, footprint_map['BottomLeft'].lat]
        ]];

    // Use fs.stat to get system level file metadata (size, etc.)
    var fileStats = fs.statSync(filePath);

    var resultInfo = GeoJSON.parse({
        'type': fileType, // TODO better to user driver.description?
        'filePath': path.dirname(filePath),
        'fileName': path.basename(filePath),
        'size': fileStats.size,
        'sizeReadable': filesize(fileStats.size, {round: 0}),
        'footprint': bbox
    }, {
        'Polygon': 'footprint'
    });

    return resultInfo;
};

var getFiles = function(startPath, extRegex, extTypeLookup, results) {

    if (!fs.existsSync(startPath)) {
        logger.debug("no dir ", startPath);
        return results;
    }

    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            getFiles(filename, extRegex, extTypeLookup, results);
        }
        else {
            var found = filename.match(extRegex);
            if (found) {
                // The way things are structured there should be no more than one match
                var extFound = found[0];
                results.push({
                    name: filename,
                    fileType: extTypeLookup[extFound].typeName,
                    gdalDrivers: extTypeLookup[extFound].gdalDrivers
                });
            }
        }
    }

    return results;
};

module.exports.indexLayerMetadata = function (dataDirectory, fileTypes, isoTypes) {
    logger.debug('\r\nScanning data in ' + dataDirectory + ' ...\r\n');
    var geoJSON = {
        'type': 'FeatureCollection',
        'features': []
    };

    // Build look up for extension to assumed raster type. Note that precedence is assumed based on order of config file
    var extensionTypeLookup = {};
    Object.keys(fileTypes).forEach(function (typeName) {
        var fileType = fileTypes[typeName];
        fileType.extensions.forEach(function (extension) {
            if (extensionTypeLookup.hasOwnProperty(extension)) {
                logger.info('\t' + typeName + ': extension already registered as ' + extensionTypeLookup[extension].typeName + ' type.');
            } else {
                extensionTypeLookup[extension] = {typeName: typeName, gdalDrivers: fileType.gdalDrivers};
            }
        });
    });

    // Create regular expression of all relevant extensions so there is only one traversal of the directory hierarchy
    var extensionsRegex = '';
    Object.keys(extensionTypeLookup).forEach(function (extension) {
        extensionsRegex += '(' + extension + ')$|';
    });
    extensionsRegex = extensionsRegex.slice(0, -1); // Remove trailing pipe
    logger.debug('\tExtensions regex: ' + extensionsRegex);
    var extensionsRegexObj = new RegExp(extensionsRegex, 'i'); // Set case insensitive flag

    var relevantFiles = [];
    getFiles(dataDirectory, extensionsRegexObj, extensionTypeLookup, relevantFiles);
    relevantFiles.forEach(function (relevantFile) {
        logger.debug('\t\t' + relevantFile.name);
        var result = parseMetadataUsingGDAL(relevantFile.name, relevantFile.fileType, relevantFile.gdalDrivers);
        // Add found types to lookup
        if (isoTypes) {
            if (!isoTypes.has(relevantFile.fileType)) {
                isoTypes.add(relevantFile.fileType);
            }
            geoJSON.features.push(result);
        }
    });

    logger.debug();

    var result = JSON.stringify(geoJSON);
    logger.debug(result + '\r\n');
    return result;
};