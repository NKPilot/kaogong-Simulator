---
phase: 03-question-by-question-interview
plan: 03
subsystem: ui
tags: [react, svg, ant-design, timer, recording, css-animations]

# Dependency graph
requires:
  - phase: 03-question-by-question-interview
    provides: Component directory structure, UI-SPEC design contract
provides:
  - SVG circular countdown timer with color transitions on time thresholds
  - Recording status indicator with blinking dot and CSS-only waveform bars
  - Re-read button with thinking-phase-only visibility and one-use-per-question disable
affects: 03-04 (orchestrator plan), 03-05 (store, timer logic, recording logic)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS `@keyframes` animation defined inline via `<style>` tag in component
    - SVG circle progress arc using strokeDasharray/strokeDashoffset for countdown
    - CSS-only waveform visualization with per-bar animation delays (no Canvas dependency)

key-files:
  created:
    - frontend/src/pages/QuestionInterview/components/TimerRing.tsx
    - frontend/src/pages/QuestionInterview/components/RecordingIndicator.tsx
    - frontend/src/pages/QuestionInterview/components/ReReadButton.tsx
  modified: []

key-decisions:
  - "CSS-only waveform bars (7 bars with staggered animation delays) preferred over Canvas for simplicity"
  - "Inline `<style>` tag used for `@keyframes` definitions to keep CSS co-located per component"
  - "ReReadButton returns null when not in thinking phase (not just disabled/hidden) to keep DOM clean"

patterns-established:
  - "CSS-in-JS with inline React.CSSProperties styles Record (same pattern as Phase 1/2 components)"
  - "Animation keyframes defined via injected `<style>` tag in component JSX"
  - "Edge case handling for total=0 (loading state) and remaining<=0 (critical state)"

requirements-completed:
  - TIMER-01
  - TIMER-02
  - TIMER-03
  - UI-03
  - VOICE-02
  - VOICE-03

# Metrics
duration: 8min
completed: 2026-05-23
---

# Phase 3 Plan 3: Timer, Recording, and Re-read Visual Components Summary

**Three standalone UI components for the Question Interview page: SVG circular countdown timer with three-tier color transitions, recording status indicator with blinking dot and CSS-only waveform bars, and re-read button with thinking-phase-only visibility**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-23
- **Completed:** 2026-05-23
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Custom SVG circular countdown timer (TimerRing) with progress arc calculated from remaining/total ratio, three-tier color transitions at >30s (red #BE1E2D), <=30s (orange #FA8C16 with slow pulse), and <=10s (red #FF4D4F with fast pulse)
- Recording status indicator (RecordingIndicator) with red blinking dot, "录音中 MM:SS" elapsed time display, and 7 CSS-only animated waveform bars with staggered animation delays
- Re-read button (ReReadButton) using Ant Design Button with ReloadOutlined icon, visible only during thinking phase, disabled after one use per question

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SVG TimerRing component** - `58c5ccb` (feat)
2. **Task 2: Create RecordingIndicator component** - `ce4506f` (feat)
3. **Task 3: Create ReReadButton component** - `c8c0faf` (feat)

## Files Created

- `frontend/src/pages/QuestionInterview/components/TimerRing.tsx` - SVG circular countdown timer (120px) with progress arc, MM:SS center text, phase label, three-tier color transitions, and CSS pulse animations
- `frontend/src/pages/QuestionInterview/components/RecordingIndicator.tsx` - Recording status indicator with red blinking dot, elapsed time display, and 7 CSS-only animated waveform bars
- `frontend/src/pages/QuestionInterview/components/ReReadButton.tsx` - Re-read button with thinking-phase visibility control, available/used states, and Ant Design ReloadOutlined icon

## Decisions Made

- CSS-only waveform bars (7 bars with staggered animation delays) preferred over Canvas for simplicity in v1
- Inline `<style>` tag used for `@keyframes` definitions to keep animation CSS co-located per component
- ReReadButton returns null when `visible=false` (outside thinking phase) rather than hiding via CSS, keeping the DOM clean
- TimerRing `strokeLinecap="round"` on the progress arc for a polished visual finish

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all three components compiled successfully on first TypeScript check.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three visual components ready for integration by Plan 04 orchestrator and Plan 05 store/timer/recording logic
- Component interfaces documented via TypeScript prop interfaces for type-safe consumption
- TimerRing handles all edge cases (total=0 loading state, remaining<=0 critical state, remaining>total clamp)
- RecordingIndicator gracefully returns null when inactive (no extraneous DOM)

---
*Phase: 03-question-by-question-interview*
*Completed: 2026-05-23*
