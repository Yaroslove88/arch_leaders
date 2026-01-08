# Скрипт для обновления теорий квестов (PowerShell)
# Использование: .\scripts\update-quest-theories.ps1

$API_URL = $env:API_URL
if (-not $API_URL) {
    $API_URL = "http://localhost:3001"
}

$mappingPath = Join-Path $PSScriptRoot "..\data\quest-theories-mapping.json"
$mappingPath = Resolve-Path $mappingPath

Write-Host "Загрузка маппинга из $mappingPath..." -ForegroundColor Cyan

if (-not (Test-Path $mappingPath)) {
    Write-Host "Ошибка: файл $mappingPath не найден" -ForegroundColor Red
    exit 1
}

$mapping = Get-Content $mappingPath -Raw | ConvertFrom-Json
Write-Host "Найдено $($mapping.Count) записей для обновления`n" -ForegroundColor Green

$body = @{
    mapping = $mapping
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$API_URL/quests/update-theories-from-mapping" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ Результат обновления:" -ForegroundColor Green
    Write-Host "   Обновлено квестов: $($response.updated)" -ForegroundColor Green
    
    if ($response.notFound -and $response.notFound.Count -gt 0) {
        Write-Host "   Не найдено: $($response.notFound.Count)" -ForegroundColor Yellow
        Write-Host "   Список: $($response.notFound -join ', ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ошибка при обновлении:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit 1
}

