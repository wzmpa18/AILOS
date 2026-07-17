# AILOS Repository Baseline v1.0.0
# pre-commit Hook — PowerShell
# Architecture compliance + secret leak scan

Write-Host "============================================"
Write-Host "  AILOS Compliance Check — Pre-commit Hook"
Write-Host "============================================"

$STAGED = git diff --cached --name-only

if ($STAGED) {
    $SENSITIVE = $STAGED | Where-Object { $_ -match '\.env\.local$|\.env\.production$|\.env\.test$|\.pem$|\.key$|\.pfx$|\.p12$|id_rsa|private_key' }
    if ($SENSITIVE) {
        Write-Host ""
        Write-Host "!!! COMMIT BLOCKED: Sensitive files detected !!!"
        $SENSITIVE | ForEach-Object { Write-Host "  $_" }
        Write-Host ""
        exit 1
    }

    $DIFF = git diff --cached
    if ($DIFF -match '(sk-[a-zA-Z0-9]{20,}|api_key\s*[:=]\s*["""'"'"'][a-zA-Z0-9_-]{20,}["""'"'"']|apiKey\s*[:=]\s*["""'"'"'][a-zA-Z0-9_-]{20,}["""'"'"']|secret_key\s*[:=]\s*["""'"'"'][a-zA-Z0-9_-]{20,}["""'"'"']|secretKey\s*[:=]\s*["""'"'"'][a-zA-Z0-9_-]{20,}["""'"'"'])') {
        Write-Host ""
        Write-Host "!!! COMMIT BLOCKED: Hardcoded API key detected !!!"
        Write-Host ""
        exit 1
    }

    if ($DIFF -match '(https?://api\.(openai|anthropic|deepseek|hunyuan)|https?://[a-zA-Z0-9.-]+/(v1/chat|v1/completions|v1/embeddings))') {
        Write-Host ""
        Write-Host "!!! COMMIT BLOCKED: Direct model API call detected !!!"
        Write-Host "All AI calls must go through AI Gateway"
        Write-Host ""
        exit 1
    }
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    if (Test-Path compliance/scripts/compliance_check.py) {
        Write-Host ""
        Write-Host "Running full compliance check..."
        python compliance/scripts/compliance_check.py --path . --level 1
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "!!! COMMIT BLOCKED: Level 1 violations detected !!!"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "Compliance check passed"
Write-Host ""
exit 0