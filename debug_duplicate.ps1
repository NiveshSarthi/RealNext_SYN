# 1. Authenticate
$authBody = @{ email = 'Syndicate@niveshsarthi.com'; password = 'Syndicate@123' } | ConvertTo-Json
try {
    $loginResp = Invoke-WebRequest -Uri 'https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io/auth/login' -Method POST -Body $authBody -ContentType 'application/json' -UseBasicParsing
    $json = $loginResp.Content | ConvertFrom-Json
    $token = $json.access_token
    Write-Host "Got new token."
}
catch {
    Write-Host "Login Failed: $($_.Exception.Message)"
    exit
}

# 2. Search
$headers = @{ Authorization = "Bearer $token" }
$number = "917838477989"
Write-Host "--- Searching for existing contact: $number ---"

try {
    $resp = Invoke-WebRequest -Uri "https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io/api/v1/contacts?search=$number" -Method GET -Headers $headers -ContentType 'application/json' -UseBasicParsing
    Write-Host "Response Status: $($resp.StatusCode)"
    $resp.Content | Out-File -FilePath debug_response.json -Encoding UTF8
    Write-Host "Saved response to debug_response.json"
}
catch {
    Write-Host "Search Failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
}
