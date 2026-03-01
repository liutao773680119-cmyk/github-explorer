param(
    [string]$ProjectRoot = (Get-Location).Path,
    [string]$Profile = 'stock-cn',
    [string]$Tools = 'antigravity,cursor,vscode,codex',
    [ValidateSet('bilingual', 'cn', 'en')]
    [string]$Naming = 'bilingual',
    [switch]$Force,
    [switch]$SkipPreflight,
    [switch]$SkipSkillSync
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ProjectRoot)) {
    Write-Host "[FAIL] ProjectRoot not found: $ProjectRoot" -ForegroundColor Red
    exit 1
}

$projectRootResolved = (Resolve-Path $ProjectRoot).Path

Write-Host "[Relay Init] Starting..."
Write-Host "  ProjectRoot: $projectRootResolved"
Write-Host "  Profile: $Profile"
Write-Host "  Tools: $Tools"
Write-Host "  Naming: $Naming"
Write-Host "  Force: $Force"

$renderScript = Join-Path $PSScriptRoot 'relay_render.py'
if (-not (Test-Path $renderScript)) {
    Write-Host "[FAIL] relay_render.py not found: $renderScript" -ForegroundColor Red
    exit 1
}
$sourceRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

Push-Location $projectRootResolved
try {
    Write-Host "[0/5] Bootstrap kit assets (if missing)"
    $targetConfig = Join-Path $projectRootResolved 'relay.config.json'
    $sourceConfig = Join-Path $sourceRoot 'relay.config.json'
    if (-not (Test-Path $targetConfig)) {
        if (Test-Path $sourceConfig) {
            Copy-Item -Force $sourceConfig $targetConfig
            Write-Host "  - copied relay.config.json"
        } else {
            Write-Host "[FAIL] source relay.config.json not found: $sourceConfig" -ForegroundColor Red
            exit 1
        }
    }

    $targetStarter = Join-Path $projectRootResolved 'starter/relay-kit-v1'
    $sourceStarter = Join-Path $sourceRoot 'starter/relay-kit-v1'
    if (-not (Test-Path $targetStarter)) {
        if (Test-Path $sourceStarter) {
            New-Item -ItemType Directory -Path (Join-Path $projectRootResolved 'starter') -Force | Out-Null
            Copy-Item -Recurse -Force $sourceStarter $targetStarter
            Write-Host "  - copied starter/relay-kit-v1"
        } else {
            Write-Host "[FAIL] source starter not found: $sourceStarter" -ForegroundColor Red
            exit 1
        }
    }

    $targetScripts = Join-Path $projectRootResolved 'scripts'
    New-Item -ItemType Directory -Path $targetScripts -Force | Out-Null
    Copy-Item -Force $renderScript (Join-Path $targetScripts 'relay_render.py')
    Copy-Item -Force (Join-Path $PSScriptRoot 'relay_init.ps1') (Join-Path $targetScripts 'relay_init.ps1')

    Write-Host "[1/5] Environment detection"
    if (Test-Path '.git') {
        Write-Host "  - Git: detected"
    } else {
        Write-Host "  - Git: not detected"
    }

    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        Write-Host "[FAIL] python not found in PATH" -ForegroundColor Red
        exit 1
    }
    python -V

    Write-Host "[2/5] Render relay templates"
    $reportFile = Join-Path $projectRootResolved '_relay_init_report.json'
    $renderArgs = @(
        $renderScript,
        '--project-root', $projectRootResolved,
        '--profile', $Profile,
        '--tools', $Tools,
        '--naming', $Naming,
        '--report-file', $reportFile
    )
    if ($Force) { $renderArgs += '--force' }
    python @renderArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] relay_render.py exited with code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host "[3/5] Sync skills"
    if (-not $SkipSkillSync) {
        if (Test-Path 'scripts/sync_skills.ps1') {
            powershell -ExecutionPolicy Bypass -File 'scripts/sync_skills.ps1' -ProjectRoot $projectRootResolved
        } else {
            Write-Host "  - skipped (scripts/sync_skills.ps1 not found)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  - skipped by flag"
    }

    Write-Host "[4/5] Preflight"
    if (-not $SkipPreflight) {
        if (Test-Path 'scripts/preflight.ps1') {
            powershell -ExecutionPolicy Bypass -File 'scripts/preflight.ps1' -ProjectRoot $projectRootResolved
        } else {
            Write-Host "  - skipped (scripts/preflight.ps1 not found)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  - skipped by flag"
    }

    Write-Host "[5/5] Init report"
    if (Test-Path $reportFile) {
        Write-Host "  - report: $reportFile"
        $summary = Get-Content -Raw -Encoding UTF8 $reportFile | ConvertFrom-Json
        Write-Host "  - created: $($summary.created.Count)"
        Write-Host "  - updated: $($summary.updated.Count)"
        Write-Host "  - skipped: $($summary.skipped.Count)"
        Write-Host "  - unchanged: $($summary.unchanged.Count)"
    } else {
        Write-Host "  - report not found" -ForegroundColor Yellow
    }

    Write-Host "Relay init completed." -ForegroundColor Green
}
finally {
    Pop-Location
}
