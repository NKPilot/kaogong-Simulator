---
phase: 04-scoring-feedback
plan: 04
subsystem: scoring-feedback-integration
tags: [integration, scoring, routing, orchestrator]
requires: [04-01, 04-02, 04-03]
provides: [/results route, ScoringResultsPage, scoring trigger integration]
affects: [frontend-router, frontend-interview-page]
completed: 2026-05-24
author: gsd-executor
duration: "2 min"
task_count: 2
file_count: 3
tech-stack:
  added: []
  patterns: [zustand-getState-in-closures, polling-on-mount-with-cleanup, card-waterfall-pattern]
key-files:
  created:
    - frontend/src/pages/ScoringResults/index.tsx
  modified:
    - frontend/src/router.tsx
    - frontend/src/pages/QuestionInterview/index.tsx
key-decisions: []
---

# Phase 04 Plan 04: Scoring Integration Summary

**One-liner:** Wired ScoringResultsPage orchestrator with card waterfall, /results route, and chained scoring trigger after recording upload to prevent race conditions.

## Tasks Completed

| Task | Name | Type | Commit | Files |
|------|------|------|--------|-------|
| 1 | Create ScoringResultsPage orchestrator | auto | `24f34d5` | `frontend/src/pages/ScoringResults/index.tsx` |
| 2 | Add /results route + scoring trigger integration | auto | `afc4dee` | `frontend/src/router.tsx`, `frontend/src/pages/QuestionInterview/index.tsx` |
| 3 | Verify end-to-end scoring flow | checkpoint:human-verify | — | — |

## What Was Built

### Task 1: ScoringResultsPage Orchestrator

Created `ScoringResultsPage/index.tsx` — a page-level orchestrator component that:
- Reads scoring results from `useScoringStore`, session ID from `useInterviewStore`, and question metadata from `useQuestionBankStore`
- Builds a question title lookup map from the question bank for display fallbacks
- Starts polling on mount via `startPolling(sessionId, questionCount)`, stops on unmount
- Renders an empty state using Ant Design `Result` component ("暂无评分数据" + "返回题库" button) when no session exists and no results are present
- Renders a card waterfall with one card per question:
  - `ScoringCard` for `status === 'scored'` (full results with coverage, feedback, transcript)
  - `PendingCard` for `status === 'pending'` (skeleton + spin + "评分中...")
  - `ErrorCard` for `status === 'failed'` (error icon + "评分失败" + retry button)
  - Fallback Card with "手动评分" button for `not_started` / `undefined` states
- Displays a poll timeout warning banner with refresh link when `pollTimeout` is true
- Includes "返回题库" outlined button at page bottom (accent #BE1E2D border)
- Card stagger animation: `index * 100ms` delay

### Task 2: Route and Scoring Trigger Integration

**Router (`router.tsx`):**
- Added import for `ScoringResultsPage` from `./pages/ScoringResults`
- Added route entry `{ path: 'results', element: <ScoringResultsPage />}` under AppLayout children

**QuestionInterviewPage (`QuestionInterview/index.tsx`):**
- Added import for `useScoringStore` from store
- Replaced standalone `uploadRecording(...).catch(...)` with chained call:
  ```
  uploadRecording(sessionId, index, blob)
    .then(() => {
      useScoringStore.getState().triggerScoring(
        sessionId, index, questionId, questionTitle
      ).catch(console.error);
    })
    .catch(console.error);
  ```
- Uses Zustand `getState()` pattern (not hook) since it's inside an event handler closure
- Scoring only fires after upload completes successfully, preventing race conditions (D-04/D-09)
- Captures `questionId` and `questionTitle` from `selectedIds` and `questions` at the time stop fires

## Deviations from Plan

None — plan executed exactly as written. Both auto tasks implemented per the plan specifications with all acceptance criteria met.

## Verification

- TypeScript compilation: `npx tsc --noEmit` — PASSED (no errors)
- All imports resolve correctly against existing store APIs and component interfaces
- Router entry pattern matches existing conventions (import at top, route in children array)
- Scoring trigger chaining pattern verified: uploadRecording resolves first, then triggerScoring fires

## Known Stubs

None. All copywriting ("暂无评分数据", "等待评分...", "手动评分") is intentional per the UI-SPEC copywriting contract.

## Threat Flags

None. No new threat surface introduced beyond what the plan's threat model anticipates (T-04-12, T-04-13).

## Self-Check: PASSED

- `frontend/src/pages/ScoringResults/index.tsx` — created and committed at `24f34d5`
- `frontend/src/router.tsx` — modified and committed at `afc4dee`
- `frontend/src/pages/QuestionInterview/index.tsx` — modified and committed at `afc4dee`
