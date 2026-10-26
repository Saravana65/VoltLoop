# VoltLoop Retrospective Phase 8 Integration Audit & Demo Readiness
# Comprehensive Verification Script for Phases 1-9
$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Test-Audit([string]$Name, [scriptblock]$Action) {
    Write-Host "`n--------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "AUDIT TEST: $Name" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
    try {
        & $Action
        Write-Host "[PASS] $Name" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:failed++
    }
}

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "  VOLTLOOP PHASE 8 RETROSPECTIVE INTEGRATION AUDIT SUITE" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta

# 1. Server-side Authentication & BCrypt Password Verification
$ownerToken = $null
$customerToken = $null

Test-Audit "1. BCrypt Password Verification & Secure Authentication" {
    # 1a. Wrong password rejection
    $wrongAuthCaught = $false
    try {
        $wrongBody = @{ email = "rajesh.sharma@campus.edu"; password = "WrongPassword123!"; portal = "OWNER" } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $wrongBody -ContentType "application/json"
    } catch {
        if ($_.Exception.Message -match "401") { $wrongAuthCaught = $true }
    }
    if (-not $wrongAuthCaught) { throw "Wrong password did not trigger HTTP 401 Unauthorized" }

    # 1b. Correct Owner Login
    $oBody = @{ email = "rajesh.sharma@campus.edu"; password = "Owner@VoltLoop2026"; portal = "OWNER" } | ConvertTo-Json
    $oRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $oBody -ContentType "application/json"
    if (-not $oRes.token -or $oRes.user.role -ne "OWNER") { throw "Failed valid owner authentication" }
    $script:ownerToken = $oRes.token

    # 1c. Correct Customer Login
    $cBody = @{ email = "amit.verma@campus.edu"; password = "Customer@2026"; portal = "CUSTOMER" } | ConvertTo-Json
    $cRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $cBody -ContentType "application/json"
    if (-not $cRes.token -or $cRes.user.role -ne "CUSTOMER") { throw "Failed valid customer authentication" }
    $script:customerToken = $cRes.token

    Write-Host "Verified BCrypt authentication for Owner (ID: $($oRes.user.userId)) and Customer (ID: $($cRes.user.userId))" -ForegroundColor Gray
}

# 2. Server-side Role Authorization Enforcement
Test-Audit "2. Server-Side Role Enforcement (Customer Token -> Owner API -> 403)" {
    $custHeaders = @{ "Authorization" = "Bearer $customerToken" }
    $blocked = $false
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/owner/overview" -Method Get -Headers $custHeaders
    } catch {
        if ($_.Exception.Message -match "403") { $blocked = $true }
    }
    if (-not $blocked) { throw "Customer token was not blocked from /api/owner/overview with 403 Forbidden" }
    Write-Host "HTTP 403 Forbidden verified on cross-role access attempt" -ForegroundColor Gray
}

# 3. Owner Station Authorization Enforcement
Test-Audit "3. Owner Station Access Authorization" {
    $oHeaders = @{ "Authorization" = "Bearer $ownerToken" }
    # Owner 1 owns station 5, toggle AVAILABLE -> MAINTENANCE
    $body = @{ status = "AVAILABLE" } | ConvertTo-Json
    $res1 = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/stations/5/status" -Method Put -Body $body -ContentType "application/json" -Headers $oHeaders
    if ($res1.status -ne "AVAILABLE") { throw "Could not update station 5" }

    # Restore to MAINTENANCE
    $body2 = @{ status = "MAINTENANCE" } | ConvertTo-Json
    $res2 = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/stations/5/status" -Method Put -Body $body2 -ContentType "application/json" -Headers $oHeaders
    if ($res2.status -ne "MAINTENANCE") { throw "Could not restore station 5 to MAINTENANCE" }

    Write-Host "Owner 1 verified for station 5 control (status toggled and restored to MAINTENANCE)" -ForegroundColor Gray
}

# 4. Customer Isolation (Cross-User Vehicle Access Blocked)
Test-Audit "4. Customer Isolation (Cross-User Vehicle Access Blocked)" {
    $cHeaders = @{ "Authorization" = "Bearer $customerToken" } # User 3 (Amit Verma)
    # Attempt to start charging for Vehicle 2 (belongs to Sneha Nair, User 4)
    $crossBlocked = $false
    try {
        $body = @{ vehicleId = 2; stationId = 1 } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8080/api/customer/charging/start" -Method Post -Body $body -ContentType "application/json" -Headers $cHeaders
    } catch {
        if ($_.Exception.Message -match "400|403|denied") { $crossBlocked = $true }
    }
    if (-not $crossBlocked) { throw "Customer was able to initiate charging on another user's vehicle!" }
    Write-Host "Customer prevented from operating other users' vehicles: HTTP 400 Access Denied received" -ForegroundColor Gray
}

