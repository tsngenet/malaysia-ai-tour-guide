# Malaysia AI Tour Guide — Phase 1 Route Builder Test Report

**Date:** 2026-11-07  
**Branch:** `feature/route-builder-phase1`  
**Test Suite:** `test_route_builder.mjs`  
**Total Tests:** 18  
**Passed:** 18 (100%)  
**Failed:** 0  

---

## 1. Test Execution Summary

| Req # | Test Case Description | Result | Details |
|---|---|---|---|
| **Req 1** | Schema validator rejects missing required fields | **PASS** | Validates `validateAttraction()` throws errors when required keys (`name.en`, `destination`, `category`, etc.) are omitted. |
| **Req 2** | Schema validator accepts valid complete attraction | **PASS** | Confirms valid object passes with zero errors. |
| **Req 3** | Destination coverage (min 6 approved attractions per destination) | **PASS** | Verifies all 8 target regions (KL/Putrajaya, Melaka, Ipoh, Penang, Kuala Selangor, Genting, Cameron, Kampar) have at least 6 approved attractions. |
| **Req 4** | Schedule engine single-day arrival/departure timeline calculation | **PASS** | Verified departure = arrival + visit duration + travel time buffer. |
| **Req 5** | Multi-day tours with day boundaries and day restart times | **PASS** | Verifies Day 2 starts at configured restart time (e.g. 09:30). |
| **Req 6** | Graceful handling of missing or null coordinates | **PASS** | Zero travel time / manual duration used without NaN or crashing. |
| **Req 7** | Collision-resistant tour code format (`MYTG-YYYYMMDD-XXXX`) | **PASS** | Regex matched; 100 consecutive generations confirmed 100% collision-free. |
| **Req 8** | Published snapshot isolates changes from subsequent draft edits | **PASS** | Deep-cloning prevents in-place mutation of live passenger snapshots. |
| **Req 9** | Route templates coverage across all 8 regions | **PASS** | Confirms presence of templates for KL, Melaka, Ipoh, Kuala Selangor, Genting, Cameron (1 & 2 day), Penang, and Kampar. |
| **Req 10** | Reordering stops updates arrival and departure timestamps | **PASS** | Changing stop sequence correctly recalibrates the down-line schedule. |
| **Req 11** | Meal break insertion adds 60m duration | **PASS** | Meal stops default to 60-minute duration on the timeline. |
| **Req 12** | Custom stop with valid coordinates preserved | **PASS** | Custom ad-hoc stops with coordinates retain spatial data without loss. |
| **Req 13** | Proximity trigger engine skips null coordinates | **PASS** | Journey engine sets distance to `null` and remains in UPCOMING status. |
| **Req 14** | Duration range validation rejects `minMinutes > maxMinutes` | **PASS** | Flags duration inversion errors. |
| **Req 15** | Validator explicitly prohibits fake `(0, 0)` coordinates | **PASS** | Enforces anti-hallucination GPS rule. |
| **Req 16** | 100% validation pass rate on all 48 catalog attractions | **PASS** | All 48 attractions pass with zero errors and valid schemas. |
| **Req 17** | Stop visit duration override updates schedule | **PASS** | Manual duration adjustments immediately shift subsequent stop arrival times. |
| **Req 18** | Published snapshot passenger link conforms to domain standard | **PASS** | Formatted as `https://msiatguide.web.app/?tour=<id/code>`. |

---

## 2. Integration & Baseline Tests

- `test_integration.mjs` (5/5 PASS):
  - `GET /health` -> 200 OK
  - `GET /` -> 200 OK static index.html
  - `POST /api/ask` (English) -> 200 OK
  - `POST /api/ask` (Chinese) -> 200 OK
  - Empty query validation -> 400 Bad Request
- Production Build (`npm run build`):
  - 64 modules transformed
  - Built successfully in 1.42s
  - Gzip bundle size: 161.18 kB JS, 7.62 kB CSS
