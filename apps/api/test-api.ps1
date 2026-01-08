# API Test Script for Leadership Architect

$baseUrl = "http://localhost:3001"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Testing API..." -ForegroundColor Cyan
Write-Host ""

# 1. Test base endpoint
Write-Host "1. Testing GET /" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -UseBasicParsing -TimeoutSec 5
    Write-Host "OK - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - Error: $_" -ForegroundColor Red
}
Write-Host ""

# 2. Create test entry
Write-Host "2. Testing POST /entries" -ForegroundColor Yellow
$entryData = @{
    type = "situation"
    source = "web"
    text = "Test situation: Conflict between teams. Need quick decision."
    participants = @("Team A", "Team B", "Me")
    context_json = @{
        meeting = "Weekly sync"
        decision = "Priority to Team A"
    }
    tags = @("conflict", "priority")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/entries" -Method POST -Headers $headers -Body $entryData -UseBasicParsing
    $entry = $response.Content | ConvertFrom-Json
    $entryId = $entry.id
    Write-Host "OK - Entry ID: $entryId" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Error: $_" -ForegroundColor Red
    $entryId = $null
}
Write-Host ""

# 3. Get all entries
Write-Host "3. Testing GET /entries" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/entries" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    Write-Host "OK - Total: $($data.total)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Error: $_" -ForegroundColor Red
}
Write-Host ""

# 4. Get entry by ID
if ($entryId) {
    Write-Host "4. Testing GET /entries/$entryId" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/entries/$entryId" -UseBasicParsing -TimeoutSec 5
        $entry = $response.Content | ConvertFrom-Json
        Write-Host "OK - Type: $($entry.type)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED - Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    # 5. Create session
    Write-Host "5. Testing POST /sessions" -ForegroundColor Yellow
    $sessionData = @{
        entry_id = $entryId
        summary = "Test session: Conflict analyzed. Applied containment skills."
        insights_json = @(@{title = "Conflict"; description = "Teams have different priorities"})
        focus_json = @(@{area = "Communication"; priority = "high"})
        themes = @("conflict", "priority")
        patterns = @("avoidance")
        tensions = @("team a vs team b")
        ability_signals_json = @(@{node_id = "node_containment"; signal = "Held tension"})
        status = "done"
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/sessions" -Method POST -Headers $headers -Body $sessionData -UseBasicParsing
        $session = $response.Content | ConvertFrom-Json
        $sessionId = $session.id
        Write-Host "OK - Session ID: $sessionId" -ForegroundColor Green
    } catch {
        Write-Host "FAILED - Error: $_" -ForegroundColor Red
        $sessionId = $null
    }
    Write-Host ""

    # 6. Create evidence
    if ($sessionId) {
        Write-Host "6. Testing POST /evidence" -ForegroundColor Yellow
        $evidenceData = @{
            type = "situation"
            text = "In conflict situation I held tension without resolving immediately."
            ability_node_id = "node_containment"
            session_id = $sessionId
            tags = @("containment")
        } | ConvertTo-Json

        try {
            $response = Invoke-WebRequest -Uri "$baseUrl/evidence" -Method POST -Headers $headers -Body $evidenceData -UseBasicParsing
            $evidence = $response.Content | ConvertFrom-Json
            Write-Host "OK - Evidence ID: $($evidence.id)" -ForegroundColor Green
        } catch {
            Write-Host "FAILED - Error: $_" -ForegroundColor Red
        }
        Write-Host ""
    }
}

# 7. Get all sessions
Write-Host "7. Testing GET /sessions" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/sessions" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    Write-Host "OK - Total: $($data.total)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Error: $_" -ForegroundColor Red
}
Write-Host ""

# 8. Get all evidence
Write-Host "8. Testing GET /evidence" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/evidence" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    Write-Host "OK - Total: $($data.total)" -ForegroundColor Green
} catch {
    Write-Host "FAILED - Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "Testing completed!" -ForegroundColor Cyan
