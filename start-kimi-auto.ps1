# ============================================================
# Kimi CLI Auto-Switcher (Standalone Script)
# Save as: start-kimi-auto.ps1
# Run with: .\start-kimi-auto.ps1
# ============================================================

param(
    [string[]]$Priority = @(
        "gpt-oss-120b-free",
        "minimax-m3-free",
        "deepseek-v4-free",
        "mimo-v25-free",
        "big-pickle-free"
    ),
    [string]$ProjectPath = $PWD
)

# Model display names
$modelNames = @{
    "gpt-oss-120b-free"    = "GPT-OSS 120B (OpenRouter)"
    "minimax-m3-free"      = "Minimax M3 (OpenCode)"
    "deepseek-v4-free"     = "DeepSeek V4 Flash (OpenCode)"
    "mimo-v25-free"        = "MiMo V2.5 (OpenCode)"
    "big-pickle-free"      = "Big Pickle (OpenCode)"
    "kimi-k2-free"         = "Kimi K2.6 (OpenRouter)"
    "nemotron-super-free"  = "Nemotron 3 Super (OpenRouter)"
    "glm-45-free"          = "GLM 4.5 Air (OpenRouter)"
    "laguna-m1-free"       = "Laguna M.1 (OpenRouter)"
    "laguna-xs2-free"      = "Laguna XS.2 (OpenRouter)"
    "owl-alpha-free"       = "Owl Alpha (OpenRouter)"
    "nemotron-oc-free"     = "Nemotron 3 Super OC (OpenCode)"
}

Write-Host ""
Write-Host "🚀 Kimi CLI Auto-Switcher" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Set project directory
if (Test-Path $ProjectPath) {
    Set-Location $ProjectPath
}

# Verify Kimi is installed
try {
    $kimiVersion = kimi --version 2>$null
    Write-Host "Kimi CLI detected: $kimiVersion" -ForegroundColor Gray
} catch {
    Write-Host "❌ Kimi CLI not found! Install with: pip install kimi-cli" -ForegroundColor Red
    exit 1
}

# Verify config exists
$configPath = "$env:USERPROFILE\.kimi\config.toml"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Kimi config not found at $configPath" -ForegroundColor Red
    exit 1
}

Write-Host "Priority order:" -ForegroundColor Gray
for ($i = 0; $i -lt $Priority.Count; $i++) {
    $name = $modelNames[$Priority[$i]]
    Write-Host "  $($i+1). $name" -ForegroundColor Gray
}
Write-Host ""

# Try each model
$currentIndex = 0
$success = $false
$workingModel = ""

while ($currentIndex -lt $Priority.Count -and -not $success) {
    $modelId = $Priority[$currentIndex]
    $modelName = $modelNames[$modelId]

    Write-Host "▶️  Testing: $modelName..." -ForegroundColor Yellow

    # Determine provider and key
    $providerUrl = ""
    $apiKey = ""

    switch -Wildcard ($modelId) {
        "gpt-oss*" { 
            $providerUrl = "https://openrouter.ai/api/v1"
            $apiKey = $env:OPENROUTER_API_KEY 
        }
        "kimi-k2*" { 
            $providerUrl = "https://openrouter.ai/api/v1"
            $apiKey = $env:OPENROUTER_API_KEY2 
        }
        "nemotron-super*" { 
            $providerUrl = "https://openrouter.ai/api/v1"
            $apiKey = $env:OPENROUTER_API_KEY3 
        }
        "glm-45*" { 
            $providerUrl = "https://openrouter.ai/api/v1"
            $apiKey = $env:OPENROUTER_API_KEY3 
        }
        "laguna*" { 
            $providerUrl = "https://openrouter.ai/api/v1"
            $apiKey = if ($modelId -match "m1") { $env:OPENROUTER_API_KEY } else { $env:OPENROUTER_API_KEY2 }
        }
        "owl*" { 
            $providerUrl = "https://openrouter.ai/api/v1"
            $apiKey = $env:OPENROUTER_API_KEY 
        }
        default { 
            $providerUrl = "https://opencode.ai/zen/v1"
            $apiKey = if ($modelId -match "m3|deepseek|nemotron-oc") { $env:OPENCODE_ZEN_API_KEY3 } else { $env:OPENCODE_ZEN_API_KEY2 }
        }
    }

    if ([string]::IsNullOrEmpty($apiKey)) {
        Write-Host "   ⚠️  API key not set. Skipping..." -ForegroundColor Yellow
        $currentIndex++
        continue
    }

    # Quick API test
    $testBody = @{
        model = $modelId
        messages = @(@{role = "user"; content = "hi"})
        max_tokens = 10
    } | ConvertTo-Json -Depth 3

    $headers = @{
        Authorization = "Bearer $apiKey"
        "Content-Type" = "application/json"
        "HTTP-Referer" = "https://localhost"
        "X-Title" = "Kimi-Auto-Switcher"
    }

    try {
        $null = Invoke-RestMethod -Uri "$providerUrl/chat/completions" `
            -Method POST `
            -Headers $headers `
            -Body $testBody `
            -TimeoutSec 15 `
            -ErrorAction Stop

        Write-Host "   ✅ Responsive!" -ForegroundColor Green
        $success = $true
        $workingModel = $modelId

    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "429" -or $errorMsg -match "rate.limit" -or $errorMsg -match "temporarily rate-limited") {
            Write-Host "   ⚠️  Rate limited (429)" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Error: $($errorMsg.Substring(0, [Math]::Min(100, $errorMsg.Length)))..." -ForegroundColor Red
        }
        $currentIndex++
        if ($currentIndex -lt $Priority.Count) {
            Start-Sleep -Seconds 1
        }
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "❌ All models failed or are rate-limited!" -ForegroundColor Red
    Write-Host "   Wait a few minutes and try again." -ForegroundColor Gray
    exit 1
}

# Launch Kimi CLI with working model
$selectedName = $modelNames[$workingModel]
Write-Host ""
Write-Host "✅ Launching Kimi CLI with: $selectedName" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Launch Kimi - it will use the config.toml model list
# User can /model switch if needed
kimi