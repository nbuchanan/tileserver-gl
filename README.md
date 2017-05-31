![tileserver-gl](https://cloud.githubusercontent.com/assets/59284/18173467/fa3aa2ca-7069-11e6-86b1-0f1266befeb6.jpeg)


# TileServer GL
[![Build Status](https://travis-ci.org/klokantech/tileserver-gl.svg?branch=master)](https://travis-ci.org/klokantech/tileserver-gl)
[![Docker Hub](https://img.shields.io/badge/docker-hub-blue.svg)](https://hub.docker.com/r/klokantech/tileserver-gl/)

Vector and raster maps with GL styles. Server side rendering by Mapbox GL Native. Map tile server for Mapbox GL JS, Android, iOS, Leaflet, OpenLayers, GIS via WMTS, etc.

## Get Started

Install `tileserver-gl` with server-side raster rendering of vector tiles with npm

```bash
npm install -g tileserver-gl
```

Now download vector tiles from [OpenMapTiles](https://openmaptiles.org/downloads/).

```bash
curl -o zurich_switzerland.mbtiles https://openmaptiles.os.zhdk.cloud.switch.ch/v3.3/extracts/zurich_switzerland.mbtiles
```

Start `tileserver-gl` with the downloaded vector tiles.

```bash
tileserver-gl zurich_switzerland.mbtiles
```

Alternatively, you can use the `tileserver-gl-light` package instead, which is pure javascript (does not have any native dependencies) and can run anywhere, but does not contain rasterization on the server side made with MapBox GL Native.

## Using Docker

An alternative to npm to start the packed software easier is to install [Docker](http://www.docker.com/) on your computer and then run in the directory with the downloaded MBTiles the command:

```bash
docker run -it -v $(pwd):/data -p 8080:80 klokantech/tileserver-gl
```

This will download and start a ready to use container on your computer and the maps are going to be available in webbrowser on localhost:8080.

On laptop you can use [Docker Kitematic](https://kitematic.com/) and search "tileserver-gl" and run it, then drop in the 'data' folder the MBTiles.

## Documentation

You can read full documentation of this project at http://tileserver.readthedocs.io/.

## Using pkg module

The [pkg node module](https://www.npmjs.com/package/pkg) can be used to create a bundle that does not require a target machine
to have node.js installed. To distinguish this addition feature from the main project the name was updated to tileserver-gl-pkg.

### Create Package

Currently node 4 is the supported target based on the current setup with 
[tileserver-gl](https://github.com/klokantech/tileserver-gl) (tested with 4.6.2). Only _tileserver-gl-pkg-light_ is supported on Windows since 
[MapBox GL Native](https://github.com/mapbox/mapbox-gl-native). By default source data will be taken from a local directory named _data_
and the output will be placed in a _packages_ directory. 
See [the manual](https://www.npmjs.com/package/pkg#config) for more explanation _pkg_ build options.

#### tileserver-gl-pkg

To create the tileserver-gl-pkg executable run `npm run package`.

#### tileserver-gl-pkg-light

The "light" build process requires a local installation of _rsync_. To create the tileserver-gl-pkg-light executable 
run `npm run package-light`.

### Run Package

Run the relevant _run-me*_ script for your platform in the [packages](./packages) directory. There is also a shortcut to
open the corresponding URL in your browser. 