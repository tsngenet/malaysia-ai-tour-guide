---
name: pwa-build-recovery
description: Diagnoses and recovers Windows development-environment failures affecting React, Vite, Node.js, npm, and Firebase workflows. Resolves Windows paging-file exhaustion (0x800705AF), Node.js NewSpace heap allocation crashes, npm directory resolution failures, and PATH toolchain conflicts. Provides low-memory Vite builds and staging preflight audits for Malaysia AI Tour Guide.
---

# PWA Build Recovery & Environment Reliability Skill

## Overview

The `pwa-build-recovery` skill provides an automated, low-overhead diagnosis, build, and deployment preflight pipeline specifically engineered for Windows development workstations encountering resource exhaustion, small paging files, or conflicting Node.js installations.

---

## When to Activate This Skill

Activate this skill whenever:
1. **Windows Paging File Failure:** PowerShell or child processes terminate with Win32 Error `0x800705AF` (`The paging file is too small for this operation to complete`).
2. **Node.js Heap Exhaustion:** Node.js / Vite aborts with `FATAL ERROR: NewSpace::EnsureCurrentCapacity Allocation failed - JavaScript heap out of memory`.
3. **Broken npm Wrapper:** Commands fail with `Could not determine Node.js install directory` or ambiguous Node/npm executable resolution across `%PATH%`.
4. **Low-Memory Vite Builds:** You need to build the production or staging React PWA without crashing on constrained memory systems.
5. **Staging Preflight Verification:** You need to verify that a staging build strictly targets `msiatguide-staging`, contains no emulator bindings, and preserves production project isolation.
6. **Machine Migration:** You are migrating or cloning this repository to a new computer and need to verify the environment.

---

## Confirmed Root Causes & Architecture

### 1. The Paging File Bottleneck (0x800705AF)
- **Symptom:** Windows reports `0x800705AF` when spawning child processes or allocating memory.
- **Root Cause:** In Windows Server / Desktop with 8 GB physical RAM, if `C:\pagefile.sys` is fixed or capped at 1,024 MB (1 GB), the total virtual memory commit limit is hard-capped at ~9.2 GB. When existing processes (Chrome, Edge, WebView2, Java, Node, Language Server) commit ~8.3 GB, only ~900 MB of virtual commit remains across the entire OS.
- **Remedy:** Do not allow Node.js to request default unconstrained 4+ GB heaps. Bound Node.js V8 old space to `1024 MB` (`--max-old-space-size=1024`) and bypass shell wrapper overhead.

### 2. The npm Wrapper Resolution Bug
- **Symptom:** `npm run build` fails with `Could not determine Node.js install directory`.
- **Root Cause:** Windows has multiple Node installations (e.g. `C:\Program Files\nodejs\node.exe` and `.gemini\antigravity\scratch\tools\node\node.exe`). When `npm.cmd` is called under constrained memory or ambiguous PATH resolution, the batch script cannot resolve its parent directory.
- **Remedy:** Directly invoke Vite via Node.js (`node.exe ./node_modules/vite/bin/vite.js build --mode staging`), bypassing `npm.cmd` entirely.

---

## Standard Runbook Procedures

### Procedure 1: Environment Health & Memory Diagnosis

Run the PowerShell diagnostic script to inspect physical RAM, commit limits, pagefile status, and conflicting Node.js executables:

```powershell
# From project root
& ".agents\skills\pwa-build-recovery\scripts\diagnose_windows_env.ps1"

# Or output raw JSON for programmatic tools:
& ".agents\skills\pwa-build-recovery\scripts\diagnose_windows_env.ps1" -AsJson
```

**What it inspects:**
- Total & Free Physical RAM.
- Virtual Memory Commit Limit, Committed Bytes, and Free Commit Margin.
- Paging file allocation and utilization percentage.
- All `node.exe`, `npm.cmd`, and `firebase.cmd` locations on `%PATH%`.
- Top 10 memory-consuming processes.

---

### Procedure 2: Low-Memory Vite Build

Execute a safe, bounded build that checks commit margin, enforces a 1024 MB heap cap, invokes Vite directly, and verifies the generated bundle:

```powershell
# Default staging build with 1024 MB heap cap:
& ".agents\skills\pwa-build-recovery\scripts\build_low_memory.ps1" -Mode staging -MaxHeapMB 1024

# Custom heap cap for severely constrained environments:
& ".agents\skills\pwa-build-recovery\scripts\build_low_memory.ps1" -Mode staging -MaxHeapMB 768
```

**Built-in Safety Checks:**
1. **Commit Margin Preflight:** Refuses to start if free system commit is below 600 MB (prevents OS freezing or hard crash).
2. **Toolchain Pinning:** Uses verified primary Node.js (`C:\Program Files\nodejs\node.exe`).
3. **Artifact Verification:** Confirms `dist/index.html` and `dist/assets/index-*.js` exist.
4. **Project Isolation Audit:** Confirms target is `msiatguide-staging` and asserts no local emulator host (`127.0.0.1:8080`, `127.0.0.1:9099`) or production project reference is active.

---

### Procedure 3: Staging Deployment Preflight

Run the preflight script prior to any preview channel or staging deployment:

```powershell
& ".agents\skills\pwa-build-recovery\scripts\verify_staging_preflight.ps1"
```

**Preflight Criteria (All Must Pass):**
- `.env.staging` has `VITE_FIREBASE_PROJECT_ID=msiatguide-staging` and `VITE_USE_FIREBASE_EMULATOR=false`.
- All 23 Route Builder unit tests pass (`test_route_builder.mjs`).
- Compiled bundle is clean of emulator bindings.
- Active branch is verified.

---

## Troubleshooting Playbook

### Issue: Build aborts with "Free Virtual Commit is below safe minimum"
1. Check the top processes reported by `diagnose_windows_env.ps1`.
2. Close unused Chrome / Edge browser tabs or background processes.
3. If Firebase emulators are running and not actively needed, terminate them before building.
4. Re-run `build_low_memory.ps1`.

### Issue: "Vite binary not found"
1. Verify you are running from the project repository.
2. Ensure dependencies are installed (`npm install`).

### Issue: Bundle Audit reports "Local emulator connection active"
1. Check `.env.staging` to ensure `VITE_USE_FIREBASE_EMULATOR=false`.
2. Do not set `VITE_USE_FIREBASE_EMULATOR=true` in staging or production builds.
3. Rebuild with `build_low_memory.ps1 -Mode staging`.

---

## Machine Migration Guide (New Computer)

When cloning or restoring this repository on a new computer:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tsngenet/malaysia-ai-tour-guide.git
   cd malaysia-ai-tour-guide
   git checkout feature/route-builder-phase1
   ```

2. **Restore `.env.staging`:**
   Copy your secure `.env.staging` configuration (or create from `.env.staging.example`).

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Diagnostics & Build via this Skill:**
   ```powershell
   & ".agents\skills\pwa-build-recovery\scripts\diagnose_windows_env.ps1"
   & ".agents\skills\pwa-build-recovery\scripts\build_low_memory.ps1" -Mode staging
   & ".agents\skills\pwa-build-recovery\scripts\verify_staging_preflight.ps1"
   ```

Because this skill lives inside `.agents/skills/pwa-build-recovery/`, Antigravity will automatically discover and load it as a project-scoped skill on your new machine!
