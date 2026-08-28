# ── Focused diagnostics v2 ────────────────────────────────────────────────────
$API = 'http://localhost:8000'
$NX = 'http://localhost:3000'

$custLogin = Invoke-WebRequest -UseBasicParsing -Uri "$API/api/v1/accounts/token/" -Method Post `
  -ContentType 'application/json' -Body (@{email='customer@malaikanest.com'; password='CustPass123!'} | ConvertTo-Json)
$script:custCookie = ([string]($custLogin.Headers['Set-Cookie'] | Where-Object { $_ -like 'refresh_token=*' } | Select-Object -First 1)).Split(';')[0].Replace('refresh_token=','')
Start-Sleep -Seconds 2
$admLogin = Invoke-WebRequest -UseBasicParsing -Uri "$API/api/v1/accounts/admin/login/" -Method Post `
  -ContentType 'application/json' -Body (@{email='admin@malaikanest.com'; password='AdminPass123!'} | ConvertTo-Json)
$script:admCookie = ([string]($admLogin.Headers['Set-Cookie'] | Where-Object { $_ -like 'refresh_token=*' } | Select-Object -First 1)).Split(';')[0].Replace('refresh_token=','')
$admAccess = ($admLogin.Content | ConvertFrom-Json).data.access
$H = @{ Authorization = "Bearer $admAccess" }

Write-Output ("D1 adm-cookie-len=" + $admCookie.Length + " cust-cookie-len=" + $custCookie.Length)

# Unwrapper that understands the {status,data} envelope AND bare payloads
function Unwrap([string]$json) {
    $o = $json | ConvertFrom-Json
    if ($null -ne $o.data) {
        # If data is a paginated envelope with results, return the results array
        if ($null -ne $o.data.results) { return @($o.data.results) }
        return $o.data
    } else { return $o }
}

# D2/D3: session-check + orders list — ALL HTTP through curl.exe
$tmpJ = "$env:TEMP\sc_$PID.json"
curl.exe -s -X POST -H "Cookie: refresh_token=$admCookie" "$API/api/v1/accounts/admin/session-check/" -o $tmpJ
Write-Output ("D2 session-check(admin-cookie)=" + ((Get-Content $tmpJ -Raw)))

curl.exe -s -H "Authorization: Bearer $admAccess" "$API/api/v1/products/admin/orders/" -o $tmpJ
$rawHead = (Get-Content $tmpJ -Raw)
Write-Output ("D3 orders-head=" + $rawHead.Substring(0, [Math]::Min(120, $rawHead.Length)))
$ordersData = Unwrap ($rawHead)

$isArr = $ordersData -is [array]
Write-Output ("D3b unwrapped-isArray=" + $isArr + " count=" + $(if ($isArr) { @($ordersData).Count } else { '(object)' }))

# D4/D5: locate MN-E2E-002 -> patch paid, then illegal reverse
$target = if ($isArr) { @($ordersData) | Where-Object { $_.receipt_number -eq 'MN-E2E-002' } } else { $null }
if ($target) {
  $tid = $target.id
  Write-Output ("D4 MN-E2E-002 id=" + $tid + " status=" + $target.status)
  curl.exe -s -X PATCH -H "Authorization: Bearer $admAccess" -H "Content-Type: application/json" -d '{\"status\":\"paid\"}' "$API/api/v1/products/admin/orders/$tid/update_status/" -o $tmpJ
  Write-Output ("D5 patch-pending->paid=" + (Get-Content $tmpJ -Raw))

  # Illegal reverse paid->pending
  curl.exe -s -X PATCH -H "Authorization: Bearer $admAccess" -H "Content-Type: application/json" -d '{\"status\":\"pending\"}' "$API/api/v1/products/admin/orders/$tid/update_status/" -o $tmpJ
  Write-Output ("D5b patch-paid->pending(illegal)=" + (Get-Content $tmpJ -Raw))
} else {
  Write-Output "D4 MN-E2E-002 NOT FOUND"
}

# Full happy path on MN-E2E-001
$o1 = @($ordersData) | Where-Object { $_.receipt_number -eq 'MN-E2E-001' }
if ($o1) {
  $id1 = $o1.id
  foreach ($st in @('processing', 'shipped', 'delivered')) {
    curl.exe -s -X PATCH -H "Authorization: Bearer $admAccess" -H "Content-Type: application/json" -d ('{\"status\":\"' + $st + '\"}') "$API/api/v1/products/admin/orders/$id1/update_status/" -o $tmpJ
    Write-Output ("D6 transition->" + $st + "=" + ((Get-Content $tmpJ -Raw).Substring(0, [Math]::Min(90, (Get-Content $tmpJ -Raw).Length))))
  }
} else {
  Write-Output "D6 MN-E2E-001 NOT FOUND"
}

# D7: Next.js guard via curl (headers actually sent!)
$sc1 = curl.exe -s -o NUL -w '%{http_code}' "$NX/api/admin/testimonials"
$sc2 = curl.exe -s -o NUL -w '%{http_code}' -H "Cookie: refresh_token=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" "$NX/api/admin/testimonials"
$sc3 = curl.exe -s -o NUL -w '%{http_code}' -H "Cookie: refresh_token=$custCookie" "$NX/api/admin/testimonials"
$sc4 = curl.exe -s -o NUL -w '%{http_code}' -H "Cookie: refresh_token=$admCookie" "$NX/api/admin/testimonials"
$sc5 = curl.exe -s -o NUL -w '%{http_code}' -H "Cookie: refresh=$admCookie" "$NX/api/admin/testimonials"
Write-Output ("D7 next-guard no-cookie=$sc1 garbage=$sc2 customer=$sc3 ADMIN=$sc4 LEGACYADMIN=$sc5 (expect 401/401/401/200/200)")

# D8: CMS write through Next route as admin (create + list), then cleanup
$body = '{\"name\":\"E2E Probe\",\"location\":\"Nairobi\",\"rating\":5,\"text\":\"probe\",\"isActive\":true,\"position\":99}'
curl.exe -s -X POST -H "Cookie: refresh_token=$admCookie" -H "Content-Type: application/json" -d $body "$NX/api/admin/testimonials" -o $tmpJ
Write-Output ("D8 create=" + (Get-Content $tmpJ -Raw))

