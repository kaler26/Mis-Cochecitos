# ==============================================================================
# EXPORTADOR DEL CATÁLOGO DE COCHES (EXCEL -> JSON & IMÁGENES)
# 100% Nativo PowerShell / .NET - Sin dependencias externas
# ==============================================================================

param(
    [string]$ExcelPath = "F:\Mis Cochecitos\1 64\1 64.xlsx",
    [string]$SinFondoDir = "F:\Mis Cochecitos\1 64\SinFondo",
    [string]$FotosDir = "F:\Mis Cochecitos\1 64\Fotos",
    [string]$DestImagesDir = "images",
    [string]$CarsJsonPath = "data\cars.json",
    [string]$CarsJsPath = "data\cars.js",
    [string]$SpecialJsonPath = "data\special_collections.json",
    [string]$SpecialJsPath = "data\special_collections.js"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================="
Write-Host " ACTUALIZANDO CATALOGO MIS COCHECITOS (POWERSHELL)"
Write-Host "=================================================="

# Validar existencia de Excel
if (-not (Test-Path $ExcelPath)) {
    Write-Error "No se encontro el archivo Excel maestro en: $ExcelPath"
    exit 1
}

# Cargar librerias de compresion
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Asegurar carpetas de destino
if (-not (Test-Path $DestImagesDir)) { New-Item -ItemType Directory -Path $DestImagesDir -Force | Out-Null }
if (-not (Test-Path "data")) { New-Item -ItemType Directory -Path "data" -Force | Out-Null }

# 1. Indexar fotos disponibles en SinFondo y Fotos
Write-Host "[1/5] Indexando fotografias locales..."

$sinFondoFiles = @{}
$sinFondoById = @{}
if (Test-Path $SinFondoDir) {
    Get-ChildItem -Path $SinFondoDir -File | ForEach-Object {
        $sinFondoFiles[$_.Name.ToLower()] = $_.FullName
        if ($_.BaseName -match '^\d{1,4}') {
            $idPrefix = [int]$matches[0]
            if (-not $sinFondoById.ContainsKey($idPrefix)) {
                $sinFondoById[$idPrefix] = $_.FullName
            }
        }
    }
}

$fotosFiles = @{}
$fotosById = @{}
if (Test-Path $FotosDir) {
    Get-ChildItem -Path $FotosDir -File | ForEach-Object {
        $fotosFiles[$_.Name.ToLower()] = $_.FullName
        if ($_.BaseName -match '^\d{1,4}') {
            $idPrefix = [int]$matches[0]
            if (-not $fotosById.ContainsKey($idPrefix)) {
                $fotosById[$idPrefix] = $_.FullName
            }
        }
    }
}

Write-Host "  * Fotos en SinFondo: $($sinFondoFiles.Count)"
Write-Host "  * Fotos en Fotos:     $($fotosFiles.Count)"

# 2. Abrir Excel y extraer sharedStrings, sheet1 y rels
Write-Host "[2/5] Leyendo estructura interna de 1 64.xlsx..."
$zip = [System.IO.Compression.ZipFile]::OpenRead($ExcelPath)

# Shared Strings
$entrySst = $zip.GetEntry("xl/sharedStrings.xml")
$readerSst = New-Object System.IO.StreamReader($entrySst.Open(), [System.Text.Encoding]::UTF8)
$docSst = [xml]$readerSst.ReadToEnd()
$readerSst.Dispose()
$strings = @()
foreach ($node in $docSst.sst.ChildNodes) {
    if ($node.Name -eq "si") { $strings += $node.InnerText }
}
Write-Host "  * Textos compartidos: $($strings.Count)"

# Hyperlinks
$relsEntry = $zip.GetEntry("xl/worksheets/_rels/sheet1.xml.rels")
$hlMap = @{}
if ($relsEntry) {
    $readerRels = New-Object System.IO.StreamReader($relsEntry.Open(), [System.Text.Encoding]::UTF8)
    $docRels = [xml]$readerRels.ReadToEnd()
    $readerRels.Dispose()
    foreach ($rel in $docRels.Relationships.Relationship) {
        if ($rel.Type -match "hyperlink") { $hlMap[$rel.Id] = $rel.Target }
    }
}

# Sheet1.xml
$entrySheet = $zip.GetEntry("xl/worksheets/sheet1.xml")
$readerSheet = New-Object System.IO.StreamReader($entrySheet.Open(), [System.Text.Encoding]::UTF8)
$sheetDoc = [xml]$readerSheet.ReadToEnd()
$readerSheet.Dispose()
$zip.Dispose()

$rows = $sheetDoc.worksheet.sheetData.row

# Helper para resolver imagen fisica y copiar a images/
$script:copiedCount = 0

function Resolve-And-Copy-Image([string]$preferredName, [int]$idNum, [string]$subType = "car") {
    $foundPath = $null
    
    # 1. Si es un coche principal con ID numerico
    if ($subType -eq "car" -and $idNum -gt 0) {
        if ($sinFondoById.ContainsKey($idNum)) {
            $foundPath = $sinFondoById[$idNum]
        } elseif ($fotosById.ContainsKey($idNum)) {
            $foundPath = $fotosById[$idNum]
        }
    }
    
    # 2. Busqueda por nombre de archivo
    if (-not $foundPath -and $preferredName) {
        $cleanName = [System.IO.Path]::GetFileName($preferredName).ToLower()
        if ($sinFondoFiles.ContainsKey($cleanName)) {
            $foundPath = $sinFondoFiles[$cleanName]
        } elseif ($fotosFiles.ContainsKey($cleanName)) {
            $foundPath = $fotosFiles[$cleanName]
        }
    }

    if ($foundPath) {
        $finalFileName = [System.IO.Path]::GetFileName($foundPath)
        $destPath = Join-Path $DestImagesDir $finalFileName
        if (-not (Test-Path $destPath) -or ((Get-Item $foundPath).Length -ne (Get-Item $destPath).Length)) {
            Copy-Item -Path $foundPath -Destination $destPath -Force
            $script:copiedCount++
        }
        return "images/$finalFileName"
    }

    return $null
}

# 3. Procesar catalogo principal (Columnas A:G)
Write-Host "[3/5] Procesando catalogo principal..."
$carsList = [System.Collections.Generic.List[PSCustomObject]]::new()

foreach ($row in $rows) {
    $rowNum = [int]$row.r
    if ($rowNum -lt 4) { continue }
    
    $cells = @{}
    foreach ($c in $row.c) {
        $col = $c.r -replace '\d+', ''
        $t = $c.t
        $v = ""
        if ($c.v) {
            $raw = $c.v
            if ($t -eq "s") {
                $idx = [int]$raw
                if ($idx -lt $strings.Count) { $v = $strings[$idx] }
            } else {
                $v = $raw
            }
        }
        $cells[$col] = $v
    }

    if ($cells.ContainsKey("A") -and $cells["A"] -ne "") {
        $carId = 0
        if ([int]::TryParse($cells["A"], [ref]$carId) -and $carId -gt 0) {
            $brand = if ($cells.ContainsKey("B") -and $cells["B"].Trim()) { $cells["B"].Trim() } else { $null }
            $model = if ($cells.ContainsKey("C") -and $cells["C"].Trim()) { $cells["C"].Trim() } else { $null }
            $manufacturer = if ($cells.ContainsKey("D") -and $cells["D"].Trim()) { $cells["D"].Trim() } else { $null }
            
            $year = $null
            if ($cells.ContainsKey("E") -and $cells["E"].Trim()) {
                $yInt = 0
                if ([int]::TryParse($cells["E"].Trim(), [ref]$yInt)) { $year = $yInt } else { $year = $cells["E"].Trim() }
            }
            
            $color = if ($cells.ContainsKey("F") -and $cells["F"].Trim()) { $cells["F"].Trim() } else { $null }
            
            $competition = $null
            if ($cells.ContainsKey("G") -and $cells["G"].Trim()) {
                $cStr = $cells["G"].Trim().ToLower()
                if ($cStr -in @("si", "si", "yes", "true", "1")) { $competition = $true }
                elseif ($cStr -in @("no", "false", "0")) { $competition = $false }
            }

            # Buscar imagen asociada
            $imgRelPath = Resolve-And-Copy-Image "" $carId "car"
            if (-not $imgRelPath) {
                $padded = "{0:D4}" -f $carId
                $imgRelPath = "images/$padded - $brand $model.png"
            }

            $carsList.Add([PSCustomObject]@{
                id = $carId
                brand = $brand
                model = $model
                manufacturer = $manufacturer
                year = $year
                color = $color
                competition = $competition
                image = $imgRelPath
            })
        }
    }
}

Write-Host "  * Total coches procesados: $($carsList.Count)"

# 4. Procesar Colecciones Especiales (Fast & Furious, Cultura Pop, Motos)
Write-Host "[4/5] Procesando colecciones especiales..."

function Get-SpecialItems($startRow, $endRow, $type) {
    $list = [System.Collections.Generic.List[PSCustomObject]]::new()
    foreach ($row in $rows) {
        $rowNum = [int]$row.r
        if ($rowNum -ge $startRow -and $rowNum -le $endRow) {
            $cells = @{}
            foreach ($c in $row.c) {
                $col = $c.r -replace '\d+', ''
                $t = $c.t
                $v = ""
                if ($c.v) {
                    $raw = $c.v
                    if ($t -eq "s") {
                        $idx = [int]$raw
                        if ($idx -lt $strings.Count) { $v = $strings[$idx] }
                    } else { $v = $raw }
                }
                $cells[$col] = $v
            }

            if ($cells.ContainsKey("I") -and $cells["I"] -ne "") {
                $idVal = 0
                if ([int]::TryParse($cells["I"], [ref]$idVal) -and $idVal -gt 0) {
                    $brand = if ($cells.ContainsKey("J") -and $cells["J"].Trim()) { $cells["J"].Trim() } else { $null }
                    $model = if ($cells.ContainsKey("K") -and $cells["K"].Trim()) { $cells["K"].Trim() } else { $null }
                    $mfr = if ($cells.ContainsKey("L") -and $cells["L"].Trim()) { $cells["L"].Trim() } else { $null }
                    
                    $year = $null
                    if ($cells.ContainsKey("M") -and $cells["M"].Trim()) {
                        $yInt = 0
                        if ([int]::TryParse($cells["M"].Trim(), [ref]$yInt)) { $year = $yInt } else { $year = $cells["M"].Trim() }
                    }

                    if ($type -eq "ff") {
                        $color = if ($cells.ContainsKey("N") -and $cells["N"].Trim()) { $cells["N"].Trim() } else { $null }
                        $movie = if ($cells.ContainsKey("O") -and $cells["O"].Trim()) { $cells["O"].Trim() } else { $null }
                        $paddedId = "{0:D2}" -f $idVal
                        
                        $foundFile = $null
                        foreach ($k in $sinFondoFiles.Keys) {
                            if ($k -match "fast.*$paddedId") { $foundFile = $sinFondoFiles[$k]; break }
                        }
                        if (-not $foundFile) {
                            foreach ($k in $fotosFiles.Keys) {
                                if ($k -match "fast.*$paddedId") { $foundFile = $fotosFiles[$k]; break }
                            }
                        }
                        
                        $imgFinal = if ($foundFile) {
                            $fname = [System.IO.Path]::GetFileName($foundFile)
                            $dst = Join-Path $DestImagesDir $fname
                            if (-not (Test-Path $dst) -or ((Get-Item $foundFile).Length -ne (Get-Item $dst).Length)) {
                                Copy-Item -Path $foundFile -Destination $dst -Force
                                $script:copiedCount++
                            }
                            "images/$fname"
                        } else { "images/Fast and Furious $paddedId - $brand $model.png" }

                        $list.Add([PSCustomObject]@{
                            id = $idVal
                            brand = $brand
                            model = $model
                            manufacturer = $mfr
                            year = $year
                            color = $color
                            movie = $movie
                            image = $imgFinal
                        })
                    }
                    elseif ($type -eq "pop") {
                        $universe = if ($cells.ContainsKey("N") -and $cells["N"].Trim()) { $cells["N"].Trim() } else { $null }
                        $paddedId = "{0:D2}" -f $idVal

                        $foundFile = $null
                        foreach ($k in $sinFondoFiles.Keys) {
                            if ($k -match "cultura.*pop.*$paddedId") { $foundFile = $sinFondoFiles[$k]; break }
                        }
                        if (-not $foundFile) {
                            foreach ($k in $fotosFiles.Keys) {
                                if ($k -match "cultura.*pop.*$paddedId") { $foundFile = $fotosFiles[$k]; break }
                            }
                        }

                        $imgFinal = if ($foundFile) {
                            $fname = [System.IO.Path]::GetFileName($foundFile)
                            $dst = Join-Path $DestImagesDir $fname
                            if (-not (Test-Path $dst) -or ((Get-Item $foundFile).Length -ne (Get-Item $dst).Length)) {
                                Copy-Item -Path $foundFile -Destination $dst -Force
                                $script:copiedCount++
                            }
                            "images/$fname"
                        } else { "images/Cultura POP $paddedId - $brand $model.png" }

                        $list.Add([PSCustomObject]@{
                            id = $idVal
                            brand = $brand
                            model = $model
                            manufacturer = $mfr
                            year = $year
                            universe = $universe
                            image = $imgFinal
                        })
                    }
                    elseif ($type -eq "moto") {
                        $color = if ($cells.ContainsKey("N") -and $cells["N"].Trim()) { $cells["N"].Trim() } else { $null }
                        $paddedId = "{0:D2}" -f $idVal

                        $foundFile = $null
                        foreach ($k in $sinFondoFiles.Keys) {
                            if ($k -match "moto.*$paddedId") { $foundFile = $sinFondoFiles[$k]; break }
                        }
                        if (-not $foundFile) {
                            foreach ($k in $fotosFiles.Keys) {
                                if ($k -match "moto.*$paddedId") { $foundFile = $fotosFiles[$k]; break }
                            }
                        }

                        $imgFinal = if ($foundFile) {
                            $fname = [System.IO.Path]::GetFileName($foundFile)
                            $dst = Join-Path $DestImagesDir $fname
                            if (-not (Test-Path $dst) -or ((Get-Item $foundFile).Length -ne (Get-Item $dst).Length)) {
                                Copy-Item -Path $foundFile -Destination $dst -Force
                                $script:copiedCount++
                            }
                            "images/$fname"
                        } else { "images/Motos $paddedId - $brand $model.png" }

                        $list.Add([PSCustomObject]@{
                            id = $idVal
                            brand = $brand
                            model = $model
                            manufacturer = $mfr
                            year = $year
                            color = $color
                            image = $imgFinal
                        })
                    }
                }
            }
        }
    }
    return $list
}

$ffList = Get-SpecialItems 45 78 "ff"
$popList = Get-SpecialItems 82 110 "pop"
$motoList = Get-SpecialItems 114 136 "moto"

Write-Host "  * Fast and Furious: $($ffList.Count)"
Write-Host "  * Cultura Pop:     $($popList.Count)"
Write-Host "  * Motos:           $($motoList.Count)"

# 5. Generar Archivos JSON y JS
Write-Host "[5/5] Escribiendo archivos data/*.json y data/*.js..."

# cars.json
$carsJsonText = ConvertTo-Json -InputObject @($carsList) -Depth 5
[System.IO.File]::WriteAllText((Resolve-Path $CarsJsonPath).Path, $carsJsonText, [System.Text.Encoding]::UTF8)

# cars.js
$carsJsContent = "window.CATALOGO_CARS = " + ($carsList | ConvertTo-Json -Compress -Depth 5) + ";"
[System.IO.File]::WriteAllText((Resolve-Path $CarsJsPath).Path, $carsJsContent, [System.Text.Encoding]::UTF8)

# special_collections.json
$specialObj = [ordered]@{
    fast_and_furious = @($ffList)
    cultura_pop = @($popList)
    motos = @($motoList)
}
$specialJsonText = ConvertTo-Json -InputObject $specialObj -Depth 5
[System.IO.File]::WriteAllText((Resolve-Path $SpecialJsonPath).Path, $specialJsonText, [System.Text.Encoding]::UTF8)

# special_collections.js
$specialJsContent = "window.SPECIAL_COLLECTIONS = " + ($specialObj | ConvertTo-Json -Compress -Depth 5) + ";"
[System.IO.File]::WriteAllText((Resolve-Path $SpecialJsPath).Path, $specialJsContent, [System.Text.Encoding]::UTF8)

Write-Host "=================================================="
Write-Host " ACTUALIZACION COMPLETADA CON EXITO"
Write-Host "=================================================="
Write-Host " Catalogo principal: $($carsList.Count) coches (IDs 1..$($carsList[$carsList.Count - 1].id))"
Write-Host " Fast and Furious:   $($ffList.Count) modelos"
Write-Host " Cultura Pop:        $($popList.Count) modelos"
Write-Host " Motos:              $($motoList.Count) modelos"
Write-Host " Imagenes copiadas:  $script:copiedCount a $DestImagesDir"
Write-Host "=================================================="
