@ECHO OFF

ECHO "iSoDrive!"

SET CONFIG_FILE=config-raleigh-test.json

SET ISODRIVE_PORT=9001

.\tileserver-gl-light.exe --config %CONFIG_FILE% --port %ISODRIVE_PORT%

TIMEOUT /T -1