#Requires -Version 5.1
<#
.SYNOPSIS
    Diagnoses Windows memory, paging file, process footprint, and Node.js toolchain health.
.DESCRIPTION
    Part of the pwa-build-recovery Antigravity skill for Malaysia AI Tour Guide.
    Inspects physical RAM, commit charge limit, pagefile configuration, disk space,
    Node.js executable conflicts, and top memory-consuming processes.
.EXAMPLE
    .\diagnose_windows_env.ps1
#>

[CmdletBinding()]
param(
    [switch]$AsJson
)

$ErrorActionPreference = 'Continue'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PWA BUILD RECOVERY: WINDOWS ENVIRONMENT DIAGNOSTIC TOOL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Physical RAM & Commit Metrics
$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem

$totalRamMB   = [math]::Round($cs.TotalPhysicalMemory / 1MB, 2)
$freeRamMB    = [math]::Round($os.FreePhysicalMemory / 1024, 2)
$usedRamMB    = [math]::Round($totalRamMB - $freeRamMB, 2)
$ramPercent   = [math]::Round(($usedRamMB / $totalRamMB) * 100, 1)

$totalCommitMB  = [math]::Round($os.TotalVirtualMemorySize / 1024, 2)
$freeCommitMB   = [math]::Round($os.FreeVirtualMemory / 1024, 2)
$usedCommitMB   = [math]::Round($totalCommitMB - $freeCommitMB, 2)
$commitPercent  = [math]::Round(($usedCommitMB / $totalCommitMB) * 100, 1)

# 2. Paging File Analysis
$pagefiles = Get-CimInstance Win32_PageFileUsage
$pagefileDetails = @()
foreach ($pf in $pagefiles) {
    $pfAlloc = $pf.AllocatedBaseSize
    $pfUsed  = $pf.CurrentUsage
    $pfPeak  = $pf.PeakUsage
    $pfPct   = if ($pfAlloc -gt 0) { [math]::Round(($pfUsed / $pfAlloc) * 100, 1) } else { 0 }
    $pagefileDetails += [PSCustomObject]@{
        Name       = $pf.Name
        AllocMB    = $pfAlloc
        UsedMB     = $pfUsed
        PeakMB     = $pfPeak
        UsedPct    = $pfPct
    }
}

# 3. Disk Free Capacity
$disks = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
$diskDetails = @()
foreach ($d in $disks) {
    $diskDetails += [PSCustomObject]@{
        Drive    = $d.DeviceID
        Label    = $d.VolumeName
        TotalGB  = [math]::Round($d.Size / 1GB, 2)
        FreeGB   = [math]::Round($d.FreeSpace / 1GB, 2)
        FreePct  = [math]::Round(($d.FreeSpace / $d.Size) * 100, 1)
    }
}

# 4. Node.js & Toolchain Discovery
$nodePaths = @(where.exe node 2>$null)
$npmPaths  = @(where.exe npm 2>$null)
$fbPaths   = @(where.exe firebase 2>$null)

$activeNodeVersion = $null
$activeNodeArch    = $null
$activeNodeHeapMB  = $null

try {
    $nodeInfoJson = node -e "console.log(JSON.stringify({ v: process.version, arch: process.arch, heap: Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024) }))" 2>$null
    if ($nodeInfoJson) {
        $nodeInfo = ConvertFrom-Json $nodeInfoJson
        $activeNodeVersion = $nodeInfo.v
        $activeNodeArch    = $nodeInfo.arch
        $activeNodeHeapMB  = $nodeInfo.heap
    }
} catch {
    $activeNodeVersion = "Unknown / Failed"
}

