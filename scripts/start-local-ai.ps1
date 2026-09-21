$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $projectRoot 'work/ollama/ollama.exe'
if (-not (Test-Path -LiteralPath $runtime)) {
  throw 'Download and extract the official Ollama Windows portable ZIP into work/ollama first. See DEVELOPMENT.md.'
}
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = Join-Path $projectRoot 'work/ollama-models'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_FLASH_ATTENTION = '1'
$env:OLLAMA_KV_CACHE_TYPE = 'q8_0'
try {
  Invoke-RestMethod 'http://127.0.0.1:11434/api/version' | Out-Null
  Write-Host 'Ollama is already running on port 11434.'
} catch {
  $process = Start-Process -FilePath $runtime -ArgumentList 'serve' -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'work/ollama.stdout.log') -RedirectStandardError (Join-Path $projectRoot 'work/ollama.stderr.log')
  Write-Host "Started local Ollama (PID $($process.Id))."
}
