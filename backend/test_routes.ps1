$ErrorActionPreference = 'Stop'

Write-Host "1. Testing /api/auth/register"
$body = @{
    name = "Test Fleet Manager"
    email = "manager@transitops.com"
    password = "password123"
    role = "FLEET_MANAGER"
} | ConvertTo-Json

try {
    $regResp = Invoke-RestMethod -Uri http://localhost:8080/api/auth/register -Method Post -Body $body -ContentType "application/json"
    Write-Host "Registration Success!"
} catch {
    Write-Host "Registration failed or user exists: $_"
}

Write-Host "`n2. Testing /api/auth/login"
$loginBody = @{
    email = "manager@transitops.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Login Success! Token received."
    $token = $loginResp.token
    
    Write-Host "`n3. Testing /api/auth/me"
    $meResp = Invoke-RestMethod -Uri http://localhost:8080/api/auth/me -Method Get -Headers @{Authorization="Bearer $token"}
    Write-Host "Current User:"
    $meResp | ConvertTo-Json
    
    Write-Host "`n4. Testing /api/dashboard/kpis"
    $kpiResp = Invoke-RestMethod -Uri http://localhost:8080/api/dashboard/kpis -Method Get -Headers @{Authorization="Bearer $token"}
    Write-Host "Dashboard KPIs:"
    $kpiResp | ConvertTo-Json
} catch {
    Write-Host "Login or subsequent request failed: $_"
}
