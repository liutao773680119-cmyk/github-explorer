param(
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

Write-Host "[1/8] ProjectRoot: $ProjectRoot"

$requiredFiles = @(
    'AGENTS.md',
    'task_registry.md',
    'task_plan.md',
    'findings.md',
    'progress.md',
    'relay.map.json'
)

$missing = @()
foreach ($f in $requiredFiles) {
    $full = Join-Path $ProjectRoot $f
    if (-not (Test-Path $full)) { $missing += $f }
}

Write-Host "[2/8] Required files checked"
if ($missing.Count -gt 0) {
    Write-Host "[FAIL] Missing files:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "[2.5/8] Tool-specific file checks"
$toolSpecific = @(
    '.cursorrules',
    '.cursor/rules/00-core.mdc',
    '.github/copilot-instructions.md'
)
foreach ($f in $toolSpecific) {
    $full = Join-Path $ProjectRoot $f
    if (-not (Test-Path $full)) {
        Write-Host "[WARN] Optional tool file missing: $f" -ForegroundColor Yellow
    }
}

Write-Host "[3/8] Path baseline checks"
$pathCheckFiles = @(
    (Join-Path $ProjectRoot 'AGENTS.md')
)
if (Test-Path (Join-Path $ProjectRoot '.cursorrules')) {
    $pathCheckFiles += (Join-Path $ProjectRoot '.cursorrules')
}
if (Test-Path (Join-Path $ProjectRoot 'bert_model/stock_network_v31_windows.py')) {
    $pathCheckFiles += (Join-Path $ProjectRoot 'bert_model/stock_network_v31_windows.py')
}
if (Test-Path (Join-Path $ProjectRoot 'bert_model/stock_query_app.py')) {
    $pathCheckFiles += (Join-Path $ProjectRoot 'bert_model/stock_query_app.py')
}

$legacyHits = Select-String -Path $pathCheckFiles -Pattern '1月涨停数据/' -SimpleMatch -ErrorAction SilentlyContinue
if ($legacyHits) {
    Write-Host "[WARN] Found legacy path reference '1月涨停数据/' in:" -ForegroundColor Yellow
    $legacyHits | ForEach-Object { Write-Host "  - $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow }
} else {
    Write-Host "[OK] No legacy path references in key files"
}

Write-Host "[4/8] Relay map checks"
$mapPath = Join-Path $ProjectRoot 'relay.map.json'
try {
    $map = Get-Content -Raw -Encoding UTF8 $mapPath | ConvertFrom-Json
    $naming = if ($map.naming) { "$($map.naming)" } else { 'bilingual' }
    foreach ($item in $map.aliases) {
        $enabled = $false
        if ($item.enabledIn) {
            $enabled = @($item.enabledIn) -contains $naming
        }
        if ($enabled) {
            $primary = Join-Path $ProjectRoot $item.primary
            $alias = Join-Path $ProjectRoot $item.alias
            if (-not (Test-Path $primary)) { Write-Host "[WARN] Missing primary file: $($item.primary)" -ForegroundColor Yellow }
            if (-not (Test-Path $alias)) { Write-Host "[WARN] Missing alias file: $($item.alias)" -ForegroundColor Yellow }
        }
    }
    Write-Host "[OK] relay.map.json parsed"
} catch {
    Write-Host "[FAIL] relay.map.json invalid JSON" -ForegroundColor Red
    exit 1
}

Write-Host "[5/8] Prompt contract checks"
$promptCandidates = @(
    '模型接力开发_固定提示词与命令.txt',
    '模型接力开发_4个固定提示词.txt',
    'relay_prompts.txt'
)
$promptFile = $null
foreach ($candidate in $promptCandidates) {
    $full = Join-Path $ProjectRoot $candidate
    if (Test-Path $full) { $promptFile = $full; break }
}
if (-not $promptFile) {
    Write-Host "[WARN] No prompt contract file found" -ForegroundColor Yellow
} else {
    $promptText = Get-Content -Raw -Encoding UTF8 $promptFile
    $requiredTerms = @('Session Context', 'Task-ID', 'Latest Handoff Snapshot', 'Session Record', 'Next First Command', 'Status: BLOCKED')
    foreach ($term in $requiredTerms) {
        if ($promptText -notmatch [Regex]::Escape($term)) {
            Write-Host "[WARN] Prompt file missing term: $term" -ForegroundColor Yellow
        }
    }
    Write-Host "[OK] Prompt contract checked: $([System.IO.Path]::GetFileName($promptFile))"
}

Write-Host "[5.5/8] Relay skill checks"
$requiredRelaySkills = @('relay-start','relay-handoff-stop','relay-resync','relay-scope-change','relay-verify')
$relaySources = @(
    (Join-Path $ProjectRoot '.relay/skills'),
    (Join-Path $ProjectRoot 'starter/relay-kit-v1/global-skills'),
    (Join-Path $ProjectRoot '.agent/skills'),
    (Join-Path $ProjectRoot '.cursor/skills')
)
$completeRelaySource = $null
foreach ($src in $relaySources) {
    if (-not (Test-Path $src)) { continue }
    $missingRelay = @()
    foreach ($skill in $requiredRelaySkills) {
        $skillFile = Join-Path $src "$skill/SKILL.md"
        if (-not (Test-Path $skillFile)) { $missingRelay += $skill }
    }
    if ($missingRelay.Count -eq 0) {
        $completeRelaySource = $src
        break
    } else {
        Write-Host "[WARN] Relay skill source incomplete: $src (missing: $($missingRelay -join ', '))" -ForegroundColor Yellow
    }
}
if ($completeRelaySource) {
    Write-Host "[OK] Relay skill source complete: $completeRelaySource"
} else {
    Write-Host "[WARN] No complete relay skill source found (.relay/skills or starter/relay-kit-v1/global-skills)" -ForegroundColor Yellow
}

Write-Host "[5.6/8] Unrendered template placeholder checks"
$placeholderPattern = '\{\{[^}]+\}\}'
$placeholderCheckFiles = @(
    'AGENTS.md',
    'GEMINI.md',
    '.cursorrules',
    '.cursor/rules/00-core.mdc',
    '.cursor/rules/10-handoff.mdc',
    '.github/copilot-instructions.md',
    '.github/instructions/handoff.instructions.md',
    '模型接力开发_固定提示词与命令.txt',
    'relay_prompts.txt',
    'progress.md',
    'task_plan.md',
    'findings.md'
)
$placeholderHits = @()
foreach ($rel in $placeholderCheckFiles) {
    $full = Join-Path $ProjectRoot $rel
    if (-not (Test-Path $full)) { continue }
    $hits = Select-String -Path $full -Pattern $placeholderPattern -AllMatches -ErrorAction SilentlyContinue
    if ($hits) { $placeholderHits += $hits }
}
if ($placeholderHits.Count -gt 0) {
    Write-Host "[FAIL] Found unrendered template placeholders:" -ForegroundColor Red
    $placeholderHits | ForEach-Object { Write-Host "  - $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    exit 1
} else {
    Write-Host "[OK] No unrendered placeholders in key files"
}
Write-Host "[6/8] Rule consistency checks"
$ruleFiles = @(
    (Join-Path $ProjectRoot '.cursorrules'),
    (Join-Path $ProjectRoot '.cursor/rules/00-core.mdc'),
    (Join-Path $ProjectRoot '.github/copilot-instructions.md')
)
foreach ($file in $ruleFiles) {
    if (Test-Path $file) {
        $content = Get-Content -Raw -Encoding UTF8 $file
        if ($content -notmatch 'AGENTS\.md') {
            Write-Host "[WARN] Missing AGENTS.md reference: $file" -ForegroundColor Yellow
        }
    }
}
Write-Host "[OK] Rule consistency checked"

Write-Host "[7/8] Runtime checks"
python -V

Write-Host "[8/8] Entry file checks"
$entryFiles = @(
    'master_network_v31.json',
    'AGENTS.md',
    'progress.md',
    'task_plan.md',
    'findings.md'
)
foreach ($f in $entryFiles) {
    $full = Join-Path $ProjectRoot $f
    if (Test-Path $full) {
        Write-Host "  [OK] $f"
    } else {
        Write-Host "  [WARN] $f (not found)" -ForegroundColor Yellow
    }
}

Write-Host "Preflight completed." -ForegroundColor Green
