#Requires -Version 5.1
<#
.SYNOPSIS
    Executes a low-memory, isolated Vite staging build bypassing fragile Windows npm wrappers.
.DESCRIPTION
    Part of the pwa-build-recovery Antigravity skill for Malaysia AI Tour Guide.
    Enforces Node.js heap limits, validates available OS commit capacity, directly invokes
    Vite to avoid PATH conflicts, and inspects compiled bundles to prevent configuration leaks.
.PARAMETER Mode
    Vite build mode (default: 'staging').
.PARAMETER MaxHeapMB
    Node.js V8 max-old-space-size in megabytes (default: 1024).
.PARAMETER MinCommitRequiredMB
    Minimum free virtual commit memory required to proceed (default: 600).
.EXAMPLE
    .\build_low_memory.ps1 -Mode staging -MaxHeapMB 1024
#>

[CmdletBinding()]
param(
    [string]$Mode = "staging",
    [int]$MaxHeapMB = 1024,
    [int]$MinCommitRequiredMB = 600
)

$ErrorActionPreference = 'Stop'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PWA BUILD RECOVERY: LOW-MEMORY VITE BUILD PIPELINE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Inspect Available Commit Memory
$os = Get-CimInstance Win32_OperatingSystem
$freeCommitMB = [math]::Round($os.FreeVirtualMemory / 1024, 2)
Write-Host ("--> [Preflight] Free Virtual Commit: {0:N0} MB (Required: {1:N0} MB)" -f $freeCommitMB, $MinCommitRequiredMB)

if ($freeCommitMB -lt $MinCommitRequiredMB) {
    Write-Host ("`n[FATAL RESOURCE EXHAUSTION] Windows free virtual commit ({0:N0} MB) is below safe minimum ({1:N0} MB)." -f $freeCommitMB, $MinCommitRequiredMB) -ForegroundColor Red
    Write-Host "Aborting build to prevent Windows 0x800705AF / NewSpace Allocation Failure." -ForegroundColor Red
    Write-Host "Please close memory-heavy applications (Chrome tabs, Edge, background tasks) and re-run." -ForegroundColor Yellow
    exit 2
}

# 2. Resolve Verified Node.js Executable
$preferredNode = "C:\Program Files\nodejs\node.exe"
$nodeExe = $null

if (Test-Path $preferredNode) {
    $nodeExe = $preferredNode
    Write-Host "--> [Toolchain] Using verified primary Node.js: $nodeExe" -ForegroundColor Green
} else {
    $discovered = @(where.exe node 2>$null)
    if ($discovered.Count -gt 0) {
        $nodeExe = $discovered[0]
        Write-Host "--> [Toolchain] Primary Node.js not found at default path. Falling back to: $nodeExe" -ForegroundColor Yellow
    } else {
        Write-Host "[FATAL ERROR] No Node.js executable found on system." -ForegroundColor Red
        exit 3
    }
}

# 3. Locate Project Root & Vite Entrypoint
$currentDir = $PSScriptRoot
while ($currentDir -and !(Test-Path (Join-Path $currentDir "package.json"))) {
    $parent = Split-Path $currentDir -Parent
    if ($parent -eq $currentDir) { break }
    $currentDir = $parent
}

$projectRoot = $currentDir
if (!(Test-Path (Join-Path $projectRoot "package.json"))) {
    Write-Host "[FATAL ERROR] Could not locate project root containing package.json" -ForegroundColor Red
    exit 4
}

Set-Location $projectRoot
$viteBin = Join-Path $projectRoot "node_modules\vite\bin\vite.js"

if (!(Test-Path $viteBin)) {
    Write-Host "[FATAL ERROR] Vite binary not found at $viteBin. Did you run npm install?" -ForegroundColor Red
    exit 4
}

# 4. Configure Environment & Heap
$env:NODE_OPTIONS = "--max-old-space-size=$MaxHeapMB"
Write-Host "--> [Config] NODE_OPTIONS set to: $env:NODE_OPTIONS"
Write-Host "--> [Config] Invoking Vite directly: node $viteBin build --mode $Mode"

