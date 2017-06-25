@ECHO OFF

ECHO "iSoDrive!"

SET CONFIG_FILE=lib\iSoDrive-config.json

SET ISODRIVE_PORT=9001

.\lib\tileserver-gl-pkg-light.exe --config %CONFIG_FILE% --port %ISODRIVE_PORT%

TIMEOUT /T -1