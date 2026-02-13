$json = Get-Content token.json -Raw | ConvertFrom-Json
$token = $json.access_token
$headers = @{ Authorization = "Bearer $token" }

Write-Host "--- Testing Fail Payload (phone) ---"
try {
    Invoke-WebRequest -Uri 'https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io/api/v1/contacts' -Method POST -InFile 'contact_fail.json' -Headers $headers -ContentType 'application/json' -UseBasicParsing
} catch {
    Write-Host "Caught Expected Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
}

Write-Host "`n--- Testing Success Payload (number) ---"
try {
    $resp = Invoke-WebRequest -Uri 'https://ckk4swcsssos844w0ccos4og.72.61.248.175.sslip.io/api/v1/contacts' -Method POST -InFile 'contact_success.json' -Headers $headers -ContentType 'application/json' -UseBasicParsing
    Write-Host "Success! Response: $($resp.Content)"
} catch {
    Write-Host "Unexpected Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
}