# 5. Execute Build
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = $nodeExe
$procInfo.Arguments = "`"$viteBin`" build --mode $Mode"
$procInfo.RedirectStandardOutput = $true
$procInfo.RedirectStandardError  = $true
$procInfo.UseShellExecute        = $false
$procInfo.WorkingDirectory       = $projectRoot

$process = [System.Diagnostics.Process]::Start($procInfo)
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()
$stopwatch.Stop()

$buildExitCode = $process.ExitCode
Write-Host "`n--- Vite Build Output ---"
if ($stdout) { Write-Host $stdout.TrimEnd() }
if ($stderr) { Write-Host $stderr.TrimEnd() -ForegroundColor Yellow }
Write-Host "-------------------------"

if ($buildExitCode -ne 0) {
    Write-Host "`n[BUILD FAILED] Vite process exited with code $buildExitCode in $($stopwatch.Elapsed.TotalSeconds)s." -ForegroundColor Red
    exit $buildExitCode
}

Write-Host "`n--> [SUCCESS] Vite build completed in $([math]::Round($stopwatch.Elapsed.TotalSeconds, 2))s." -ForegroundColor Green

# 6. Verify Artifacts
$distDir = Join-Path $projectRoot "dist"
$indexHtml = Join-Path $distDir "index.html"
$assetsDir = Join-Path $distDir "assets"

if (!(Test-Path $indexHtml)) {
    Write-Host "[ERROR] dist/index.html is missing after build!" -ForegroundColor Red
    exit 5
}

$jsFiles = Get-ChildItem -Path $assetsDir -Filter "index-*.js"
if ($jsFiles.Count -eq 0) {
    Write-Host "[ERROR] Compiled JavaScript bundle (dist/assets/index-*.js) is missing!" -ForegroundColor Red
    exit 6
}

$bundlePath = $jsFiles[0].FullName
$bundleSizeKB = [math]::Round($jsFiles[0].Length / 1KB, 2)
Write-Host "--> [Artifacts Verified] Generated bundle: $($jsFiles[0].Name) ($bundleSizeKB KB)" -ForegroundColor Green

# 7. Security & Configuration Guardrails for Staging
if ($Mode -eq "staging") {
    Write-Host "`n--> [Audit] Verifying Staging Bundle Configuration & Isolation..."
    $bundleContent = [System.IO.File]::ReadAllText($bundlePath)

    $hasStagingProject = $bundleContent.Contains("msiatguide-staging")
    $hasProdTarget     = $bundleContent.Contains('"projectId":"msiatguide"') -or $bundleContent.Contains('projectId:"msiatguide"')
    $hasAuthEmulator   = $bundleContent.Contains("connectAuthEmulator")
    $hasEmulatorHosts  = $bundleContent.Contains("127.0.0.1:9099") -or $bundleContent.Contains("127.0.0.1:8080") -or $bundleContent.Contains("localhost:8080")

    if (!$hasStagingProject) {
        Write-Host "  [FAIL] Bundle does not contain target staging project ID 'msiatguide-staging'!" -ForegroundColor Red
        exit 7
    } else {
        Write-Host "  ✓ Verified: Target project is 'msiatguide-staging'" -ForegroundColor Green
    }

    if ($hasProdTarget) {
        Write-Host "  [CRITICAL LEAK] Production project 'msiatguide' detected as active target in staging build!" -ForegroundColor Red
        exit 8
    } else {
        Write-Host "  ✓ Verified: No production project leak in active configuration" -ForegroundColor Green
    }

    if ($hasAuthEmulator -or $hasEmulatorHosts) {
        Write-Host "  [CRITICAL LEAK] Local emulator host or connection active in staging bundle!" -ForegroundColor Red
        exit 9
    } else {
        Write-Host "  ✓ Verified: Local emulator connections tree-shaken and excluded" -ForegroundColor Green
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  LOW-MEMORY BUILD PIPELINE: ALL CHECKS PASSED (EXIT 0)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
exit 0
