# VoltLoop Phase 9: Dual-Portal End-to-End System Validation Script
# Tests Owner & Customer auth, role enforcement, station QR resolution,
# charging lifecycle, simulated payments, revenue accounting, and receipts.

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "TEST: $Name" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
    try {
        & $Action
        Write-Host "PASS: $Name" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "FAIL: $Name" -ForegroundColor Red
        Write-Host "Error Details: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "Starting VoltLoop Phase 9 System Validation..." -ForegroundColor Magenta

# 1. Root & Discovery Check
Test-Step "1. Root URL and REST API Discovery Check" {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/" -Method Get
    if ($res.status -ne "ONLINE") { throw "Status is not ONLINE: $($res.status)" }
    if (-not $res.apiEndpoints.authLogin) { throw "Missing authLogin in discovery endpoints" }
    Write-Host "Backend Status: $($res.status) | Version: $($res.version)" -ForegroundColor Gray
}

# 2. Owner Authentication (Dr. Rajesh Sharma)
$ownerToken = $null
Test-Step "2. Owner Login with BCrypt Credentials" {
    $body = @{
        email = "rajesh.sharma@campus.edu"
        password = "Owner@VoltLoop2026"
        portal = "OWNER"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.token) { throw "No token returned for owner login" }
    if ($res.user.role -ne "OWNER") { throw "User role is not OWNER: $($res.user.role)" }
    $script:ownerToken = $res.token
    Write-Host "Owner Authenticated: $($res.user.name) | Role: $($res.user.role)" -ForegroundColor Gray
}

# 3. Customer Authentication (Amit Verma)
$customerToken = $null
Test-Step "3. Customer Login with BCrypt Credentials" {
    $body = @{
        email = "amit.verma@campus.edu"
        password = "Customer@2026"
        portal = "CUSTOMER"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.token) { throw "No token returned for customer login" }
    if ($res.user.role -ne "CUSTOMER" -and $res.user.role -ne "USER") { throw "User role unexpected: $($res.user.role)" }
    $script:customerToken = $res.token
    Write-Host "Customer Authenticated: $($res.user.name) | User ID: $($res.user.userId)" -ForegroundColor Gray
}

# 4. Strict Role Authorization Enforcement (Customer Token -> Owner Portal -> 403 Forbidden)
Test-Step "4. Strict Role Authorization Enforcement (Customer blocked from Owner Portal)" {
    $custHeaders = @{ "Authorization" = "Bearer $customerToken" }
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/overview" -Method Get -Headers $custHeaders
        throw "Expected HTTP 403 Forbidden but received HTTP 200 OK!"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403 -or $_.Exception.Message -like "*403*") {
            Write-Host "Successfully received HTTP 403 Forbidden as expected!" -ForegroundColor Gray
        } else {
            throw "Unexpected error: $($_.Exception.Message)"
        }
    }
}

