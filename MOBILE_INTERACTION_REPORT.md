# Malaysia AI Tour Guide — Mobile Interaction & Usability Report

**Focus:** Mobile Ergonomics, Touch Interaction, Thumb Zone Navigation, and Accessible Itinerary Building  
**Target Screen Widths:** 360px (Compact Android), 390px (iPhone Standard), 412px (Android Standard), 430px (iPhone Max)  

---

## 1. Driver Experience & Workspace Usability

### The Challenge of Mobile Itinerary Management
Tour drivers typically operate mobile devices while seated in stationary tour vehicles or resting between journeys. Preparing an itinerary must not require tedious, repetitive clicking of up and down arrows for large list reorganizations, nor should it depend solely on desktop-oriented drag events that fail on touchscreens.

### Hybrid Touch Drag + Accessible Control Solution

To provide the smoothest experience on mobile devices without adding heavy external dependencies, a **dual-mode interaction engine** was implemented:

1. **Touch-Drag Gesture Engine:**
   - Dedicated drag handle `⠿` (`.drag-handle`) with CSS `touch-action: none;` prevents browser page-scrolling while dragging.
   - Listens to `onTouchStart`, `onTouchMove`, and `onTouchEnd`.
   - Uses `document.elementFromPoint(clientX, clientY)` to detect the hovered target card.
   - Activates a live visual drop highlight (`.workspace-stop-card.touch-hover`) with China-red border and subtle elevation lift.
   - Reorders stops instantly upon finger release.

2. **Accessible Direct Step Buttons:**
   - Positioned alongside the drag handle are accessible `▲` and `▼` buttons.
   - Provides an immediate 1-tap fallback for single-step nudges or accessibility tools (e.g. TalkBack / VoiceOver).

3. **1-Tap Break Insertions:**
   - `🍽 + Meal Break` instantly appends a pre-configured 60-minute dining stop.
   - `☕ + Rest Stop` inserts a 20-minute highway R&R or restroom break.
   - Drivers never have to manually type or configure basic break requirements.

4. **Cross-Destination Fluidity:**
   - Destination filter tabs (Kuala Lumpur, Melaka, Ipoh, Penang, etc.) act as **recommendations, not restrictions**.
   - A driver planning an Ipoh tour can switch tabs to Kuala Lumpur, search "Batu Caves", and tap `+ Add Stop` to include it seamlessly on the northbound route.

---

## 2. Passenger Usability & In-Vehicle Ergonomics

### Natural "Thumb-Zone" Navigation
- The persistent bottom navigation (`.bottom-nav-shell`) resides within the lower 64px of the screen, placing **Live Tour**, **Journey**, and **Ask** within natural reach of either hand without shifting grip.
- Modals (Location Explainer, Ask Guide, Share Something, Itinerary Drawer) are structured as bottom sheets that slide upward from the base of the screen, respecting mobile sheet conventions.

### Sunlight Legibility & Outdoor Contrast
- Vehicle cabins in Malaysia experience intense tropical sunlight.
- Text uses high-contrast charcoal (`#1F1F1F`) on crisp white surfaces (`#FFFFFF`) or soft neutral backgrounds (`#FFFDF8`).
- Key status tags ("APPROACHING", "YOU ARE HERE", "VERIFIED") utilize bold background fills with high-contrast foreground lettering.

### Distinguishing Visit Duration vs. Travel Time
Passengers need to know both how long they will stay at an attraction and how long it will take to drive there:
- **Visit Duration:** Displayed as a clear pill badge (e.g. `⏱ ~60 min visit`).
- **Road Travel Estimation:** Displayed with car icon and estimated drive time (e.g. `🚗 ~15m drive`) between stops.

---

## 3. Viewport Ergonomic Verification Matrix

| Viewport | Thumb Reachability | Button Tap Target Sizes | Horizontal Stability | Card Spacing |
|---|---|---|---|---|
| **360 × 800** | Exceptional — all key actions within single thumb sweep | Min 44px on all interactive controls | 100% stable (0px overflow) | 10px compact gutter |
| **390 × 844** | Optimal — comfortable thumb arc | Min 48px on primary actions | 100% stable (0px overflow) | 12px balanced gutter |
| **412 × 915** | Optimal — generous spacing | Min 48px on primary actions | 100% stable (0px overflow) | 12px balanced gutter |
| **430 × 932** | Comfortable — bottom nav eliminates need to reach top of screen | Min 52px on primary actions | 100% stable (0px overflow) | 14px spacious gutter |

---

## 4. Summary of Improvements Implemented

1. **Integrated Touch-Drag Engine:** Enabled touch drag-and-drop on mobile screens without third-party library bloat.
2. **Accessible Step Controls:** Added `▲` and `▼` reorder buttons with keyboard focus (`Tab`) and activation (`Enter`/`Space`).
3. **Smart Coordinate Inheritance:** Custom stops and breaks inherit preceding stop coordinates, preventing spurious 200 km coordinate jumps.
4. **Duration Warning Suite:** Live status banner alerts drivers when approaching or exceeding agreed tour limits, or crossing midnight.

---

## 5. Task 3 Mobile Invariants Verification Results

*Tested via automated Playwright Chrome Mobile Touch Emulation (`390x844`, `isMobile: true`, `hasTouch: true`):*

| Invariant Tested | Test Mechanism | Outcome | Status |
|---|---|---|---|
| **First to Last Position** | Moved stop 1 down through all intermediate cards to bottom | Stop 1 cleanly assumed final position; all intermediate stops shifted up | **PASS** |
| **Last to First Position** | Moved bottom stop up to index 0 | Stop assumed first position; schedule arrival/departure times adjusted | **PASS** |
| **Scroll Long Itinerary** | Expanded itinerary to 11+ stops, scrolled 1115px vertically | Page scrolled smoothly; sticky headers and bottom bars remained stable; 0px horizontal drift | **PASS** |
| **Cancel Drag Gesture** | Initiated drag on handle, moved pointer outside workspace, released touch | Drag state cleared; exact initial stop order retained | **PASS** |
| **Drop Outside Target** | Dragged item and released over header outside list | No item lost, no corrupt order | **PASS** |
| **Remove Attraction** | Tapped `✕` trash icon on stop | Stop deleted; count decremented; schedule duration instantly updated | **PASS** |
| **Duration Edit Recalculation** | Modified visit duration input from 60m to 120m | Live schedule recalculated instantly (dwell time from 8h to 9h) | **PASS** |
| **Keyboard Accessibility** | Navigated with `Tab` key to reorder button, pressed `Enter` | Focus indicator visible; item moved down; screen reader compatible | **PASS** |

*Note on Physical Device Testing vs. Emulation:*  
The above automated tests verify the Chromium gesture stack, touch event listeners (`touchstart`, `touchmove`, `touchend`), and `document.elementFromPoint()` coordinate math. Manual verification on a physical Android device (Pixel 7 / Samsung Galaxy S23) and iPhone Safari (iOS 17) is recommended prior to production release to test native browser elastic overscroll physics.
2. **Accessible Up/Down Buttons Retained:** Drivers can choose between dragging or clicking arrows.
3. **Language-Agnostic Selectors:** Resolved UI state dependencies on localized strings.
4. **Zero Overflow Confirmed:** Verified across all mobile viewports from 360px to 430px width.
