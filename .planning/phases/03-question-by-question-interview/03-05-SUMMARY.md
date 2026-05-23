---
phase: 03-question-by-question-interview
plan: 05
subsystem: ui
tags: [react, zustand, interview, orchestrator, state-machine, tts, mediarecorder, timer]
requires:
  - phase: 03-question-by-question-interview
    provides: leaf components (TimerRing, RecordingIndicator, QuestionDrawer, ReReadButton, ProgressIndicator, StatusTextBar, TransitionPage, MicPermissionError)
  - phase: 02-virtual-exam-room
    provides: Audio management pattern, EntryAnimation.css, RedBanner, ExaminerRow
  - phase: 01-foundation-question-bank
    provides: Zustand stores, API client pattern, TTS API, routing pattern
provides:
  - QuestionInterviewPage orchestrator with full state machine and all Phase 3 integrations
  - Interview route (/exam-room/question)
  - Fixed CTA navigation path
affects: Phase 4 scoring

tech-stack:
  added: []
  patterns:
    - "Orchestrator composes leaf components with props (no direct store access from leaf components)"
    - "Timer-zero useEffect detecting [timerRemaining, timerRunning, questionStatus] for phase transitions"
    - "Per-question drawerVisible state reset on transition (D-13)"
    - "TTS error degraded mode: auto-advance to thinking with fallback text"

key-files:
  created:
    - frontend/src/pages/QuestionInterview/index.tsx
  modified:
    - frontend/src/router.tsx
    - frontend/src/pages/ExamRoom/index.tsx

key-decisions:
  - "Single-page orchestrator with state machine, no route change per question (D-11)"
  - "ReadingProcessedRef guards against double TTS fetch in strict mode / re-renders"
  - "Recording onstop handler captures sessionId and currentIndex via closure before store advances"
  - "useInterviewStore.setState() for recordingBlob/recordingDuration (no dedicated setters in store)"

patterns-established:
  - "Orchestrator pattern: Page-level component composes leaf components, manages side effects, reads Zustand stores, passes data as props"
  - "Timer lifecycle: setInterval decrements timerRemaining, interval self-clears at 0, timer-zero useEffect detects and triggers transition"
  - "Audio lifecycle: Hidden Audio element created in mount effect, event listeners for ended, cleanup on unmount"

requirements-completed:
  - FLOW-03
  - FLOW-04
  - VOICE-01
  - VOICE-02
  - VOICE-03
  - TIMER-01
  - TIMER-02
  - TIMER-03
  - UI-02
  - UI-03
  - UI-04

duration: 12min
completed: 2026-05-23
---

# Phase 3 Plan 5: Interview Loop Orchestrator Summary

**QuestionInterviewPage orchestrator composing all Phase 3 leaf components with state machine, TTS audio, MediaRecorder, and timer integration for the complete question-by-question interview experience**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-23T09:46:25Z
- **Completed:** 2026-05-23T09:58:00Z (approx — checkpoint pending verification)
- **Tasks:** 2 of 3 complete (awaiting human verification of Task 3)
- **Files modified:** 3

## Accomplishments

- Created QuestionInterviewPage orchestrator (446 lines) wrapping all 8 Phase 3 leaf components plus RedBanner and ExaminerRow, with full state machine driving reading -> thinking (2min) -> answering (3min) -> transition -> next/last question flow
- Integrated TTS audio via hidden Audio element: auto-play on question start, ended handler triggers thinking phase, autoplay block overlay for browser policy, re-read stops and replays TTS
- Implemented MediaRecorder integration: mic permission request on answer phase start, recording duration tracking, WebM blob collection, background upload via fire-and-forget
- Timer management: setInterval countdown decrement, self-clearing at zero, timer-zero useEffect watching [timerRemaining, timerRunning, questionStatus] for automatic phase transitions
- TTS error degraded mode: synthesizeSpeech wrapped in try/catch, on failure shows "题目朗读失败，可查看下方题目文字" fallback and auto-advances to thinking timer so user is not stuck
- Re-read support: stops current TTS, re-fetches, replays, resets thinking timer to 120s, button disabled after use (1 per question per D-17)
- drawerVisible local state management: initialized false, toggled via handleToggleDrawer, reset to false on question transition (D-13 strict compliance)
- Route /exam-room/question added to router, CTA navigation in ExamRoomPage fixed from /exam-room/question/1 to /exam-room/question
- Scaled examiner row at 0.8x per UI-SPEC C-02

## Task Commits

Each task was committed atomically:

1. **Task 1: Create QuestionInterviewPage orchestrator** - `8470c7b` (feat)
2. **Task 2: Update router and CTA navigation** - `5db9954` (feat)
3. **Task 3: Human verification of interview loop** - PENDING (checkpoint)

## Files Created/Modified

- `frontend/src/pages/QuestionInterview/index.tsx` - Full orchestrator: 446 lines, state machine driving 8 leaf components, TTS/MediaRecorder/timer integration, TTS error degraded mode
- `frontend/src/router.tsx` - Added QuestionInterviewPage import and /exam-room/question route
- `frontend/src/pages/ExamRoom/index.tsx` - Changed CTA navigate path from '/exam-room/question/1' to '/exam-room/question'

## Decisions Made

- **ReadingProcessedRef guard**: A useRef<number> tracks which question index has been processed for TTS, preventing double-fetch in React strict mode or on re-renders. Re-read bypasses this guard via direct handler call.
- **Closure capture for recording upload**: onstop handler captures sessionId and currentIndex at MediaRecorder creation time, preventing stale state reads after the store advances to the next question.
- **Direct setState for recording fields**: Uses `useInterviewStore.setState({ recordingBlob, recordingDuration })` since the InterviewStore has no dedicated setters for these fields (per Zustand convention documented in Plan 02).
- **Timer-zero effect pattern**: Dedicated useEffect watches [timerRemaining, timerRunning, questionStatus] to detect when the countdown naturally reaches 0 (interval self-clears, sets timerRunning=false, effect triggers transition handler). This avoids race conditions and double-firing.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All components are wired to real stores and APIs. TTS calls use the real synthesizeSpeech() API. Recording uploads use the real uploadRecording() API.

## Threat Flags

None. No new security-relevant surface outside the plan's threat model.

## Checkpoint Status

**Task 3 is a `checkpoint:human-verify` gate.** The implementation is complete but requires manual verification of the full interview loop in a browser. See checkpoint message for detailed verification steps.

## Next Phase Readiness

- Complete interview loop ready for Phase 4 scoring integration
- After verification, the /results route will need a Phase 4 page
- TTS error degraded mode and mic permission retry paths are implemented for edge case coverage

---
*Phase: 03-question-by-question-interview*
*Completed: 2026-05-23 (checkpoint pending verification)*