# 5. Top Memory Processes
$topProcesses = Get-Process | Group-Object ProcessName | ForEach-Object {
    $wsMB = [math]::Round(($_.Group | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
    $pmMB = [math]::Round(($_.Group | Measure-Object -Property PrivateMemorySize64 -Sum).Sum / 1MB, 2)
    [PSCustomObject]@{
        ProcessName = $_.Name
        Instances   = $_.Count
        WorkingSetMB = $wsMB
        CommitMB    = $pmMB
    }
} | Sort-Object CommitMB -Descending | Select-Object -First 10

# 6. Evaluation & Status
$status = "PASS"
$reasons = @()

if ($freeCommitMB -lt 1200) {
    $status = "CRITICAL_WARN"
    $reasons += "Free Virtual Commit ($freeCommitMB MB) is below safe threshold (<1200 MB). Risk of 0x800705AF / NewSpace OOM."
}

foreach ($pf in $pagefileDetails) {
    if ($pf.UsedPct -ge 90) {
        $status = "CRITICAL_WARN"
        $reasons += "Paging file $($pf.Name) is $($pf.UsedPct)% exhausted ($($pf.UsedMB)MB / $($pf.AllocMB)MB)."
    }
}

if ($nodePaths.Count -gt 1) {
    $reasons += "Multiple Node.js executables detected in PATH ($($nodePaths.Count) found). Potential wrapper ambiguity."
}

$diagnosticResult = [PSCustomObject]@{
    Timestamp          = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
    Status             = $status
    Alerts             = $reasons
    PhysicalRamMB      = $totalRamMB
    FreeRamMB          = $freeRamMB
    UsedRamMB          = $usedRamMB
    RamUsedPct         = $ramPercent
    TotalCommitMB      = $totalCommitMB
    FreeCommitMB       = $freeCommitMB
    UsedCommitMB       = $usedCommitMB
    CommitUsedPct      = $commitPercent
    PagingFiles        = $pagefileDetails
    Disks              = $diskDetails
    NodeExecutables    = $nodePaths
    NpmExecutables     = $npmPaths
    FirebaseExecutables= $fbPaths
    ActiveNodeVersion  = $activeNodeVersion
    ActiveNodeArch     = $activeNodeArch
    DefaultHeapLimitMB = $activeNodeHeapMB
    TopMemoryProcesses = $topProcesses
}

if ($AsJson) {
    $diagnosticResult | ConvertTo-Json -Depth 4
    return
}

# Pretty Console Output
Write-Host "`n[1] MEMORY & COMMIT CAPACITY" -ForegroundColor Yellow
Write-Host ("  Physical RAM  : {0:N0} MB Total | {1:N0} MB Free ({2}% used)" -f $totalRamMB, $freeRamMB, $ramPercent)
Write-Host ("  Virtual Commit: {0:N0} MB Limit | {1:N0} MB Free ({2}% committed)" -f $totalCommitMB, $freeCommitMB, $commitPercent)

Write-Host "`n[2] PAGING FILE CONFIGURATION" -ForegroundColor Yellow
foreach ($pf in $pagefileDetails) {
    $color = if ($pf.UsedPct -ge 90) { "Red" } else { "Green" }
    Write-Host ("  {0} : {1:N0} MB allocated | {2:N0} MB used ({3}%) | Peak: {4:N0} MB" -f $pf.Name, $pf.AllocMB, $pf.UsedMB, $pf.UsedPct, $pf.PeakMB) -ForegroundColor $color
}

Write-Host "`n[3] DISK CAPACITY" -ForegroundColor Yellow
foreach ($d in $diskDetails) {
    Write-Host ("  Drive {0} ({1}): {2:N1} GB Free of {3:N1} GB ({4}% free)" -f $d.Drive, $d.Label, $d.FreeGB, $d.TotalGB, $d.FreePct)
}

Write-Host "`n[4] NODE.JS TOOLCHAIN LOCATIONS" -ForegroundColor Yellow
Write-Host "  Active Version  : $activeNodeVersion ($activeNodeArch) - Default Heap Limit: $activeNodeHeapMB MB"
Write-Host "  Node.exe Paths  :"
foreach ($np in $nodePaths) { Write-Host "    - $np" }
Write-Host "  Npm Paths       :"
foreach ($np in $npmPaths) { Write-Host "    - $np" }

Write-Host "`n[5] TOP COMMIT CONSUMING PROCESSES" -ForegroundColor Yellow
$topProcesses | Format-Table ProcessName, Instances, WorkingSetMB, CommitMB -AutoSize | Out-String | ForEach-Object { Write-Host $_.TrimEnd() }

Write-Host "`n[6] DIAGNOSTIC ASSESSMENT: $status" -ForegroundColor $(if ($status -eq "PASS") { "Green" } else { "Red" })
if ($reasons.Count -gt 0) {
    foreach ($r in $reasons) {
        Write-Host "  [!] $r" -ForegroundColor Yellow
    }
} else {
    Write-Host "  System memory and toolchain are within normal operating parameters." -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Cyan
