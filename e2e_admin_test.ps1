# E2E verification of Malaika Nest admin flows (local dev) — Invoke-* edition
$ErrorActionPreference = 'Stop'
$API = 'http://localhost:8000'
$NX = 'http://localhost:3000'

function Json([object]$o) { $o | ConvertTo-Json -Compress }

# ── 1. Customer login ─────────────────────────────────────────────────────────
$r = Invoke-WebRequest -UseBasicParsing -Uri "$API/api/v1/accounts/token/" -Method Post `
  -ContentType 'application/json' -Body (@{email='customer@malaikanest.com'; password='CustPass123!'} | ConvertTo-Json)
$setCookieCustomer = ($r.Headers['Set-Cookie'] | Where-Object { $_ -like 'refresh_token=*' } | Select-Object -First 1)
$custRefresh = [string]$setCookieCustomer.Split(';')[0].Replace('refresh_token=','')
Write-Output ("T1 customer-login status=" + $r.StatusCode + " refresh-cookie-len=" + $custRefresh.Length)

# Customer blocked from Django admin login
try {
  Invoke-WebRequest -UseBasicParsing -Uri "$API/api/v1/accounts/admin/login/" -Method Post `
    -ContentType 'application/json' -Body (@{email='customer@malaikanest.com'; password='CustPass123!'} | ConvertTo-Json) | Out-Null
  Write-Output "T2 customer-admin-login UNEXPECTED-SUCCESS"
} catch {
  Write-Output ("T2 customer-admin-login=" + $_.Exception.Response.StatusCode.value__ + " (expect 403)")
}

# ── 2. Admin login + Django admin surface ────────────────────────────────────
$ar = Invoke-WebRequest -UseBasicParsing -Uri "$API/api/v1/accounts/admin/login/" -Method Post `
  -ContentType 'application/json' -Body (@{email='admin@malaikanest.com'; password='AdminPass123!'} | ConvertTo-Json)
$adminSetCookie = ($ar.Headers['Set-Cookie'] | Where-Object { $_ -like 'refresh_token=*' } | Select-Object -First 1)
$adminRefresh = [string]$adminSetCookie.Split(';')[0].Replace('refresh_token=','')
$adminAccess = ($ar.Content | ConvertFrom-Json).data.access
Write-Output ("T3 admin-login status=" + $ar.StatusCode + " access-token-len=" + $adminAccess.Length)

$H = @{ Authorization = "Bearer $adminAccess" }
function CodeOf([scriptblock]$sb) {
  try { & $sb | Out-Null; return 200 } catch { return $_.Exception.Response.StatusCode.value__ }
}

$analyticsCode = CodeOf { Invoke-RestMethod -Uri "$API/api/v1/orders/admin/analytics/" -Headers $H -OutVariable null }
$reportsCode   = CodeOf { $script:reports = Invoke-RestMethod -Uri "$API/api/v1/orders/admin/reports/?days=30" -Headers $H }
$usersCode     = CodeOf { $script:users = Invoke-RestMethod -Uri "$API/api/v1/products/admin/users/?search=customer" -Headers $H }
$cartsCode     = CodeOf { Invoke-RestMethod -Uri "$API/api/v1/orders/admin/carts/" -Headers $H | Out-Null }
$invoicesCode  = CodeOf { $script:invoices = Invoke-RestMethod -Uri "$API/api/v1/orders/admin/invoices/" -Headers $H }
$ordersCode    = CodeOf { $script:orders = Invoke-RestMethod -Uri "$API/api/v1/products/admin/orders/" -Headers $H }
Write-Output ("T4 django-admin analytics=$analyticsCode reports=$reportsCode users=$usersCode carts=$cartsCode invoices=$invoicesCode orders=$ordersCode")

$denied = CodeOf { Invoke-RestMethod -Uri "$API/api/v1/orders/admin/analytics/" | Out-Null }
Write-Output ("T5 anon-analytics=" + $denied + " (expect 401)")

# ── Status transitions (exact backend state machine) ─────────────────────────
function PatchStatus($orderId, [string]$status) {
  try {
    $r = Invoke-RestMethod -Uri "$API/api/v1/products/admin/orders/$orderId/update_status/" -Method Patch `
      -Headers $H -ContentType 'application/json' -Body (@{status=$status} | ConvertTo-Json)
    $unwrapped = if ($null -ne $r.data) { $r.data } else { $r }
    return @{ code = 200; data = $unwrapped }
  } catch {
    $resp = $_.Exception.Response
    $code = [int]$resp.StatusCode
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    return @{ code = $code; body = $reader.ReadToEnd() }
  }
}

