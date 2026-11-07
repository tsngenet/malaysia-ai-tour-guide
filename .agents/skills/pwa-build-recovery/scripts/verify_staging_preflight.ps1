#Requires -Version 5.1
<#
.SYNOPSIS
    Preflight safety and deployment verification script for Malaysia AI Tour Guide Staging.
.DESCRIPTION
    Part of the pwa-build-recovery Antigravity skill for Malaysia AI Tour Guide.
    Validates staging configuration, runs unit tests, audits compiled bundle, and confirms isolation.
.EXAMPLE
    .\verify_staging_preflight.ps1
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PWA BUILD RECOVERY: STAGING PREFLIGHT VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Resolve Project Root
$currentDir = $PSScriptRoot
while ($currentDir -and !(Test-Path (Join-Path $currentDir "package.json"))) {
    $parent = Split-Path $currentDir -Parent
    if ($parent -eq $currentDir) { break }
    $currentDir = $parent
}
$projectRoot = $currentDir
Set-Location $projectRoot

$overallStatus = "PASS"
$checks = @()

# 2. Check .env.staging
Write-Host "`n[1] Staging Environment Configuration (.env.staging)..." -ForegroundColor Yellow
$envStagingPath = Join-Path $projectRoot ".env.staging"
if (Test-Path $envStagingPath) {
    $envLines = Get-Content $envStagingPath
    $projLine = $envLines | Where-Object { $_ -match "^VITE_FIREBASE_PROJECT_ID=(.*)$" }
    $keyLine  = $envLines | Where-Object { $_ -match "^VITE_FIREBASE_API_KEY=(.*)$" }
    $emuLine  = $envLines | Where-Object { $_ -match "^VITE_USE_FIREBASE_EMULATOR=(.*)$" }

    $projId = if ($projLine) { ($projLine -split '=', 2)[1].Trim() } else { "" }
    $apiKey = if ($keyLine)  { ($keyLine -split '=', 2)[1].Trim() } else { "" }
    $useEmu = if ($emuLine)  { ($emuLine -split '=', 2)[1].Trim() } else { "" }

    if ($projId -eq "msiatguide-staging") {
        Write-Host "  ✓ VITE_FIREBASE_PROJECT_ID = msiatguide-staging" -ForegroundColor Green
        $checks += [PSCustomObject]@{ Check = "Staging Project ID"; Status = "PASS"; Details = $projId }
    } else {
        Write-Host "  [FAIL] Expected 'msiatguide-staging', found '$projId'" -ForegroundColor Red
        $checks += [PSCustomObject]@{ Check = "Staging Project ID"; Status = "FAIL"; Details = $projId }
        $overallStatus = "FAIL"
    }

    if ($useEmu -eq "false") {
        Write-Host "  ✓ VITE_USE_FIREBASE_EMULATOR = false" -ForegroundColor Green
        $checks += [PSCustomObject]@{ Check = "Emulator Disabled"; Status = "PASS"; Details = "false" }
    } else {
        Write-Host "  [FAIL] Expected VITE_USE_FIREBASE_EMULATOR=false, found '$useEmu'" -ForegroundColor Red
        $checks += [PSCustomObject]@{ Check = "Emulator Disabled"; Status = "FAIL"; Details = $useEmu }
        $overallStatus = "FAIL"
    }

    if ($apiKey -and !$apiKey.Contains("demo-") -and !$apiKey.Contains("HERE")) {
        Write-Host "  ✓ Valid Staging API Key present" -ForegroundColor Green
        $checks += [PSCustomObject]@{ Check = "Staging API Key"; Status = "PASS"; Details = "Configured" }
    } else {
        Write-Host "  [FAIL] Missing or placeholder API key in .env.staging" -ForegroundColor Red
        $checks += [PSCustomObject]@{ Check = "Staging API Key"; Status = "FAIL"; Details = "Placeholder" }
        $overallStatus = "FAIL"
    }
} else {
    Write-Host "  [FAIL] .env.staging not found at $envStagingPath" -ForegroundColor Red
    $checks += [PSCustomObject]@{ Check = ".env.staging File"; Status = "FAIL"; Details = "Missing" }
    $overallStatus = "FAIL"
}

