param(
    [string]$Source = "$env:USERPROFILE/.codex/skills",
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$localRelaySource = Join-Path $ProjectRoot '.relay/skills'
$starterRelaySource = Join-Path $ProjectRoot 'starter/relay-kit-v1/global-skills'

$targets = @(
    (Join-Path $ProjectRoot '.cursor/skills'),
    (Join-Path $ProjectRoot '.agent/skills')
)

$sources = @()
if (Test-Path $Source) { $sources += $Source } else { Write-Host "[WARN] Primary source not found: $Source" -ForegroundColor Yellow }
if (Test-Path $localRelaySource) { $sources += $localRelaySource }
elseif (Test-Path $starterRelaySource) { $sources += $starterRelaySource }

if ($sources.Count -eq 0) {
    Write-Host "[FAIL] No skill sources available." -ForegroundColor Red
    exit 1
}

Write-Host "Skill sources:"
$sources | ForEach-Object { Write-Host "  - $_" }

foreach ($target in $targets) {
    New-Item -ItemType Directory -Path $target -Force | Out-Null
    Write-Host "Syncing to: $target"

    foreach ($src in $sources) {
        $skillDirs = Get-ChildItem -Path $src -Directory | Where-Object { $_.Name -ne '.system' }
        foreach ($skill in $skillDirs) {
            $dst = Join-Path $target $skill.Name
            if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
            Copy-Item -Recurse -Force $skill.FullName $dst
            Write-Host "  [OK] $($skill.Name) (from $src)"
        }
    }
}

Write-Host "Skill sync completed." -ForegroundColor Green
