---
phase: 02-virtual-exam-room
plan: 03
subsystem: ui
tags: [react, ant-design, tts, audio, exam-room, orchestration]

# Dependency graph
requires:
  - phase: 02-01
    provides: guidance API (fetchGuidance), TTS API (synthesizeSpeech)
  - phase: 02-02
    provides: RedBanner, ExaminerRow, EntryAnimation CSS components
provides:
  - GuidanceToggle — expandable/collapsible guidance text panel with smooth max-height transition
  - TTSControls — audio playback controls with 5-state UI (loading/playing/paused/ended/error)
  - CTAButton — primary "开始答题" navigation button
  - ExamRoomPage — orchestrator composing all components with full state management
affects: [02-04, Phase 3 - Question flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - API waterfall: fetch guidance -> TTS with exact same text (Pitfall 4 prevention)
    - Browser autoplay policy: attempt auto-play, catch NotAllowedError, show manual play overlay
    - Hidden HTMLAudioElement via useRef for programmatic audio control
    - Silent degrade: TTS failure shows error text, guidance still accessible via toggle

key-files:
  created:
    - frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx
    - frontend/src/pages/ExamRoom/components/TTSControls.tsx
    - frontend/src/pages/ExamRoom/components/CTAButton.tsx
  modified:
    - frontend/src/pages/ExamRoom/index.tsx

key-decisions:
  - "RedBanner already applies negative margins for full-width — ExamRoom wrapper must not duplicate them (fix: remove wrapper negative margins)"
  - "TTS audio element created via useRef on mount, managed imperatively (no visible DOM element)"
  - "Guidance error and TTS error handled independently — page never fully blocks, banner/examiners always visible"

patterns-established:
  - "Autoplay guard: try play() on mount, catch NotAllowedError -> overlay with user-gesture-triggered play"
  - "Degrade silently: TTS failure shows fallback text, guidance text still fully accessible via toggle"
  - "Same-text guarantee: fetchGuidance response text joined and passed verbatim to synthesizeSpeech"

requirements-completed: [FLOW-02]

duration: 2min
completed: 2026-05-23
---

# Phase 2 Plan 3: Exam Room Interactive Components

**GuidanceToggle (collapsible text), TTSControls (play/pause/replay with 5 states), CTAButton (navigation), and ExamRoomPage orchestrator with full API integration and browser autoplay policy handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-23T07:16:30Z
- **Completed:** 2026-05-23T07:19:00Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 4

## Accomplishments

- GuidanceToggle: expandable/collapsible text panel with smooth 300ms max-height CSS transition, DownOutlined/UpOutlined icons
- TTSControls: audio playback controls handling all 5 states (loading via Spin, playing/paused/ended with status text, error with fallback text)
- CTAButton: Ant Design primary large "开始答题" button that stops audio and navigates to Phase 3 route
- ExamRoomPage orchestrator: loads guidance text from API on mount, sends exact same text to TTS API (Pitfall 4 prevention), auto-plays audio with browser autoplay policy fallback overlay
- Silently degrades: TTS failure shows error text while guidance still accessible via toggle; guidance API failure shows error message
- Entry animation via exam-room-entry CSS class on page wrapper
- TypeScript compilation passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GuidanceToggle, TTSControls, and CTAButton components** - `21d5621` (feat)
2. **Task 2: Create ExamRoomPage orchestrator with full API integration** - `1db25a8` (feat)
3. **Task 2 fix: Remove redundant wrapper negative margins** - `609046f` (fix)
4. **Task 3: Human verification** - User approved checkpoint

## Files Created/Modified

- `frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx` (NEW) - Expandable/collapsible guidance text panel with smooth CSS transition, UpOutlined/DownOutlined icons
- `frontend/src/pages/ExamRoom/components/TTSControls.tsx` (NEW) - Audio playback controls with 5-state display (loading/playing/paused/ended/error)
- `frontend/src/pages/ExamRoom/components/CTAButton.tsx` (NEW) - Primary "开始答题" button that navigates to Phase 3
- `frontend/src/pages/ExamRoom/index.tsx` (REPLACED) - Full orchestrator composing all components with guidance fetch, TTS synthesis, autoplay handling, and CTA navigation

## Decisions Made

- RedBanner already applies marginLeft: -32 / marginRight: -32 for full-width self-extension. The ExamRoom wrapper must NOT add the same negative margins to avoid double -64px offset. Fixed by removing redundant wrapper negative margins.
- Audio element managed via useRef<HTMLAudioElement> rather than visible DOM rendering. Event listeners (play/pause/ended) attached in mount effect with cleanup on unmount.
- Guidance and TTS errors handled as separate state variables — the page never fully blocks on API failure; banner and examiners always render immediately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate negative margins causing RedBanner double-offset**
- **Found during:** Task 2 (ExamRoomPage orchestrator)
- **Issue:** The ExamRoom wrapper applied marginLeft: -32 / marginRight: -32, which was already done internally by RedBanner. This caused a double -64px offset, pushing the banner off-screen on each side.
- **Fix:** Replaced the wrapper negative margins with a clean layout — RedBanner full-width, then content area with maxWidth: 960px and margin: 0 auto.
- **Files modified:** frontend/src/pages/ExamRoom/index.tsx
- **Verification:** Visual layout now correct — RedBanner spans full width without being pushed off-screen.
- **Committed in:** 609046f (Task 2 fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix was necessary for correct visual layout. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Exam room page fully wired: guidance fetch -> TTS synthesis -> autoplay -> user interaction -> CTA navigation
- Phase 3 (`/exam-room/question/1`) route not yet built — clicking "开始答题" will navigate to a placeholder route
- Vite + backend must be running for the page to load guidance text and TTS audio

## Self-Check: PASSED

- Files: GuidanceToggle.tsx, TTSControls.tsx, CTAButton.tsx, index.tsx, SUMMARY.md all present
- Commits: 21d5621 (Task 1), 1db25a8 (Task 2), 609046f (Fix) all verified
- TypeScript: `npx tsc --noEmit` passes cleanly

---
*Phase: 02-virtual-exam-room*
*Completed: 2026-05-23*