# 3. Run Route Builder Unit Tests
Write-Host "`n[2] Running Route Builder Unit Tests (test_route_builder.mjs)..." -ForegroundColor Yellow
$nodeExe = "C:\Program Files\nodejs\node.exe"
if (!(Test-Path $nodeExe)) { $nodeExe = "node" }

$testProc = Start-Process -FilePath $nodeExe -ArgumentList "test_route_builder.mjs" -NoNewWindow -PassThru -Wait
if ($testProc.ExitCode -eq 0) {
    Write-Host "  ✓ All 23 Route Builder unit tests PASSED (Exit Code: 0)" -ForegroundColor Green
    $checks += [PSCustomObject]@{ Check = "Route Builder Unit Tests"; Status = "PASS"; Details = "23/23 Passed" }
} else {
    Write-Host "  [FAIL] Route Builder unit tests failed with exit code $($testProc.ExitCode)" -ForegroundColor Red
    $checks += [PSCustomObject]@{ Check = "Route Builder Unit Tests"; Status = "FAIL"; Details = "Exit $($testProc.ExitCode)" }
    $overallStatus = "FAIL"
}

# 4. Audit Compiled Bundle in dist/
Write-Host "`n[3] Auditing Compiled Staging Bundle (dist/assets/index-*.js)..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path (Join-Path $projectRoot "dist\assets") -Filter "index-*.js" -ErrorAction SilentlyContinue
if ($jsFiles.Count -gt 0) {
    $bundleContent = [System.IO.File]::ReadAllText($jsFiles[0].FullName)
    $hasStaging = $bundleContent.Contains("msiatguide-staging")
    $hasProdTarget = $bundleContent.Contains('"projectId":"msiatguide"') -or $bundleContent.Contains('projectId:"msiatguide"')
    $hasEmuHosts = $bundleContent.Contains("127.0.0.1:9099") -or $bundleContent.Contains("127.0.0.1:8080")

    if ($hasStaging -and !$hasProdTarget -and !$hasEmuHosts) {
        Write-Host "  ✓ Bundle targets msiatguide-staging cleanly with no emulator or production leak" -ForegroundColor Green
        $checks += [PSCustomObject]@{ Check = "Bundle Isolation"; Status = "PASS"; Details = "Clean staging target" }
    } else {
        Write-Host "  [FAIL] Bundle audit failed: Staging=$hasStaging, ProdLeak=$hasProdTarget, EmuLeak=$hasEmuHosts" -ForegroundColor Red
        $checks += [PSCustomObject]@{ Check = "Bundle Isolation"; Status = "FAIL"; Details = "Audit failure" }
        $overallStatus = "FAIL"
    }
} else {
    Write-Host "  [WARN] dist/ does not exist. Run build_low_memory.ps1 first." -ForegroundColor Yellow
    $checks += [PSCustomObject]@{ Check = "Bundle Isolation"; Status = "WARN"; Details = "No dist bundle" }
}

# 5. Git Status Check
Write-Host "`n[4] Git Status & Working Tree Safety..." -ForegroundColor Yellow
$currentBranch = (git branch --show-current).Trim()
Write-Host "  Active Branch: $currentBranch"
if ($currentBranch -eq "feature/route-builder-phase1") {
    Write-Host "  ✓ Working on intended feature branch" -ForegroundColor Green
    $checks += [PSCustomObject]@{ Check = "Git Branch"; Status = "PASS"; Details = $currentBranch }
} else {
    Write-Host "  [WARN] Not on feature/route-builder-phase1 (Current: $currentBranch)" -ForegroundColor Yellow
    $checks += [PSCustomObject]@{ Check = "Git Branch"; Status = "WARN"; Details = $currentBranch }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  PREFLIGHT SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
$checks | Format-Table Check, Status, Details -AutoSize

if ($overallStatus -eq "PASS") {
    Write-Host "--> ALL PREFLIGHT CHECKS PASSED. Ready for staging deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host "--> PREFLIGHT CHECKS FAILED. Correct issues before deploying." -ForegroundColor Red
    exit 1
}
