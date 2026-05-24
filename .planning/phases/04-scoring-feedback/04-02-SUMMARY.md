---
phase: 04-scoring-feedback
plan: 02
type: execute
autonomous: true
wave: 1
subsystem: scoring-frontend-data-layer
tags: [typescript, zustand, api-client, polling, data-layer]
depends_on: []
provides:
  - frontend/src/types/scoring.ts
  - frontend/src/api/scoringApi.ts
  - frontend/src/store/scoringStore.ts
requires:
  - Plan 04-01 (backend scoring endpoints)
affects:
  - Plan 04-03 (results page UI)
  - Plan 04-04 (scoring trigger in interview page)
tech-stack:
  added: []
  patterns:
    - "Zustand create<T>((set, get) => ({...})) for typed stores"
    - "API modules import API_BASE_URL from ./client and throw Error on non-ok"
    - "setInterval-based polling with immediate first fetch and 60s max timeout"
key-files:
  created:
    - frontend/src/types/scoring.ts
    - frontend/src/api/scoringApi.ts
    - frontend/src/store/scoringStore.ts
  modified: []
decisions: []
metrics:
  duration: "~6 minutes"
  completed_date: "2026-05-24"
---

# Phase 04 Plan 02: Scoring Frontend Data Layer Summary

**One-liner:** Typed contracts, polling-based API client, and Zustand store for scoring results -- the frontend data foundation that the `/results` page and interview scoring trigger depend on.

## What Was Built

Three files that form the complete scoring data layer for the frontend:

### 1. `frontend/src/types/scoring.ts` -- TypeScript Types

Seven named exports defining the scoring data contracts:

- **`ScoringStatus`** -- `'not_started' | 'pending' | 'scored' | 'failed'` state machine
- **`CoverageVerdict`** -- `'COVER' | 'PARTIAL' | 'MISS'` matching backend JSON (uppercase per D-06)
- **`CoveragePoint`** -- per-point structure with `id`, `section`, `text`, `verdict`, `evidence`, `reasoning`
- **`ScoringResult`** -- 10-field result interface with optional `transcript`, `coverage`, `feedback`, `coveredCount`, `totalCount`, `error`
- **`ScoringStore`** -- Zustand store shape with `results`, `isPolling`, `pollTimeout` state and 5 action methods
- **`EvaluateRequest`** -- POST /api/scoring/evaluate body shape
- **`RescoreRequest`** -- POST /api/scoring/rescore body shape (same as EvaluateRequest)

All exports have JSDoc comments. No default exports.

### 2. `frontend/src/api/scoringApi.ts` -- API Client Module

Three async functions following the established `recordingApi.ts` pattern:

- **`triggerScoring(sessionId, questionIndex, questionId)`** -- POST to `/api/scoring/evaluate` with JSON body
- **`fetchScoringResults(sessionId)`** -- GET `/api/scoring/results/{encodedSessionId}`, returns `Promise<ScoringResult[]>`
- **`rescoreQuestion(sessionId, questionIndex, questionId)`** -- POST to `/api/scoring/rescore` with JSON body

All functions use `API_BASE_URL` from `./client`, send `Content-Type: application/json`, and throw `Error` with descriptive messages on non-ok responses.

### 3. `frontend/src/store/scoringStore.ts` -- Zustand Store

`useScoringStore` hook exported via `create<ScoringStore>()`. Key behaviors:

- **`startPolling(sessionId, questionCount)`** -- Fetches immediately, then polls every 2.5s. Stops when all `questionCount` results are terminal (`scored` or `failed`) or after 60s max duration (sets `pollTimeout: true`).
- **`stopPolling()`** -- Clears interval and timeout via stored cleanup reference.
- **`triggerScoring(sessionId, questionIndex, questionId, questionTitle)`** -- Optimistic update to `pending` status; fire-and-forget API call; on catch, sets status to `failed` with error message.
- **`rescoreCard(sessionId, questionIndex, questionId)`** -- Same optimistic pattern as `triggerScoring`, updates existing result to `pending` then fires rescore API.
- **`reset()`** -- Calls `stopPolling()`, clears `results` array and `pollTimeout` flag.

## Verification Performed

| Check | Result |
|-------|--------|
| `cd frontend && npx tsc --noEmit` | PASSED -- zero errors |
| `ScoringStatus` has 4 values | PASSED -- `not_started`, `pending`, `scored`, `failed` |
| `CoverageVerdict` uppercase matching backend | PASSED -- `COVER`, `PARTIAL`, `MISS` |
| `ScoringResult` has all 10 fields | PASSED |
| `ScoringStore` has all 5 methods | PASSED -- `startPolling`, `stopPolling`, `triggerScoring`, `rescoreCard`, `reset` |
| API functions use `API_BASE_URL` | PASSED -- imported from `./client` |
| `fetchScoringResults` uses `encodeURIComponent` | PASSED |
| `startPolling` immediate fetch + 2.5s interval | PASSED |
| `triggerScoring` optimistic update | PASSED -- sets `pending` before API call |
| `rescoreCard` optimistic update | PASSED -- sets `pending` before API call |
| `reset()` clears results and stops polling | PASSED |

## Deviations from Plan

None -- plan executed exactly as written.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create scoring types (scoring.ts) | `e85c841` | `frontend/src/types/scoring.ts` (created) |
| 2 | Create scoring API module + Zustand store | `4931ee9` | `frontend/src/api/scoringApi.ts` (created), `frontend/src/store/scoringStore.ts` (created) |

## Known Stubs

None. All types, API functions, and store actions are fully implemented with real logic -- no placeholder values, no hardcoded mock data, no TODO/FIXME comments.

## Threat Flags

None. All files are client-side data contracts and state management with no new network surface beyond what the plan's threat model already covers (T-04-07, T-04-08, T-04-09).
