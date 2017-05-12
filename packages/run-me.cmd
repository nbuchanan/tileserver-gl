@ECHO OFF



ECHO "iSoDrive!"



SET CONFIG_FILE=config-raleigh.json


SET ISODRIVE_PORT=9001



.\tileserver-gl-light-win.exe --config %CONFIG_FILE% --port %ISODRIVE_PORT%

PAUSE;