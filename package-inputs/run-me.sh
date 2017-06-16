#!/usr/bin/env bash

echo "iSoDrive!"

CONFIG_FILE=iSoDrive-config.json
ISODRIVE_PORT=9001

./tileserver-gl-pkg-light --config $CONFIG_FILE --port $ISODRIVE_PORT