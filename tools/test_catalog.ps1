# Suite de pruebas automatizadas en PowerShell nativo
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$baseDir = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $baseDir "data\cars.json"
$specialJsonPath = Join-Path $baseDir "data\special_collections.json"
$imagesDir = Join-Path $baseDir "images"
$htmlPath = Join-Path $baseDir "index.html"
$jsPath = Join-Path $baseDir "js\app.js"
$cssPath = Join-Path $baseDir "css\style.css"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " SUITE DE VERIFICACION AUTOMATIZADA (PowerShell)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Archivos esenciales
$files = @(
    @{ Path = $jsonPath; Name = "cars.json" },
    @{ Path = $specialJsonPath; Name = "special_collections.json" },
    @{ Path = $htmlPath; Name = "index.html" },
    @{ Path = $jsPath; Name = "app.js" },
    @{ Path = $cssPath; Name = "style.css" }
)

foreach ($f in $files) {
    if (-not (Test-Path $f.Path)) {
        Write-Host "FALTA ARCHIVO CRITICO: $($f.Name)" -ForegroundColor Red
        exit 1
    }
    $size = (Get-Item $f.Path).Length
    Write-Host "[OK] Archivo presente: $($f.Name) ($size bytes)" -ForegroundColor Green
}

# 2. Cargar cars.json
$carsRaw = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
$cars = $carsRaw | ConvertFrom-Json
$carsCount = $cars.Count
Write-Host "`n[OK] Total de coches en cars.json: $carsCount" -ForegroundColor Green
if ($carsCount -lt 1000) {
    Write-Host "Cantidad inesperadamente baja de coches: $carsCount" -ForegroundColor Red
    exit 1
}

# 3. Unicidad de IDs
$ids = $cars | ForEach-Object { $_.id }
$uniqueIds = $ids | Select-Object -Unique
if ($ids.Count -ne $uniqueIds.Count) {
    Write-Host "Existen IDs duplicados en cars.json" -ForegroundColor Red
    exit 1
}
$minId = ($ids | Measure-Object -Minimum).Minimum
$maxId = ($ids | Measure-Object -Maximum).Maximum
if ($minId -ne 1 -or $maxId -ne $carsCount) {
    Write-Host "Rango de IDs inesperado: $minId a $maxId (esperado 1 a $carsCount)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Unicidad de IDs verificada: $carsCount IDs unicos consecutivos (1 a $maxId)" -ForegroundColor Green

# 4. Comprobar que todas las imágenes de coches existen en disco
$missingImages = @()
foreach ($c in $cars) {
    $imgRel = $c.image.Replace('/', '\')
    $imgFull = Join-Path $baseDir $imgRel
    if (-not (Test-Path $imgFull)) {
        $missingImages += "Coche #$($c.id): $imgRel"
    }
}

if ($missingImages.Count -gt 0) {
    Write-Host "[ERROR] Fotografias faltantes: $($missingImages.Count)" -ForegroundColor Red
    $missingImages | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    exit 1
} else {
    Write-Host "[OK] 100% de las $carsCount fotografias existen en disco" -ForegroundColor Green
}

# 5. Comprobar colecciones especiales
$specRaw = [System.IO.File]::ReadAllText($specialJsonPath, [System.Text.Encoding]::UTF8)
$specData = $specRaw | ConvertFrom-Json
$ffCount = $specData.fast_and_furious.Count
$popCount = $specData.cultura_pop.Count
$motoCount = $specData.motos.Count

Write-Host "`n[OK] Fast and Furious: $ffCount modelos" -ForegroundColor Green
Write-Host "[OK] Cultura Pop: $popCount modelos" -ForegroundColor Green
Write-Host "[OK] Motos: $motoCount modelos" -ForegroundColor Green

if ($ffCount -lt 30 -or $popCount -lt 25 -or $motoCount -lt 20) {
    Write-Host "Cantidad inesperada en colecciones especiales" -ForegroundColor Red
    exit 1
}

# Comprobar fotos colecciones especiales
$missingSpecImages = @()
$allSpec = @($specData.fast_and_furious) + @($specData.cultura_pop) + @($specData.motos)
foreach ($item in $allSpec) {
    $imgRel = $item.image.Replace('/', '\')
    $imgFull = Join-Path $baseDir $imgRel
    if (-not (Test-Path $imgFull)) {
        $missingSpecImages += "$($item.brand) $($item.model): $imgRel"
    }
}
if ($missingSpecImages.Count -gt 0) {
    Write-Host "[ERROR] Fotos faltantes en colecciones especiales: $($missingSpecImages.Count)" -ForegroundColor Red
    $missingSpecImages | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    exit 1
} else {
    Write-Host "[OK] 100% de las $($allSpec.Count) fotos de colecciones especiales existen en disco" -ForegroundColor Green
}

# 6. Test de Rutas e Integridad HTML/CSS/JS
$htmlContent = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$jsContent = [System.IO.File]::ReadAllText($jsPath, [System.Text.Encoding]::UTF8)
$cssContent = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)

if (-not ($htmlContent.Contains('href="./css/style.css') -and $htmlContent.Contains('src="./js/app.js') -and $htmlContent.Contains('src="./data/cars.js"'))) {
    Write-Host "Rutas incorrectas en index.html" -ForegroundColor Red
    exit 1
}
Write-Host "`n[OK] Rutas relativas en index.html verificadas" -ForegroundColor Green

if (-not ($htmlContent.Contains('id="floating-back-to-top"') -and $htmlContent.Contains('id="nav-tab-feria"'))) {
    Write-Host "Faltan elementos clave en index.html" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Componentes Modo Feria y Boton Flotante en index.html verificados" -ForegroundColor Green

if (-not ($cssContent.Contains('aspect-ratio: 1 / 1;') -and $cssContent.Contains('safe-area-inset-top'))) {
    Write-Host "Faltan reglas clave en style.css" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Reglas de diseno cuadrado 1:1 y safe-area en style.css verificadas" -ForegroundColor Green

# 7. Test PWA y Modo Offline
$manifestPath = Join-Path $baseDir "manifest.json"
$swPath = Join-Path $baseDir "sw.js"
$icon192 = Join-Path $baseDir "images\icon-192.png"
$icon512 = Join-Path $baseDir "images\icon-512.png"

if (-not (Test-Path $manifestPath) -or -not (Test-Path $swPath) -or -not (Test-Path $icon192) -or -not (Test-Path $icon512)) {
    Write-Host "[ERROR] Faltan archivos requeridos para PWA (manifest, sw.js o iconos)" -ForegroundColor Red
    exit 1
}
if (-not ($htmlContent.Contains('rel="manifest"') -and $htmlContent.Contains('id="offline-modal"') -and $jsContent.Contains('OfflineManager'))) {
    Write-Host "[ERROR] Falta integracion PWA en index.html o app.js" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Soporte PWA, Service Worker, Manifiesto e Iconos Offline verificados" -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " TODAS LAS PRUEBAS AUTOMATIZADAS PASARON CON EXITO!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
exit 0