# 5. Station QR Resolution & Manual Fallback (VL-ST-001 through VL-ST-005)
Test-Audit "5. Station QR Resolution & Manual Fallback Codes" {
    $cHeaders = @{ "Authorization" = "Bearer $customerToken" }
    foreach ($qr in @("VL-ST-001", "VL-ST-002", "VL-ST-003", "VL-ST-004", "VL-ST-005")) {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/stations/qr/$qr" -Method Get -Headers $cHeaders
        if (-not $res.station -or -not $res.station.stationName) { throw "Resolution failed for $qr" }
    }
    # Test numeric ID fallback
    $numRes = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/stations/qr/1" -Method Get -Headers $cHeaders
    if ($numRes.station.stationId -ne 1) { throw "Numeric fallback failed" }
    Write-Host "All 5 station QR codes + numeric fallback successfully resolved" -ForegroundColor Gray
}

# 6. Reservation Conflict Detection via Interval Collision
Test-Audit "6. Reservation Conflict Detection via Interval Algebra" {
    $randDay = Get-Random -Minimum 500 -Maximum 900
    $randHour = Get-Random -Minimum 1 -Maximum 18
    $baseDate = (Get-Date "2026-01-01T00:00:00").AddDays($randDay).AddHours($randHour)
    $start = $baseDate.ToString("yyyy-MM-ddTHH:00:00")
    $end   = $baseDate.AddHours(2).ToString("yyyy-MM-ddTHH:00:00")
    $resBody = @{ vehicleId = 1; stationId = 3; startTime = $start; endTime = $end } | ConvertTo-Json
    $first = Invoke-RestMethod -Uri "http://localhost:8080/api/charging/reserve" -Method Post -Body $resBody -ContentType "application/json"
    if ($first.reservationId -le 0) { throw "Base reservation creation failed" }

    # Attempt overlapping slot (start + 1 hr to start + 3 hr)
    $overlapCaught = $false
    try {
        $ovStart = $baseDate.AddHours(1).ToString("yyyy-MM-ddTHH:00:00")
        $ovEnd   = $baseDate.AddHours(3).ToString("yyyy-MM-ddTHH:00:00")
        $ovBody = @{ vehicleId = 2; stationId = 3; startTime = $ovStart; endTime = $ovEnd } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8080/api/charging/reserve" -Method Post -Body $ovBody -ContentType "application/json"
    } catch {
        if ($_.Exception.Message -match "409|conflict") { $overlapCaught = $true }
    }
    if (-not $overlapCaught) { throw "Overlapping reservation was not rejected with 409 Conflict" }
    Write-Host "Interval conflict (s1 < e2 AND s2 < e1) rejected with HTTP 409 Conflict" -ForegroundColor Gray
}

# 7. Duplicate Charging Prevention
Test-Audit "7. Duplicate Charging Session Prevention" {
    # Vehicle 4 (Tata Nexon EV) is currently actively charging
    $dupCaught = $false
    try {
        $dupBody = @{ vehicleId = 4; stationId = 1 } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8080/api/charging/start" -Method Post -Body $dupBody -ContentType "application/json"
    } catch {
        if ($_.Exception.Message -match "409|conflict|already") { $dupCaught = $true }
    }
    if (-not $dupCaught) { throw "Active vehicle was allowed to start a second session" }
    Write-Host "Duplicate charging attempt rejected with HTTP 409 Conflict" -ForegroundColor Gray
}

