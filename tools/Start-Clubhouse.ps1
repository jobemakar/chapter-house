$ErrorActionPreference = 'Stop'
$siteRoot = Join-Path $PSScriptRoot 'web'
$serverScript = Join-Path $PSScriptRoot 'serve.ts'
$siteUrl = 'http://127.0.0.1:5190/'
$running = $false
try {
    $health = Invoke-RestMethod ($siteUrl + '__chapter_house') -TimeoutSec 2
    $running = $health.application -eq 'chapter-house'
} catch {}
if (-not $running) {
    $nodeRuntime = (Get-Command node -ErrorAction Stop).Source
    $serverArguments = '"{0}" "{1}" 5190' -f $serverScript, $siteRoot
    Start-Process -FilePath $nodeRuntime -ArgumentList $serverArguments -WindowStyle Hidden -WorkingDirectory $PSScriptRoot
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        try {
            $health = Invoke-RestMethod ($siteUrl + '__chapter_house') -TimeoutSec 1
            if ($health.application -eq 'chapter-house') { $running = $true; break }
        } catch {}
    }
}
if (-not $running) { throw 'Chapter House could not start. Port 5190 may already be in use.' }
Write-Host ('Chapter House is ready: ' + $siteUrl)
