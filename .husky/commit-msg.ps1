# AILOS Repository Baseline v1.0.0
# commit-msg Hook — PowerShell
# Validates Conventional Commits format

$COMMIT_MSG = Get-Content $args[0] -Raw

$VALID_TYPES = "feat|fix|docs|style|refactor|perf|test|chore|ci|revert"
$VALID_SCOPES = "gateway|auth|learning|companion|user|admin|infra|config|plugin|deps|release|repo|compliance"

if ($COMMIT_MSG -match '^(Merge|See merge request)') { exit 0 }
if ($COMMIT_MSG -match '^Revert') { exit 0 }

if ($COMMIT_MSG -notmatch "^($VALID_TYPES)\(($VALID_SCOPES)\): .+") {
    Write-Host ""
    Write-Host "============================================"
    Write-Host "  COMMIT BLOCKED: Invalid commit message format"
    Write-Host "============================================"
    Write-Host ""
    Write-Host "  Correct format: <type>(<scope>): <description>"
    Write-Host ""
    Write-Host "  Valid types:  $VALID_TYPES"
    Write-Host "  Valid scopes: $VALID_SCOPES"
    Write-Host ""
    Write-Host "  Example: feat(infra): establish repository baseline v1.0"
    Write-Host "           fix(gateway): correct response statusCode reference"
    Write-Host ""
    exit 1
}

exit 0