# The API wraps every response in a { status, data } envelope and admin lists
# are paginated ({ results, count, next, previous }) — unwrap before use.
function Unwrap([object]$envelope) {
  $d = if ($null -ne $envelope.data) { $envelope.data } else { $envelope }
  if ($null -ne $d.results) { return @($d.results) }
  return $d
}

$order2 = Unwrap $orders | Where-Object { $_.receipt_number -eq 'MN-E2E-002' }
$pendingId = $order2.id
$t6 = PatchStatus $pendingId 'paid'
Write-Output ("T6 pending->paid code=" + $t6.code + " newStatus=" + ($(if ($t6.data) { $t6.data.status } else { $t6.body })))

if ($t6.code -eq 200) {
  $t7 = PatchStatus $pendingId 'pending'
  Write-Output ("T7 illegal paid->pending code=" + $t7.code + " (expect 400)")
} else {
  Write-Output "T7 SKIPPED (pending->paid failed)"
}

# Full happy path on MN-E2E-001 (already paid): processing -> shipped -> delivered
$order1 = Unwrap $orders | Where-Object { $_.receipt_number -eq 'MN-E2E-001' }
$id1 = $order1.id
$final = 'unknown'
foreach ($st in @('processing', 'shipped', 'delivered')) {
  $step = PatchStatus $id1 $st
  if ($step.data) { $final = $step.data.status } else { $final = "FAILED($st): " + $step.body; break }
}
Write-Output ("T6b happy-path final status=" + $final)

# ── 3. Next.js admin CMS guard ───────────────────────────────────────────────
function GuardTest([string]$cookieHeader) {
  # PS 5.1 Invoke-WebRequest silently drops the Cookie request header, so
  # cookie-authenticated calls must go through curl.exe.
  return curl.exe -s -o NUL -w '%{http_code}' "$NX/api/admin/testimonials" -H "Cookie: $cookieHeader"
}
$noCookie   = GuardTest 'x=1'
$garbage    = GuardTest 'refresh_token=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
$asCustomer = GuardTest "refresh_token=$custRefresh"
$asAdmin    = GuardTest "refresh_token=$adminRefresh"
Write-Output ("T8 next-guard no-cookie=$noCookie garbage=$garbage customer=$asCustomer admin=$asAdmin (expect 401/401/401/200)")

$legacyAdmin = GuardTest "refresh=$adminRefresh"
Write-Output ("T9 legacy-refresh-cookie-as-admin=" + $legacyAdmin + " (expect 200)")

# ── 4. Payload sanity (unwrap envelopes) ─────────────────────────────────────
$an = (Invoke-RestMethod -Uri "$API/api/v1/orders/admin/analytics/" -Headers $H).data
Write-Output ("T10 analytics revenue=" + $an.total_revenue + " orders=" + $an.total_orders + " users=" + $an.total_users + " recent=" + @($an.recent_orders).Count + " lowstock=" + @($an.low_stock).Count)
$rp = (Invoke-RestMethod -Uri "$API/api/v1/orders/admin/reports/?days=30" -Headers $H).data
Write-Output ("T11 reports totalRevenue=" + $rp.totalRevenue + " statuses=" + @($rp.ordersByStatus).Count + " period=" + $rp.period)
$us = (Invoke-RestMethod -Uri "$API/api/v1/products/admin/users/?search=customer" -Headers $H).data
Write-Output ("T12 users-search first=" + @($us.results)[0].email)
$iv = (Invoke-RestMethod -Uri "$API/api/v1/orders/admin/invoices/" -Headers $H).data
Write-Output ("T13 invoices count=" + $iv.count + " rows=" + @($iv.results).Count)
