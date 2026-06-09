# ============================================================
# Claude Code + LiteLLM Proxy Launcher (Windows Fixed)
# ============================================================

# --- STEP 1: Kill any existing proxy processes ---
Write-Host "[*] Stopping any existing LiteLLM proxy processes..."
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*litellm*" } | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

# --- STEP 2: Clear ALL auth variables ---
Write-Host "[*] Clearing auth environment variables..."
Remove-Item Env:\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:\ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\ANTHROPIC_BASE_URL -ErrorAction SilentlyContinue

# --- STEP 3: Clear Claude Code cache ---
Write-Host "[*] Clearing Claude Code auth cache..."
$claudeDir = "$env:USERPROFILE\.claude"
if (Test-Path "$claudeDir\auth.json") { Remove-Item "$claudeDir\auth.json" -Force }
if (Test-Path "$claudeDir\settings.json") { Remove-Item "$claudeDir\settings.json" -Force }

# --- STEP 4: Set environment for BOTH proxy and Claude Code ---
Write-Host "[*] Setting proxy environment variables..."
$env:ANTHROPIC_BASE_URL = "http://localhost:4000"
$env:ANTHROPIC_API_KEY = "sk-proxy-for-claude-777"
$env:CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS = "1"
# Proxy needs these to read from config
$env:LITELLM_MASTER_KEY = "sk-proxy-for-claude-777"

Write-Host ""
Write-Host "[OK] Environment configured:"
Write-Host "     ANTHROPIC_BASE_URL = $env:ANTHROPIC_BASE_URL"
Write-Host "     ANTHROPIC_API_KEY = $env:ANTHROPIC_API_KEY"
$authToken = if($env:ANTHROPIC_AUTH_TOKEN) { $env:ANTHROPIC_AUTH_TOKEN } else { "(not set - GOOD!)" }
Write-Host "     ANTHROPIC_AUTH_TOKEN = $authToken"
Write-Host "     CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS = $env:CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS"
Write-Host "     LITELLM_MASTER_KEY = $env:LITELLM_MASTER_KEY"
Write-Host ""

# --- STEP 5: Start LiteLLM Proxy in a NEW window with UTF-8 and env vars ---
Write-Host "[*] Starting LiteLLM Proxy in a new window..."
$proxyCommand = @"
chcp 65001
`$env:PYTHONIOENCODING='utf-8'
`$env:LITELLM_MASTER_KEY='sk-proxy-for-claude-777'
`$env:OPENROUTER_API_KEY='$env:OPENROUTER_API_KEY'
`$env:OPENROUTER_API_KEY2='$env:OPENROUTER_API_KEY2'
`$env:OPENROUTER_API_KEY3='$env:OPENROUTER_API_KEY3'
`$env:OPENCODE_ZEN_API_KEY2='$env:OPENCODE_ZEN_API_KEY2'
`$env:OPENCODE_ZEN_API_KEY3='$env:OPENCODE_ZEN_API_KEY3'
cd '$PWD'
litellm --config litellm_config_working.yaml --port 4000
"@

$proxyWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", $proxyCommand -PassThru

# Wait for proxy to boot
Write-Host "[*] Waiting 15 seconds for proxy to start..."
Start-Sleep -Seconds 15

# --- STEP 6: Test proxy health WITH auth ---
Write-Host "[*] Testing proxy health..."
try {
    $healthHeaders = @{
        Authorization = "Bearer sk-proxy-for-claude-777"
    }
    $health = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method GET -Headers $healthHeaders -TimeoutSec 10
    Write-Host "     Proxy is HEALTHY [OK]"
} catch {
    Write-Host "     Proxy health check failed!"
    Write-Host "     Error: $_"
    Write-Host ""
    Write-Host "     Check the proxy window for errors."
    exit 1
}

# --- STEP 7: Test with real request ---
Write-Host "[*] Testing proxy with a real request..."
$testBody = @{
    model = "coding-pool-opencode"
    max_tokens = 50
    messages = @(@{role = "user"; content = "say hi"})
    stream = $false
} | ConvertTo-Json -Depth 3

try {
    $testHeaders = @{
        Authorization = "Bearer sk-proxy-for-claude-777"
        "Content-Type" = "application/json"
    }
    $testResponse = Invoke-RestMethod -Uri "http://localhost:4000/v1/messages" `
        -Method POST `
        -Headers $testHeaders `
        -Body $testBody `
        -TimeoutSec 30
    Write-Host "     Proxy test SUCCESS [OK]"
    Write-Host "     Response model: $($testResponse.model)"
} catch {
    Write-Host "     Proxy test FAILED!"
    Write-Host "     Error: $_"
    exit 1
}

Write-Host ""
Write-Host "[*] Launching Claude Code..."
Write-Host "     Model: coding-pool-opencode"
Write-Host "     When asked about API key, press 1 then Enter for YES"
Write-Host ""

# --- STEP 8: Launch Claude Code ---
claude --model coding-pool-opencode

Write-Host ""
Write-Host "[*] Claude Code exited."
Write-Host "    Closing proxy window..."
Stop-Process -Id $proxyWindow.Id -Force -ErrorAction SilentlyContinue
Write-Host "    Done."