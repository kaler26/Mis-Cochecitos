@echo off
chcp 65001 > nul
echo =======================================================
echo   ACTUALIZADOR AUTOMATICO DE LA COLECCION DE COCHES
echo =======================================================
echo.

echo [1/2] Procesando archivo Excel y copiando nuevas fotos de SinFondo...
python tools/excel_to_json.py --copy-images

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Hubo un problema al procesar el Excel. Revisa los mensajes anteriores.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Validando catalogo e imagenes...
python tools/test_catalog.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Se detecto alguna inconsistencia en las pruebas.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
echo   ¡COLECCION ACTUALIZADA CON EXITO!
echo =======================================================
echo   - cars.json ha sido actualizado.
echo   - Las nuevas fotos de SinFondo han sido copiadas a images/.
echo   - Si tienes tu repositorio en GitHub, sube los cambios ejecutando:
echo       git add .
echo       git commit -m "Actualizar coleccion"
echo       git push
echo =======================================================
echo.
pause
