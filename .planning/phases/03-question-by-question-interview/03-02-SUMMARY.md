---
phase: 03-question-by-question-interview
plan: 02
subsystem: state-management
tags: [typescript, zustand, state-machine, interview-flow]

# Dependency graph
requires:
  - phase: 01-foundation-question-bank
    provides: Zustand store pattern with create + get(), API client pattern, TypeScript types convention
provides:
  - InterviewStore interface with full state machine (idle/reading/thinking/answering/transition/complete)
  - useInterviewStore Zustand implementation with timer, recording, and mic permission state
  - uploadRecording API module for silent background audio upload
affects:
  - 03-03 QuestionInterviewPage orchestrator
  - 03-04 Timer and recording UI components
  - 03-05 Transition and complete page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand store with get() pattern for computed access and cross-action state reads"
    - "Separate type file for store interface, separate implementation file for create()"
    - "Fire-and-forget background upload with console-only error handling"
    - "Orchestrator manages setInterval/timer tick and MediaRecorder; store holds state only"

key-files:
  created:
    - frontend/src/types/interview.ts
    - frontend/src/store/interviewStore.ts
    - frontend/src/api/recordingApi.ts
  modified: []

key-decisions:
  - "RecordingBlob and recordingDuration excluded from interface setters — orchestrator uses useInterviewStore.setState() directly per established Zustand pattern"
  - "stopRecording() is a no-op — orchestrator sets blob/duration via setState after MediaRecorder stops"
  - "uploadRecording returns void (fire-and-forget) per D-10 silent upload contract"

patterns-established:
  - "Timer state (total/remaining/running) managed in store; tick interval owned by orchestrator"
  - "Mic permission tracked as 'prompt' | 'granted' | 'denied' union in store"

requirements-completed:
  - FLOW-03
  - FLOW-04
  - VOICE-01
  - VOICE-02
  - VOICE-03
  - TIMER-01
  - TIMER-02
  - TIMER-03

# Metrics
duration: 2min
completed: 2026-05-23
---

# Phase 3 Plan 02: Interview Store, Types, and Recording API Summary

**Zustand interview state machine with 6-phase flow, recording upload module, and shared InterviewStore interface for Phase 3 components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-23T09:34:00Z
- **Completed:** 2026-05-23T09:35:44Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Defined `QuestionStatus` (6-state union), `MicPermission` (3-state union), and full `InterviewStore` interface with 18+ members in a dedicated types file
- Implemented `useInterviewStore` via Zustand with `get()` pattern, managing session, timer, recording, mic permission, and re-read state with proper action boundaries
- Created `uploadRecording()` API module for silent background FormData upload to `/api/recording/upload`, matching the fire-and-forget D-10 contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Create interview types** - `6e2f0e3` (feat)
2. **Task 2: Create recording API module** - `f90c809` (feat)
3. **Task 3: Create useInterviewStore with full state machine** - `9d4a30a` (feat)

## Files Created

- `frontend/src/types/interview.ts` - InterviewStore interface, QuestionStatus union, MicPermission union
- `frontend/src/api/recordingApi.ts` - uploadRecording() fire-and-forget API module
- `frontend/src/store/interviewStore.ts` - useInterviewStore Zustand store with full state machine

## Decisions Made

- **RecordingBlob/RecordingDuration not in interface:** Following the established Zustand pattern, the orchestrator sets these via `useInterviewStore.setState()` directly. The interface only exposes `startRecording()` and `stopRecording()` as lifecycle hooks.
- **stopRecording() is intentionally a no-op:** Per the plan spec, the orchestrator owns the MediaRecorder stop logic and sets the blob/duration via Zustand setState after recording completes.
- **uploadRecording returns void:** Per D-10, uploads are fire-and-forget background operations. Errors are logged to console only, with no user-facing error feedback.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Stub Tracking

No stubs found. The `startRecording()` and `stopRecording()` action stubs are intentional per plan specification — the orchestrator component implements the actual MediaRecorder logic and sets recording state via `useInterviewStore.setState()`.

## Threat Flags

None found. Only client-side types, store, and API module created. The `uploadRecording` endpoint call was expected per D-07 and the API Contracts section.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `InterviewStore` interface ready for consumption by QuestionInterviewPage orchestrator (Plan 03)
- Types exported for TimerRing, RecordingIndicator, QuestionDrawer, and other Phase 3 leaf components (Plan 04)
- Recording API module ready for silent background upload hookup (Plan 05 transition)
- Constants `THINKING_TIME=120`, `ANSWERING_TIME=180`, `TRANSITION_DELAY=2500` defined for component consumption

---
*Phase: 03-question-by-question-interview*
*Completed: 2026-05-23*
