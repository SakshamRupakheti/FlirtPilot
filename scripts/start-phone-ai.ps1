$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$tunnelExe = Join-Path $projectRoot 'work/cloudflared.exe'
if (-not (Test-Path -LiteralPath $tunnelExe)) { throw 'Download official cloudflared-windows-amd64.exe to work/cloudflared.exe first.' }
& (Join-Path $PSScriptRoot 'start-local-ai.ps1')
if (Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue) { throw 'A phone bridge already runs on port 8788. Stop it with scripts/stop-phone-ai.ps1 before restarting.' }
$nodeExe = (Get-Command node).Source
$relay = Start-Process -FilePath $nodeExe -ArgumentList '--import tsx scripts/local-relay.ts' -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'work/relay.stdout.log') -RedirectStandardError (Join-Path $projectRoot 'work/relay.stderr.log')
$tunnel = Start-Process -FilePath $tunnelExe -ArgumentList 'tunnel --url http://127.0.0.1:8788 --no-autoupdate' -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $projectRoot 'work/tunnel.stdout.log') -RedirectStandardError (Join-Path $projectRoot 'work/tunnel.stderr.log')
@{ relay = $relay.Id; tunnel = $tunnel.Id; relayStarted = $relay.StartTime.ToUniversalTime().ToString('o'); tunnelStarted = $tunnel.StartTime.ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content (Join-Path $projectRoot 'work/phone-processes.json')
for ($attempt = 0; $attempt -lt 45; $attempt++) {
  Start-Sleep -Seconds 1
  $log = Get-Content (Join-Path $projectRoot 'work/tunnel.stderr.log') -Raw -ErrorAction SilentlyContinue
  if ($log -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
    $address = $Matches[0]
    $tokenPath = Join-Path $projectRoot 'work/relay-token.txt'
    if (-not (Test-Path -LiteralPath $tokenPath)) { continue }
    $code = (Get-Content $tokenPath -Raw).Trim()
    @("Open https://flirt-pilot-lake.vercel.app/reply on your phone.", '', "Laptop tunnel address: $address", '', "Private connection code: $code", '', 'Keep this code private. Paste it into Connect your free wingman. Do not post it in chat or GitHub.', 'Keep this laptop awake. Restarting the tunnel changes its address.', 'Stop: powershell -File scripts/stop-phone-ai.ps1') | Set-Content (Join-Path $projectRoot 'work/phone-connection.txt')
    Write-Host "Phone tunnel: $address"
    Write-Host 'Private pairing details are in work/phone-connection.txt (not committed).'
    exit 0
  }
}
throw 'Tunnel startup timed out. Check work/tunnel.stderr.log and run scripts/stop-phone-ai.ps1 before retrying.'
