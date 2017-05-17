@ECHO OFF

SET CONFIG_FILE=package.json
SET OUTPUT_DIR=packages
SET FILE_LIST=(^
  node_modules\mbtiles\node_modules\sqlite3\lib\binding\node-v46-win32-x64\node_sqlite3.node^
  node_modules\sharp\build\Release\sharp.node^
  node_modules\canvas\build\Release\canvas.node^
)

:: Copy native dependencies
FOR %%i IN %FILE_LIST% do XCOPY %%i %OUTPUT_DIR% /E /Y

ECHO "Building with %CONFIG_FILE% and pushing results to %OUTPUT_DIR%..."

CMD /C "pkg . --targets node4-win-x64 --out-dir %OUTPUT_DIR%"

TIMEOUT /T -1