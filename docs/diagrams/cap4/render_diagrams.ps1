# Render de diagramas PlantUML - Capitulo 4
#
# Requisitos:
# - Opcion A: tener `plantuml` en PATH.
# - Opcion B: colocar `plantuml.jar` en `docs/tools/plantuml.jar`.
#
# Descarga oficial:
# https://plantuml.com/es/download
#
# Uso:
# powershell -ExecutionPolicy Bypass -File docs/diagrams/cap4/render_diagrams.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..\..')).Path

$pngDir = Join-Path $repoRoot 'figuras\cap4'
$svgDir = Join-Path $pngDir 'svg'
New-Item -ItemType Directory -Path $pngDir -Force | Out-Null
New-Item -ItemType Directory -Path $svgDir -Force | Out-Null

$diagrams = Get-ChildItem -Path $scriptDir -Filter '*.puml' | Sort-Object Name
if (-not $diagrams -or $diagrams.Count -eq 0) {
  throw "No se encontraron archivos .puml en $scriptDir"
}

$plantumlCmd = Get-Command plantuml -ErrorAction SilentlyContinue
$jarPath = Join-Path $repoRoot 'docs\tools\plantuml.jar'

if (-not $plantumlCmd -and -not (Test-Path $jarPath)) {
  throw @"
No se encontro PlantUML.
1) Instala 'plantuml' en PATH, o
2) Descarga plantuml.jar y guardalo en: $jarPath
"@
}

$pngOutRel = '..\..\..\figuras\cap4'
$svgOutRel = '..\..\..\figuras\cap4\svg'

function Invoke-PlantUml {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$ArgsList
  )

  if ($plantumlCmd) {
    & $plantumlCmd.Source @ArgsList
    return
  }

  & java -jar $jarPath @ArgsList
}

Push-Location $scriptDir
try {
  foreach ($diagram in $diagrams) {
    Write-Host "[PlantUML] PNG  -> $($diagram.Name)"
    Invoke-PlantUml -ArgsList @('-charset', 'UTF-8', '-tpng', '-o', $pngOutRel, $diagram.Name)

    Write-Host "[PlantUML] SVG  -> $($diagram.Name)"
    Invoke-PlantUml -ArgsList @('-charset', 'UTF-8', '-tsvg', '-o', $svgOutRel, $diagram.Name)
  }
}
finally {
  Pop-Location
}

Write-Host "Render completado."
Write-Host "PNG: $pngDir"
Write-Host "SVG: $svgDir"
