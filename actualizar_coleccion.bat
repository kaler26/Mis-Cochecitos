@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

echo =======================================================
echo   ACTUALIZADOR AUTOMATICO DE LA COLECCION DE COCHES
echo =======================================================
echo.

set "PY_EXE="
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PY_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
) else (
    where py >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        set "PY_EXE=py"
    ) else (
        where python >nul 2>nul
        if !ERRORLEVEL! EQU 0 (
            set "PY_EXE=python"
        )
    )
)

if "%PY_EXE%"=="" (
    echo [ERROR] No se encontro instalacion de Python en el equipo.
    echo Por favor asegurese de tener Python instalado.
    pause
    exit /b 1
)

echo [1/2] Procesando archivo Excel y sincronizando fotos de SinFondo...
"%PY_EXE%" tools\excel_to_json.py --copy-images

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Hubo un problema al procesar el Excel. Revisa los mensajes anteriores.
    pause
    exit /b !ERRORLEVEL!
)

echo.
echo [2/2] Validando catalogo e imagenes...
"%PY_EXE%" tools\test_catalog.py

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [AVISO] Se detecto alguna inconsistencia en las pruebas.
    pause
    exit /b !ERRORLEVEL!
)

echo.
echo =======================================================
echo   ¡COLECCION ACTUALIZADA CON EXITO!
echo =======================================================
echo   - cars.json y special_collections.json han sido actualizados.
echo   - Catalogo principal y pestañas (Fast & Furious, Cultura Pop, Motos) listos.
echo   - Las fotos corregidas han sido sincronizadas en images/.
echo   - Abre GitHub Desktop para hacer "Commit to main" y "Push origin".
echo =======================================================
echo.
pause