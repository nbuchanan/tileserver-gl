@ECHO OFF

ECHO "iSoDrive!"

SET WORKING_DIR=lib

SET CONFIG_FILE=%WORKING_DIR%\iSoDrive-config.json

SET ISODRIVE_PORT=9001

%WORKING_DIR%\tileserver-gl-pkg-light.exe --config %CONFIG_FILE% --port %ISODRIVE_PORT%

TIMEOUT /T -1