param(
  [int]$TimeoutSec = 15,
  [int]$ThrottleLimit = 16
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$files = Get-ChildItem (Join-Path $projectRoot 'data') -Filter 'benefits*.json'
$urls = @(foreach ($file in $files) {
  (Get-Content -Raw $file.FullName | ConvertFrom-Json).official_sources.url
}) | Sort-Object -Unique

$results = $urls | ForEach-Object -Parallel {
  $url = $_
  try {
    $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -MaximumRedirection 8 -TimeoutSec $using:TimeoutSec
    [pscustomobject]@{ url = $url; status = [int]$response.StatusCode; result = 'ok'; error = $null }
  } catch {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 8 -TimeoutSec $using:TimeoutSec
      [pscustomobject]@{ url = $url; status = [int]$response.StatusCode; result = 'ok'; error = $null }
    } catch {
      $status = $null
      if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
      $result = if ($status -in 401, 403, 429) { 'access_blocked' } elseif ($status -in 404, 410) { 'broken' } else { 'error' }
      [pscustomobject]@{ url = $url; status = $status; result = $result; error = $_.Exception.Message }
    }
  }
} -ThrottleLimit $ThrottleLimit

$summary = [pscustomobject]@{
  checked = $results.Count
  ok = ($results | Where-Object result -eq 'ok').Count
  access_blocked = ($results | Where-Object result -eq 'access_blocked').Count
  broken = ($results | Where-Object result -eq 'broken').Count
  error = ($results | Where-Object result -eq 'error').Count
}

$summary | Format-List
$results | Where-Object result -ne 'ok' | Sort-Object result, status, url | Format-Table result, status, url -Wrap -AutoSize

if ($summary.broken -gt 0) { exit 1 }
