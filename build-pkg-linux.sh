#!/usr/bin/env bash

CONFIG_FILE=package.json
OUTPUT_DIR=packages
declare -a FILE_LIST=( \
  'node_modules/canvas/build/Release/canvas.node' \
  'node_modules/mbtiles/node_modules/sqlite3/lib/binding/node-v46-linux-x64/node_sqlite3.node' \
  'node_modules/node-pngquant-native/bindings/linux/x64/0.12.0/pngquant_native.node' \
  'node_modules/sharp/build/Release/sharp.node' \
);

# Copy native dependencies
rm -rdf $OUTPUT_DIR/*.node
for i in "${FILE_LIST[@]}"
do
  echo "copying $i to be packaged..."
  cp -r $i $OUTPUT_DIR
done

echo "Building with $CONFIG_FILE and pushing results to $OUTPUT_DIR..."

pkg . --targets node4-linux-x64 --out-dir $OUTPUT_DIR