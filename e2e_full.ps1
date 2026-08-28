# Full admin E2E on PostgreSQL — verification matrix (curl.exe, no quoting pitfalls)
$ErrorActionPreference = 'Stop'
$API = 'http://localhost:8000'
$NX = 'http://localhost:3000'

function Login($email, $pass, $admin) {
  $url = if ($admin) { "$API/api/v1/accounts/admin/login/" } else { "$API/api/v1/accounts/token/" }
  $r = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Post -ContentType 'application/json' `
    -Body (@{email=$email; password=$pass} | ConvertTo-Json)
  $ck = ([string]($r.Headers['Set-Cookie'] | Where-Object { $_ -like 'refresh_token=*' } | Select-Object -First 1)).Split(';')[0].Replace('refresh_token=','')
  $access = ($r.Content | ConvertFrom-Json).data.access
  return @{ cookie = $ck; access = $access }
}

function NCode([string]$base, [string]$method, [string]$path, [string]$cookie, [string]$bodyFile) {
  $a = @('-s', '-o', 'NUL', '-w', '%{http_code}')
  if ($method -ne 'GET') { $a += @('-X', $method) }
  if ($cookie) { $a += @('-H', "Cookie: $cookie") }
  if ($bodyFile) { $a += @('-H', 'Content-Type: application/json', '--data-binary', "@$bodyFile") }
  $a += @("$base$path")
  return (& curl.exe $a)
}

Start-Sleep -Seconds 1
$admin = Login 'admin@malaikanest.com' 'AdminPass123!' $true
Start-Sleep -Seconds 1
$cust  = Login 'customer@malaikanest.com' 'CustPass123!' $false
$auth = "Authorization: Bearer $($admin.access)"

# ── 1. Django admin endpoints (Postgres) + pagination envelope ──────────────
$t = [System.Diagnostics.Stopwatch]::StartNew()
$endps = @(
  @{ n='orders';   u="$API/api/v1/products/admin/orders/?limit=50" },
  @{ n='products'; u="$API/api/v1/products/admin/products/?limit=50" },
  @{ n='users';    u="$API/api/v1/products/admin/users/?limit=50" }
)
foreach ($e in $endps) {
  $t.Restart()
  $body = curl.exe -s -H $auth $e.u
  $t.Stop()
  $j = $body | ConvertFrom-Json
  $env = $j.data
  $isPaged = $null -ne $env.results -and $null -ne $env.count
  Write-Output ("E1 {0} paged={1} count={2} rows={3} rt={4}ms" -f $e.n, $isPaged, $env.count, @($env.results).Count, [math]::Round($t.Elapsed.TotalMilliseconds))
}

# analytics + reports (server-side aggregates)
$an = ((curl.exe -s -H $auth "$API/api/v1/orders/admin/analytics/") | ConvertFrom-Json).data
$rp = ((curl.exe -s -H $auth "$API/api/v1/orders/admin/reports/?days=30") | ConvertFrom-Json).data
Write-Output ("E2 analytics revenue=$($an.total_revenue) orders=$($an.total_orders) users=$($an.total_users) lowstock=$(@($an.low_stock).Count)")
Write-Output ("E3 reports totalRevenue=$($rp.totalRevenue) statuses=$(@($rp.ordersByStatus).Count) period=$($rp.period)")

# ── 2. Status transition respects state machine ─────────────────────────────
$ordersEnv = ((curl.exe -s -H $auth "$API/api/v1/products/admin/orders/?limit=50") | ConvertFrom-Json).data
$one = @($ordersEnv.results) | Where-Object { $_.receipt_number -eq 'MN-E2E-002' }
if ($one) {
  $tid = $one.id
  $d1 = curl.exe -s -X PATCH -H $auth -H 'Content-Type: application/json' -d '{\"status\":\"paid\"}' "$API/api/v1/products/admin/orders/$tid/update_status/"
  $stNew = ($d1 | ConvertFrom-Json).data.status
  $d2 = curl.exe -s -X PATCH -H $auth -H 'Content-Type: application/json' -d '{\"status\":\"pending\"}' "$API/api/v1/products/admin/orders/$tid/update_status/"
     $illegal = ($d2 | ConvertFrom-Json).error.message
  Write-Output ("E4 valid pending->paid=" + $stNew + " | illegal paid->pending=" + $illegal)
}

# ── 3. Next guard + Postgres CMS round-trip ─────────────────────────────────
$tmp = "$env:TEMP\probe.json"
[System.IO.File]::WriteAllText($tmp, '{"name":"PG Probe","location":"Nairobi","rating":5,"text":"pg","position":1}')

Write-Output ("E5 guard  noCookie=" + (NCode $NX 'GET' '/api/admin/testimonials' '' $null) `
  + " garbage=" + (NCode $NX 'GET' '/api/admin/testimonials' 'refresh_token=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' $null) `
  + " customer=" + (NCode $NX 'GET' '/api/admin/testimonials' "refresh_token=$($cust.cookie)" $null) `
  + " adminGET=" + (NCode $NX 'GET' '/api/admin/testimonials' "refresh_token=$($admin.cookie)" $null) `
  + " adminPOST=" + (NCode $NX 'POST' '/api/admin/testimonials' "refresh_token=$($admin.cookie)" $tmp))
Write-Output ("E6 legacy-cookie admin=" + (NCode $NX 'GET' '/api/admin/blog' "refresh=$($admin.cookie)" $null))
Write-Output ("E7 CMS blog=" + (NCode $NX 'GET' '/api/admin/blog' "refresh_token=$($admin.cookie)" $null) `
  + " branding=" + (NCode $NX 'GET' '/api/admin/branding' "refresh_token=$($admin.cookie)" $null) `
  + " content=" + (NCode $NX 'GET' '/api/admin/content' "refresh_token=$($admin.cookie)" $null) `
  + " thrifted=" + (NCode $NX 'GET' '/api/admin/thrifted' "refresh_token=$($admin.cookie)" $null) `
  + " loyalty=" + (NCode $NX 'GET' '/api/admin/loyalty' "refresh_token=$($admin.cookie)" $null) `
  + " testimonials=" + (NCode $NX 'GET' '/api/admin/testimonials' "refresh_token=$($admin.cookie)" $null))

# ── 4. Performance: repeated aggregate call timing ──────────────────────────
$sw = [System.Diagnostics.Stopwatch]::StartNew()
1..5 | ForEach-Object { curl.exe -s -H $auth "$API/api/v1/orders/admin/analytics/" | Out-Null }
$sw.Stop()
Write-Output ("E8 analytics avg-rt(5)=" + [math]::Round($sw.Elapsed.TotalMilliseconds / 5) + "ms")
