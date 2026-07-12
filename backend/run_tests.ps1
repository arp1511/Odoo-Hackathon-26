function Get-Token { param($email, $password)
  $b = "{`"email`":`"$email`",`"password`":`"$password`"}"
  $r = Invoke-WebRequest -Method POST "http://localhost:8080/api/auth/login" -ContentType "application/json" -Body $b -UseBasicParsing
  return ($r.Content | ConvertFrom-Json).token
}
function Http { param($method, $url, $token, $body)
  $req = [System.Net.HttpWebRequest]::Create($url)
  $req.Method = $method
  if ($token) { $req.Headers.Add("Authorization", "Bearer $token") }
  if ($body) {
    $req.ContentType = "application/json"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
  } else { $req.ContentLength = 0 }
  try {
    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    return @{code=[int]$resp.StatusCode; body=$reader.ReadToEnd()}
  } catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      return @{code=[int]$resp.StatusCode; body=$reader.ReadToEnd()}
    }
    return @{code=0; body=$_.Exception.Message}
  }
}

try {
  $FM_TOKEN = Get-Token "manager@transitops.com" "password123"
  $DISP_TOKEN = Get-Token "dispatcher@transitops.com" "password123"
  $SO_TOKEN = Get-Token "safety@transitops.com" "password123"
  $FA_TOKEN = Get-Token "finance@transitops.com" "password123"
} catch {
  Write-Output "Failed to get tokens. Please verify seed data."
  exit
}

Write-Output "=== 1. Auth and Users ==="
$r = Http "GET" "http://localhost:8080/api/auth/me" $FM_TOKEN
Write-Output "/me: $($r.code)"

Write-Output "`n=== 2. Vehicles ==="
$r = Http "GET" "http://localhost:8080/api/vehicles" $FM_TOKEN
Write-Output "List Vehicles: $($r.code)"
$r = Http "POST" "http://localhost:8080/api/vehicles" $DISP_TOKEN '{"registrationNumber":"DISP-V","name":"Test","type":"Van","maxLoadCapacityKg":100,"odometerKm":0,"acquisitionCost":1000}'
Write-Output "Create Vehicle (DISP): $($r.code) (Expected 403)"

Write-Output "`n=== 3. Drivers ==="
$r = Http "POST" "http://localhost:8080/api/drivers" $SO_TOKEN '{"name":"SO Driver","licenseNumber":"DL-SO-01","licenseCategory":"LMV","licenseExpiry":"2030-01-01","contactNumber":"12345"}'
Write-Output "Create Driver (SO): $($r.code) (Expected 201)"
$r = Http "POST" "http://localhost:8080/api/drivers" $DISP_TOKEN '{"name":"DISP Driver","licenseNumber":"DL-DISP-01","licenseCategory":"LMV","licenseExpiry":"2030-01-01","contactNumber":"12345"}'
Write-Output "Create Driver (DISP): $($r.code) (Expected 403)"

Write-Output "`n=== 4. Trips ==="
$r = Http "POST" "http://localhost:8080/api/trips" $FM_TOKEN '{"vehicleId":"10000000-0000-0000-0000-000000000001","driverId":"20000000-0000-0000-0000-000000000001","startLocation":"A","endLocation":"B","cargoWeightKg":100}'
Write-Output "Create Trip (FM): $($r.code) (Expected 403)"

Write-Output "`n=== 5. Maintenance ==="
$r = Http "POST" "http://localhost:8080/api/maintenance" $DISP_TOKEN '{"vehicleId":"10000000-0000-0000-0000-000000000001","description":"Test","cost":100}'
Write-Output "Create Maintenance (DISP): $($r.code) (Expected 403)"

Write-Output "`n=== 6. Fuel Logs ==="
$r = Http "POST" "http://localhost:8080/api/fuel-logs" $SO_TOKEN '{"vehicleId":"10000000-0000-0000-0000-000000000001","liters":10,"cost":10,"logDate":"2026-01-01"}'
Write-Output "Create Fuel Log (SO): $($r.code) (Expected 403)"

Write-Output "`n=== 7. Reports ==="
$r = Http "GET" "http://localhost:8080/api/reports/fuel-efficiency" $DISP_TOKEN
Write-Output "Fuel Efficiency Report (DISP): $($r.code) (Expected 403)"
$r = Http "GET" "http://localhost:8080/api/reports/fuel-efficiency" $FA_TOKEN
Write-Output "Fuel Efficiency Report (FA): $($r.code) (Expected 200)"
