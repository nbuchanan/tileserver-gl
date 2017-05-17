#!/usr/bin/env bash

echo "iSoDrive!"

CONFIG_FILE=config-raleigh.json
ISODRIVE_PORT=9001

./tileserver-gl-light --config $CONFIG_FILE --port $ISODRIVE_PORT