# Malaysia AI Tour Guide — Build Recovery & Environment Reliability Report

**Date:** 2026-11-08  
**Project:** Malaysia AI Tour Guide PWA  
**Local Path:** `C:\Users\tsngenet\MyOnlineProject\malaysia-ai-tour-guide-main`  
**Working Branch:** `feature/route-builder-phase1`  
**Primary Target Project (Staging):** `msiatguide-staging`  
**Production Project (Isolated & Untouched):** `msiatguide`  
**Installed Skill:** `.agents/skills/pwa-build-recovery/`  

---

## 1. Executive Summary & Root Cause Diagnosis

During Phase 1 development, the Windows development environment encountered severe build instability:
1. `Could not determine Node.js install directory`
2. `FATAL ERROR: NewSpace::EnsureCurrentCapacity Allocation failed - JavaScript heap out of memory`
3. Windows PowerShell Win32 Error `0x800705AF: The paging file is too small for this operation to complete`
4. PATH collisions between multiple Node.js installations

### Actual Measured Root Causes

| Factor | Measured Reality | Technical Root Cause |
| :--- | :--- | :--- |
| **Physical RAM** | **8,188 MB (8 GB)** | 6,762 MB in use (82.6%), ~1,425 MB free. Constrained for modern heavy developer stacks (Chrome + Edge + Node + Java + IDE). |
| **Virtual Commit Limit** | **9,212 MB (~9.2 GB)** | Only 1 GB above physical RAM because `C:\pagefile.sys` was manually capped at 1,024 MB. |
| **Pagefile Status** | **1,023 MB / 1,024 MB (100% EXHAUSTED)** | At 100% saturation, Windows Kernel refuses any additional memory allocation via `VirtualAlloc`, failing with `0x800705AF`. |
| **Free Commit Margin** | **927 MB Free OS-wide** | Less than 1 GB of virtual memory remained for the entire operating system. |
| **Node.js Heap Allocation** | **Default Heap: 2,240 MB** | When Node v24 attempted to allocate memory for Vite/Rollup chunks, V8 requested memory that the OS could not commit, causing `NewSpace::EnsureCurrentCapacity Allocation failed`. |
| **Toolchain Conflicts** | **2 Node.js / npm engines** | `C:\Program Files\nodejs` (Node v24.22.1 x64) vs `.gemini\antigravity\scratch\tools\node` (Node v22.11.0 x64). When `npm.cmd` was invoked under high commit load, Windows failed to resolve paths, yielding `Could not determine Node.js install directory`. |

---

## 2. Changes Made & Engineering Remedies

### A. Pre-Repair Protection (Step 1 Complete)
- Complete source backup created at `C:\Users\tsngenet\MyOnlineProject\backups\pre-recovery-backup-20261108` (239 files verified, git diff and uncommitted changes preserved).
- Zero files deleted, zero git resets performed, and zero production configurations modified.

### B. Toolchain Pinning & npm Bypass
- Pinned build execution to verified primary engine `C:\Program Files\nodejs\node.exe`.
- Bypassed fragile Windows `npm.cmd` batch wrappers by invoking Vite's JavaScript entrypoint directly (`node_modules/vite/bin/vite.js`).

### C. Bounded Heap Allocation (`--max-old-space-size=1024`)
- Capped Node.js V8 old space to `1024 MB`, ensuring Vite builds within available free physical RAM and within the narrow commit margin.

### D. Reusable Antigravity Skill Created (`pwa-build-recovery`)
Installed in project directory: `.agents/skills/pwa-build-recovery/`
- `SKILL.md`: Triggers, root causes, and runbook.
- `scripts/diagnose_windows_env.ps1`: Automated memory, pagefile, toolchain, and process diagnostic script.
- `scripts/build_low_memory.ps1`: Safe low-memory build pipeline with preflight commit checks and bundle leak audit.
- `scripts/verify_staging_preflight.ps1`: Pre-deployment automated test and isolation verification.

---

## 3. Before-and-After Build Results

| Metric | Before Recovery | After Recovery (`build_low_memory.ps1`) |
| :--- | :--- | :--- |
| **Build Invocation** | `npm run build -- --mode staging` | `& build_low_memory.ps1 -Mode staging -MaxHeapMB 1024` |
| **Build Status** | ❌ **FAIL** (`0x800705AF` / OOM / install dir error) |  **PASS (Exit Code: 0)** |
| **Build Time** | Indefinite / Aborted | **4.71 seconds** |
| **Bundle Produced** | Incomplete / Corrupted | `dist/assets/index-DQmGQIAD.js` (1,157.96 kB gzip: 362 kB) |
| **Target Project** | Uncertain |  `msiatguide-staging` strictly verified |
| **Localhost Emulator Leaks** | Unchecked |  0 emulator hosts or connections in bundle |
| **Production Project Isolation** | Unchecked |  `msiatguide` completely isolated |

---

## 4. Test Suite Execution & Verification Matrix

| Test Suite | Execution Command | Result | Exit Code |
| :--- | :--- | :---: | :---: |
| **Route Builder Unit Tests** | `node test_route_builder.mjs` | **23/23 PASSED** | `0` |
| **Static & Integration Tests** | `node test_integration.mjs` | **5/5 PASSED** | `0` |
| **Firestore Security Rules Emulator** | `node scripts/test_firestore_rules_emulator.mjs` | **25/25 PASSED** | `0` |
| **Cloud Storage Security Rules Emulator** | `node scripts/test_storage_rules_emulator.mjs` | **14/14 PASSED** | `0` |
| **Real Firebase Integration (Phase 1C)** | `node scripts/test_phase1c_real_firebase.mjs` | **ALL PASSED** | `0` |
| **Staging Preflight Verification** | `& verify_staging_preflight.ps1` | **ALL CHECKS PASSED** | `0` |

---

## 5. Remaining Windows Resource Limitations

1. **Physical RAM:** 8 GB is limited for concurrent development (Chrome + Edge + Java Emulator + Antigravity + Node).
2. **Pagefile Configuration:** `C:\pagefile.sys` is currently fixed at 1,024 MB.
   > **Recommended Windows Action (Requires User Approval):**  
   > Change Windows Paging File setting from custom 1024 MB to **System Managed** (or set Initial: 4096 MB, Max: 8192 MB). C: drive has 55+ GB of free space, which easily accommodates a larger pagefile and eliminates `0x800705AF` system-wide.

---

## 6. Migration Guide for the New Computer

When migrating to your new computer:

1. **Clone repository:**
   ```bash
   git clone https://github.com/tsngenet/malaysia-ai-tour-guide.git
   cd malaysia-ai-tour-guide
   git checkout feature/route-builder-phase1
   ```
2. **Restore staging environment configuration:**
   Copy `.env.staging` (kept private and gitignored) into project root.
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Invoke the Skill:**
   Antigravity will automatically load `pwa-build-recovery` from `.agents/skills/pwa-build-recovery/`.
   Run:
   ```powershell
   & ".agents\skills\pwa-build-recovery\scripts\diagnose_windows_env.ps1"
   & ".agents\skills\pwa-build-recovery\scripts\build_low_memory.ps1" -Mode staging
   & ".agents\skills\pwa-build-recovery\scripts\verify_staging_preflight.ps1"
   ```
