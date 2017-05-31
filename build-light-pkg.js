#!/usr/bin/env node

'use strict';

/*
 * This script creates `tileserver-gl-pkg light` version (without native dependencies)
 */

/* CREATE tileserver-gl-pkg-light */

// SYNC THE `light` FOLDER AND EXCLUDE node_modules
require('child_process').execSync('rsync -av --exclude="light" --exclude=".git" --exclude="node_modules" --exclude=".idea" --delete . light', {
  stdio: 'inherit'
});

// Added assets as needed for pkg
require('child_process').execSync('rsync -av --relative --delete ' +
    './node_modules/mbtiles/lib/ ./node_modules/glyph-pbf-composite/proto/ ./node_modules/sharp/lib/ ' +
    'light', {
    stdio: 'inherit'
});

// PATCH `package.json`
var fs = require('fs');
var packageJson = require('./package');

packageJson.name += '-light';
packageJson.description = 'Map tile server for JSON GL styles (bundled into executable using pkg) - serving vector tiles';
delete packageJson.dependencies['canvas'];
delete packageJson.dependencies['@mapbox/mapbox-gl-native'];
delete packageJson.dependencies['node-pngquant-native'];
delete packageJson.dependencies['sharp'];

delete packageJson.optionalDependencies;
delete packageJson.devDependencies;

var str = JSON.stringify(packageJson, undefined, 2);
fs.writeFileSync('light/package.json', str);
fs.renameSync('light/README_light.md', 'light/README.md');
fs.renameSync('light/Dockerfile_light', 'light/Dockerfile');
