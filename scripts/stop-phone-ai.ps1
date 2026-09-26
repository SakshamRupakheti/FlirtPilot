$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'work/phone-processes.json'
if (-not (Test-Path -LiteralPath $path)) { Write-Host 'No phone bridge process record.'; exit 0 }
$record = Get-Content $path -Raw | ConvertFrom-Json
foreach ($name in @('relay', 'tunnel')) {
  $process = Get-Process -Id $record.$name -ErrorAction SilentlyContinue
  $startedKey = $name + 'Started'
  if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $record.$startedKey) { Stop-Process -Id $process.Id }
}
Write-Host 'Phone bridge stopped. Ollama stays local. Restarting creates a new tunnel address.'