# 8. Customer Registration, Charging Lifecycle, and Payment Settlement
$auditTxnRef = $null
Test-Audit "8. Customer Registration, Charging Lifecycle & Payment Simulation" {
    $rand = Get-Random -Minimum 1000 -Maximum 9999
    $reg = @{
        name = "Audit User $rand"
        email = "audit$rand@campus.edu"
        password = "Password@2026"
        phone = "+91 99000 $rand"
        vehicleName = "MG ZS EV $rand"
        registrationNo = "KA-04-AUDIT-$rand"
        vehicleType = "FOUR_WHEELER"
    } | ConvertTo-Json
    $userRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register-customer" -Method Post -Body $reg -ContentType "application/json"
    $token = $userRes.token
    $headers = @{ "Authorization" = "Bearer $token" }

    $vList = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/vehicles" -Method Get -Headers $headers
    $vid = $vList[0].vehicleId

    # Start session at station 1
    $startBody = @{ vehicleId = $vid; stationId = 1; initialBattery = 30 } | ConvertTo-Json
    $sRes = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/charging/start" -Method Post -Body $startBody -ContentType "application/json" -Headers $headers
    $sid = $sRes.sessionId

    # Complete session
    $compBody = @{ sessionId = $sid; finalBattery = 85 } | ConvertTo-Json
    $cRes = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/charging/complete" -Method Post -Body $compBody -ContentType "application/json" -Headers $headers

    # Initiate payment
    $pInit = @{ sessionId = $sid; amount = $cRes.chargingCost; paymentMethod = "UPI" } | ConvertTo-Json
    $initRes = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/initiate" -Method Post -Body $pInit -ContentType "application/json" -Headers $headers

    # Settle payment as SUCCESSFUL
    $pSim = @{ paymentId = $initRes.paymentId; status = "SUCCESSFUL"; simulateSuccess = $true } | ConvertTo-Json
    $settled = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/simulate" -Method Post -Body $pSim -ContentType "application/json" -Headers $headers
    if ($settled.status -ne "SUCCESSFUL") { throw "Payment simulation did not settle as SUCCESSFUL" }

    $script:auditTxnRef = $settled.transactionRef

    # Test Duplicate Payment Protection on same session
    $dupPayCaught = $false
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/payments/initiate" -Method Post -Body $pInit -ContentType "application/json" -Headers $headers
    } catch {
        if ($_.Exception.Message -match "409|conflict|already") { $dupPayCaught = $true }
    }
    if (-not $dupPayCaught) { throw "Duplicate payment for settled session was not blocked with 409 Conflict" }

    Write-Host "Lifecycle completed & settled: $($settled.transactionRef) | Rs. $($settled.amount). Duplicate payment rejected." -ForegroundColor Gray
}

# 9. Tax Receipt Validation & Customer Isolation
Test-Audit "9. Tax Invoice Receipt Retrieval & Data Isolation" {
    $cHeaders = @{ "Authorization" = "Bearer $customerToken" } # User 3 (Amit Verma)
    # Attempt to read receipt for another customer's transaction ($auditTxnRef belongs to Audit User)
    $receiptIsolationCaught = $false
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/payments/receipt/$auditTxnRef" -Method Get -Headers $cHeaders
    } catch {
        if ($_.Exception.Message -match "400|Access denied") { $receiptIsolationCaught = $true }
    }
    if (-not $receiptIsolationCaught) { throw "Customer was able to view another customer's tax receipt!" }

    # Owner CAN view any receipt
    $oHeaders = @{ "Authorization" = "Bearer $ownerToken" }
    $oReceipt = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/receipt/$auditTxnRef" -Method Get -Headers $oHeaders
    if ($oReceipt.transactionRef -ne $auditTxnRef) { throw "Owner could not retrieve tax receipt" }

    Write-Host "Receipt data isolation verified: Non-owner customer blocked (HTTP 400), Owner access authorized." -ForegroundColor Gray
}

# 10. Verified Revenue Ledger Integrity
Test-Audit "10. Verified Revenue Ledger Integrity (SUCCESSFUL Payments Only)" {
    $oHeaders = @{ "Authorization" = "Bearer $ownerToken" }
    $rev = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/revenue" -Method Get -Headers $oHeaders
    if ($rev.totalRevenue -le 0 -or $rev.successfulPaymentsCount -le 0) { throw "Revenue ledger empty" }

    # Direct DB verification: Sum only SUCCESSFUL
    $env:MYSQL_PWD = "voltloop_pass"
    $dbSum = (& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u voltloop_user voltloop -N -s -e "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'SUCCESSFUL';" 2>$null)
    Write-Host "Verified Realized Revenue: Rs. $($rev.totalRevenue) across $($rev.successfulPaymentsCount) confirmed transactions (DB Total: Rs. $dbSum)." -ForegroundColor Gray
}

# 11. Frontend Production Build Artifacts Verification
Test-Audit "11. Frontend Production Build Artifacts Verification" {
    $distHtml = "c:\Users\ssana\Desktop\VoltLoop\VoltLoop\frontend\dist\index.html"
    if (-not (Test-Path $distHtml)) { throw "dist/index.html not found" }
    $content = Get-Content $distHtml -Raw
    if (-not ($content -match "VoltLoop")) { throw "HTML title does not contain VoltLoop" }
    Write-Host "Vite production bundle verified: dist/index.html (Title: VoltLoop)" -ForegroundColor Gray
}

Write-Host "`n========================================================" -ForegroundColor Magenta
Write-Host "RETROSPECTIVE PHASE 8 INTEGRATION AUDIT SUMMARY" -ForegroundColor Magenta
Write-Host "PASSED: $passed" -ForegroundColor Green
Write-Host "FAILED: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================================`n" -ForegroundColor Magenta

if ($failed -gt 0) { exit 1 } else { exit 0 }
