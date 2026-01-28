# Voice Command System - PowerShell Test Script
# Run as Administrator

param(
    [string]$Action = "test",
    [string]$PhoneNumber = "+919876543210",
    [string]$Message = "Hello from Smart Object AI"
)

Write-Host "`n" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Smart Object AI - Test Suite" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Yellow
Write-Host "`n"

# Function to check service status
function Test-Service {
    param([string]$ServiceName)
    Write-Host "🔍 Checking $ServiceName..." -ForegroundColor Blue
    
    try {
        $result = Invoke-WebRequest -Uri "http://localhost:5000/$ServiceName" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $ServiceName: OK" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $ServiceName: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check ADB
function Test-ADB {
    Write-Host "`n📱 Testing ADB Connection..." -ForegroundColor Blue
    
    try {
        $output = & adb devices 2>&1
        Write-Host $output
        
        if ($output -like "*device*") {
            Write-Host "✅ ADB: Connected" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ ADB: No devices found" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ ADB: Not installed or not in PATH" -ForegroundColor Red
        return $false
    }
}

# Function to test call API
function Test-CallAPI {
    Write-Host "`n📞 Testing Call API..." -ForegroundColor Blue
    
    $body = @{
        contact = "Test Contact"
        phoneNumber = $PhoneNumber
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/phone/call" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Call API: Response received" -ForegroundColor Green
        Write-Host "   Status: $($data.message)" -ForegroundColor Cyan
        return $true
    }
    catch {
        Write-Host "❌ Call API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test message API
function Test-MessageAPI {
    Write-Host "`n💬 Testing Message API..." -ForegroundColor Blue
    
    $body = @{
        contact = "Test Contact"
        phoneNumber = $PhoneNumber
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/phone/message" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Message API: Response received" -ForegroundColor Green
        Write-Host "   Status: $($data.message)" -ForegroundColor Cyan
        return $true
    }
    catch {
        Write-Host "❌ Message API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test SMS API
function Test-SMSAPI {
    param([string]$Text = $Message)
    Write-Host "`n📨 Testing SMS API..." -ForegroundColor Blue
    
    $body = @{
        contact = "Test Contact"
        phoneNumber = $PhoneNumber
        message = $Text
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/phone/send-message" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ SMS API: Response received" -ForegroundColor Green
        Write-Host "   Status: $($data.message)" -ForegroundColor Cyan
        return $true
    }
    catch {
        Write-Host "❌ SMS API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check phone status
function Test-PhoneStatus {
    Write-Host "`n📱 Checking Phone Status..." -ForegroundColor Blue
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/phone/status" `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Phone Status API: OK" -ForegroundColor Green
        Write-Host "   Status: $($data.status)" -ForegroundColor Cyan
        Write-Host "   Device: $($data.device)" -ForegroundColor Cyan
        Write-Host "   Connection: $($data.connection)" -ForegroundColor Cyan
        return $data.status -eq "connected"
    }
    catch {
        Write-Host "❌ Phone Status API: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
switch ($Action.ToLower()) {
    "test" {
        Write-Host "🧪 Running Complete System Test..." -ForegroundColor Yellow
        
        # Run all tests
        $adbOk = Test-ADB
        $phoneOk = Test-PhoneStatus
        $callOk = Test-CallAPI
        $msgOk = Test-MessageAPI
        $smsOk = Test-SMSAPI
        
        Write-Host "`n" -ForegroundColor Yellow
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Yellow
        
        $passed = @($adbOk, $phoneOk, $callOk, $msgOk, $smsOk) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
        $total = 5
        
        Write-Host "Passed: $passed / $total" -ForegroundColor $(if($passed -eq $total) { "Green" } else { "Yellow" })
        
        if ($passed -eq $total) {
            Write-Host "`n✅ ALL TESTS PASSED! System is ready." -ForegroundColor Green
        }
        else {
            Write-Host "`n⚠️  Some tests failed. Check errors above." -ForegroundColor Yellow
        }
    }
    
    "call" {
        Write-Host "📞 Testing Call API..." -ForegroundColor Yellow
        Test-CallAPI
    }
    
    "message" {
        Write-Host "💬 Testing Message API..." -ForegroundColor Yellow
        Test-MessageAPI
    }
    
    "sms" {
        Write-Host "📨 Testing SMS API..." -ForegroundColor Yellow
        Test-SMSAPI -Text $Message
    }
    
    "adb" {
        Write-Host "📱 Testing ADB..." -ForegroundColor Yellow
        Test-ADB
    }
    
    "phone" {
        Write-Host "📱 Checking Phone Status..." -ForegroundColor Yellow
        Test-PhoneStatus
    }
    
    default {
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\test-voice.ps1 -Action <action> -PhoneNumber <number> -Message <text>" -ForegroundColor Cyan
        Write-Host "`nActions:" -ForegroundColor Yellow
        Write-Host "  test    - Run all tests" -ForegroundColor Cyan
        Write-Host "  adb     - Test ADB connection" -ForegroundColor Cyan
        Write-Host "  phone   - Check phone status" -ForegroundColor Cyan
        Write-Host "  call    - Test call API" -ForegroundColor Cyan
        Write-Host "  message - Test message API" -ForegroundColor Cyan
        Write-Host "  sms     - Test SMS API" -ForegroundColor Cyan
        Write-Host "`nExamples:" -ForegroundColor Yellow
        Write-Host "  .\test-voice.ps1" -ForegroundColor Cyan
        Write-Host "  .\test-voice.ps1 -Action call -PhoneNumber '+919876543210'" -ForegroundColor Cyan
        Write-Host "  .\test-voice.ps1 -Action sms -Message 'Hello from laptop'" -ForegroundColor Cyan
    }
}

Write-Host "`n"