# 5. Customer Registration Workflow
$newCustomerToken = $null
$newCustomerVehicleId = $null
$rand = Get-Random -Minimum 1000 -Maximum 9999
Test-Step "5. New Customer Registration & Vehicle Creation" {
    $regBody = @{
        name = "Automated Test User $rand"
        email = "autotest$rand@campus.edu"
        password = "Password@2026"
        phone = "+91 98$rand 1234"
        vehicleName = "Hyundai Kona EV $rand"
        registrationNo = "KA-05-EV-$rand"
        vehicleType = "FOUR_WHEELER"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register-customer" -Method Post -Body $regBody -ContentType "application/json"
    if (-not $res.token) { throw "No token returned for newly registered customer" }
    
    $vList = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/vehicles" -Method Get -Headers @{ "Authorization" = "Bearer $($res.token)" }
    if ($vList.Count -eq 0) { throw "Vehicle was not created during customer registration" }
    
    $script:newCustomerToken = $res.token
    $script:newCustomerVehicleId = $vList[0].vehicleId
    Write-Host "Registered User: $($res.user.name) | Vehicle: $($vList[0].registrationNumber) (ID: $($vList[0].vehicleId))" -ForegroundColor Gray
}

# 6. Station QR Code Identifier Resolution (VL-ST-001 through VL-ST-005)
Test-Step "6. Station QR Code Identifier Resolution" {
    $headers = @{ "Authorization" = "Bearer $customerToken" }
    foreach ($qr in @("VL-ST-001", "VL-ST-002", "VL-ST-003", "VL-ST-004", "VL-ST-005")) {
        $res = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/stations/qr/$qr" -Method Get -Headers $headers
        if (-not $res.station) { throw "Station QR $qr failed validation" }
        Write-Host "Resolved $qr -> $($res.station.stationName) ($($res.station.powerRating) kW, $($res.station.connectorType))" -ForegroundColor Gray
    }
}

# 7. Customer Dashboard Data Retrieval
Test-Step "7. Customer Personal Dashboard Retrieval" {
    $headers = @{ "Authorization" = "Bearer $customerToken" }
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/dashboard" -Method Get -Headers $headers
    if (-not $res.customer) { throw "Customer profile missing in dashboard response" }
    Write-Host "Customer: $($res.customer.name) | Vehicles: $($res.vehicles.Count) | Recent Sessions: $($res.recentSessions.Count)" -ForegroundColor Gray
}

# 8. Customer Profile Update
Test-Step "8. Customer Profile Update" {
    $headers = @{ "Authorization" = "Bearer $customerToken" }
    $profile = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/profile" -Method Get -Headers $headers
    if (-not $profile.email) { throw "Missing email in profile" }

    $updateBody = @{
        name = "Amit Verma"
        phone = "+91 98765 00001"
    } | ConvertTo-Json
    $updated = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/profile" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
    if ($updated.name -ne "Amit Verma") { throw "Profile name not updated" }
    Write-Host "Profile Updated: $($updated.name) | Phone: $($updated.phone)" -ForegroundColor Gray
}

# 9. Charging Lifecycle & Payment Simulation (SUCCESSFUL)
$createdTxnRef = $null
Test-Step "9. Charging Session Lifecycle & Payment Simulation (SUCCESSFUL)" {
    $headers = @{ "Authorization" = "Bearer $newCustomerToken" }
    # 9a. Start a session for newly registered user and their fresh vehicle at station 1
    $startBody = @{
        vehicleId = $newCustomerVehicleId
        stationId = 1
        initialBattery = 35
    } | ConvertTo-Json
    $startRes = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/charging/start" -Method Post -Body $startBody -ContentType "application/json" -Headers $headers
    $newSessionId = $startRes.sessionId
    Write-Host "Started Charging Session #$newSessionId for Vehicle #$newCustomerVehicleId" -ForegroundColor Gray

    # 9b. Complete session
    $compBody = @{
        sessionId = $newSessionId
        finalBattery = 80
    } | ConvertTo-Json
    $compRes = Invoke-RestMethod -Uri "http://localhost:8080/api/customer/charging/complete" -Method Post -Body $compBody -ContentType "application/json" -Headers $headers
    Write-Host "Completed Session $($newSessionId) - Energy = $($compRes.energyConsumed) kWh, Cost = Rs. $($compRes.chargingCost)" -ForegroundColor Gray

    # 9c. Initiate payment
    $initBody = @{
        sessionId = $newSessionId
        amount = $compRes.chargingCost
        currency = "INR"
        paymentMethod = "UPI"
    } | ConvertTo-Json
    $initRes = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/initiate" -Method Post -Body $initBody -ContentType "application/json" -Headers $headers
    if (-not $initRes.paymentId) { throw "No paymentId in payment initiation" }

    # 9d. Simulate success
    $simBody = @{
        paymentId = $initRes.paymentId
        status = "SUCCESSFUL"
        simulateSuccess = $true
        simulatedDelayMs = 200
    } | ConvertTo-Json
    $simRes = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/simulate" -Method Post -Body $simBody -ContentType "application/json" -Headers $headers
    if ($simRes.status -ne "SUCCESSFUL") { throw "Simulated payment status is not SUCCESSFUL: $($simRes.status)" }
    $script:createdTxnRef = $simRes.transactionRef
    Write-Host "Payment Settled: $($simRes.transactionRef) | Amount: Rs. $($simRes.amount) | Status: $($simRes.status)" -ForegroundColor Gray
}

# 10. Official Tax Receipt Generation
Test-Step "10. Tax Invoice / Receipt Retrieval by Transaction Ref" {
    $headers = @{ "Authorization" = "Bearer $newCustomerToken" }
    $receipt = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/receipt/$createdTxnRef" -Method Get -Headers $headers
    if ($receipt.transactionRef -ne $createdTxnRef) { throw "Receipt transactionRef mismatch" }
    if (-not $receipt.customerName) { throw "Missing customer name on receipt" }
    Write-Host "Receipt Validated: $($receipt.transactionRef) | Billed to: $($receipt.customerName) | Total: Rs. $($receipt.amount)" -ForegroundColor Gray
}

# 11. Payment Simulation (FAILED Error Handling)
Test-Step "11. Payment Simulation (FAILED Error Handling)" {
    $headers = @{ "Authorization" = "Bearer $customerToken" }
    $initBody = @{
        reservationId = 1
        amount = 50.00
        currency = "INR"
        paymentMethod = "CREDIT_CARD"
    } | ConvertTo-Json
    $initRes = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/initiate" -Method Post -Body $initBody -ContentType "application/json" -Headers $headers

    $simBody = @{
        paymentId = $initRes.paymentId
        status = "FAILED"
        simulateSuccess = $false
        simulatedDelayMs = 100
    } | ConvertTo-Json
    $simRes = Invoke-RestMethod -Uri "http://localhost:8080/api/payments/simulate" -Method Post -Body $simBody -ContentType "application/json" -Headers $headers
    if ($simRes.status -ne "FAILED") { throw "Status expected FAILED but received: $($simRes.status)" }
    Write-Host "Failed Payment Handled Correctly: $($simRes.transactionRef) | Status: $($simRes.status)" -ForegroundColor Gray
}

# 12. Owner Verified Revenue Check
Test-Step "12. Owner Verified Revenue Calculation & Payment Ledger" {
    $headers = @{ "Authorization" = "Bearer $ownerToken" }
    $rev = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/revenue" -Method Get -Headers $headers
    if ($rev.totalRevenue -le 0) { throw "Verified revenue is 0 or negative" }
    if ($rev.successfulPaymentsCount -le 0) { throw "Successful payments count is 0" }
    Write-Host "Verified Realized Revenue: Rs. $($rev.totalRevenue) | Total Confirmed Transactions: $($rev.successfulPaymentsCount)" -ForegroundColor Gray
}

# 13. Owner Station Status Hardware Control
Test-Step "13. Owner Station Status Hardware Control" {
    $headers = @{ "Authorization" = "Bearer $ownerToken" }
    # Toggle station 5 (CS-SPORTS-01) from MAINTENANCE to AVAILABLE
    $toggleBody = @{ status = "AVAILABLE" } | ConvertTo-Json
    $t1 = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/stations/5/status" -Method Put -Body $toggleBody -ContentType "application/json" -Headers $headers
    if ($t1.status -ne "AVAILABLE") { throw "Failed to set status to AVAILABLE" }

    # Toggle back to MAINTENANCE (restoring campus schema default)
    $toggleBody2 = @{ status = "MAINTENANCE" } | ConvertTo-Json
    $t2 = Invoke-RestMethod -Uri "http://localhost:8080/api/owner/stations/5/status" -Method Put -Body $toggleBody2 -ContentType "application/json" -Headers $headers
    if ($t2.status -ne "MAINTENANCE") { throw "Failed to restore status to MAINTENANCE" }
    Write-Host "Station 5 Status Successfully Toggled: MAINTENANCE -> AVAILABLE -> MAINTENANCE" -ForegroundColor Gray
}

# 14. Frontend Production Build Verification
Test-Step "14. Frontend Production Build Verification" {
    if (-not (Test-Path "c:\Users\ssana\Desktop\VoltLoop\VoltLoop\frontend\dist\index.html")) {
        throw "Frontend dist/index.html is missing"
    }
    Write-Host "Frontend Production Build Exists: dist/index.html verified" -ForegroundColor Gray
}

Write-Host "`n========================================================" -ForegroundColor Magenta
Write-Host "PHASE 9 SYSTEM VALIDATION COMPLETE" -ForegroundColor Magenta
Write-Host "PASSED: $passed" -ForegroundColor Green
Write-Host "FAILED: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================================`n" -ForegroundColor Magenta

if ($failed -gt 0) {
    exit 1
} else {
    exit 0
}
