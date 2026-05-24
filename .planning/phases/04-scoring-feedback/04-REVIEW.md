---
phase: 04-scoring-feedback
reviewed: 2026-05-24T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - backend/app/main.py
  - backend/app/routers/scoring.py
  - backend/app/services/scoring_service.py
  - backend/tests/conftest.py
  - backend/tests/test_scoring_e2e.py
  - backend/tests/test_scoring_service.py
  - frontend/src/api/scoringApi.ts
  - frontend/src/pages/QuestionInterview/index.tsx
  - frontend/src/pages/ScoringResults/components/CoverageDots.tsx
  - frontend/src/pages/ScoringResults/components/ErrorCard.tsx
  - frontend/src/pages/ScoringResults/components/PendingCard.tsx
  - frontend/src/pages/ScoringResults/components/ScoringCard.tsx
  - frontend/src/pages/ScoringResults/index.tsx
  - frontend/src/store/scoringStore.ts
  - frontend/src/types/scoring.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-24T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the scoring & feedback system implementation across 15 source files (7 backend, 8 frontend). The implementation covers the full pipeline: ASR transcription, LLM-based coverage evaluation, result persistence, REST API endpoints, polling-based frontend store, and card waterfall UI.

One **BLOCKER** was found: a missing retry-count increment in `evaluate_answer()` causes near-infinite recursion when a recording file does not exist. The testing would not catch this because the e2e test `test_evaluate_valid_request` returns 200 immediately (fire-and-forget pattern) without waiting for pipeline completion.

Four **WARNINGs** cover an unbounded in-memory data structure, dead/unreachable code paths, and a fragile module-level API key assignment. Four **INFO** items note code duplication, a type-safety escape hatch, missing runtime fallback handling, and silently swallowed errors.

---

## Critical Issues

### CR-01: Infinite recursion when recording file does not exist

**File:** `backend/app/services/scoring_service.py:272-277`
**Issue:** When `webm_path.exists()` returns `False` and `retry_count` is 0, the function calls itself with `retry_count=retry_count` (i.e., 0, unchanged). Each recursive call encounters the same file-missing condition with the same `retry_count=0`, causing unbounded recursion until Python's recursion limit is hit (~1000 frames deep). A `RecursionError` eventually propagates and is caught by the `except (RuntimeError, ValueError)` handler at line 393, which DOES correctly increment the retry count — but only after wasting ~1000 stack frames.

The intended behavior (per the `retry_count` parameter semantics and the `RETRY_COUNT` constant in the test fixture path) is **one retry, then fail**. The missing `+ 1` makes this functionally broken.

Compare with the three other retry paths in the same function at lines 391, 400, and 408 — all of which correctly use `retry_count=retry_count + 1`.

**Fix:**
```python
    if not webm_path.exists():
        msg = f"Recording not found: {webm_path}"
        logger.error(msg)
        if retry_count >= 1:
            return {"status": "failed", "error": msg, "question_index": question_index}
        return evaluate_answer(session_id, question_index, question, retry_count=retry_count + 1)
```

---

## Warnings

### WR-01: In-memory rate-limit dictionary grows unboundedly (no eviction)

**File:** `backend/app/routers/scoring.py:25-27`
**Issue:** The module-level `_rescore_counts: dict[str, int] = {}` dictionary is keyed by `"{session_id}:{question_index}"`. Entries are only added (never removed). In a long-running server serving many unique sessions, this dictionary grows without bound, progressively leaking memory. While the growth rate is bounded by the rate limit (max 3 entries per question per session), there is no mechanism to clean up entries for sessions that have completed.
**Fix:** Add a TTL-based eviction mechanism, or use a bounded LRU cache (e.g., `functools.lru_cache` or `cachetools.TTLCache`). For v1 personal use, resetting on process restart is acceptable; document this limitation.

### WR-02: Unreachable `case 'not_started'` in ScoringResults switch

**File:** `frontend/src/pages/ScoringResults/index.tsx:166-188`
**Issue:** The rendering logic first checks `if (result === undefined)` at line 112 and renders a "not started" card for that case. The subsequent `switch (result.status)` at line 138 includes a `case 'not_started':` branch, but this branch is unreachable. Results are only inserted into the store's `results` array with status `'pending'` (via `triggerScoring` in `scoringStore.ts:143`). A result with `status: 'not_started'` never exists in the array. If a result is `undefined`, the earlier check catches it. If it exists, its status is always `'pending'`, `'scored'`, or `'failed'`.
**Fix:** Remove the `case 'not_started':` branch (lines 166-188) from the switch statement, or consolidate the not-started rendering into a single place to eliminate the dead code.

### WR-03: Dead `.catch(console.error)` on scoring trigger in interview page

**File:** `frontend/src/pages/QuestionInterview/index.tsx:121-124`
**Issue:** `useScoringStore.getState().triggerScoring(...)` returns `Promise<void>` because the store function is `async`. However, internally it uses a fire-and-forget pattern (the API call is NOT `await`ed), so the returned promise always resolves immediately. The attached `.catch(console.error)` handler will never execute for an API failure. The actual API error is handled inside the store (updating status to `'failed'` via `scoringStore.ts:154`). The `.catch(console.error)` is misleading dead code that suggests error handling where none actually occurs.
**Fix:** Either remove the `.catch(console.error)` on line 124 (the store handles errors internally), or if error surface is desired here, use a different pattern (e.g., await the API result).

### WR-04: Module-level API key assignment at import time

**File:** `backend/app/services/scoring_service.py:22-23`
**Issue:** `dashscope.api_key = os.environ.get("DASHSCOPE_API_KEY", "")` executes at module import time. If the `DASHSCOPE_API_KEY` environment variable is set or changed after the module is already imported, the change is not reflected. This is fragile for testing (tests that patch `os.environ` after import won't update the key) and for hot-reload scenarios.
**Fix:** Read the API key lazily on first use, or pass it explicitly to the functions that need it. Alternatively, initialize it inside `evaluate_answer()` before calling `transcribe_audio()`, or accept the import-time assignment and document that the env var must be set before `uvicorn` starts.

---

## Info

### IN-01: Duplicated `prefers-reduced-motion` and `requestAnimationFrame` logic

**Files:**
- `frontend/src/pages/ScoringResults/components/ScoringCard.tsx:98-114`
- `frontend/src/pages/ScoringResults/components/ErrorCard.tsx:77-93`
- `frontend/src/pages/ScoringResults/components/PendingCard.tsx:57-73`

**Issue:** All three components contain nearly identical `useEffect` hooks for detecting `prefers-reduced-motion` and triggering animation visibility. This duplication increases maintenance burden — any change to the animation behavior must be replicated across all three files.
**Fix:** Extract a custom hook (e.g., `useCardAnimation(animationDelay)`) that encapsulates the media query listener and `requestAnimationFrame` logic.

### IN-02: `as any` type escape for private property pattern

**File:** `frontend/src/store/scoringStore.ts:94,101,103`
**Issue:** `(get as any).__pollingCleanup` bypasses TypeScript type checking to attach a private property to Zustand's `get` function object. While functionally correct (the function reference is stable), this is fragile and non-idiomatic.
**Fix:** Store the cleanup handle in a module-level `let` variable outside the store creator, or use `useRef` in the consuming component. Alternatively, store the interval/timeout IDs in the store state (as part of a `_timers` internal field) using Zustand's mutable state.

### IN-03: No fallback rendering for unknown `CoverageVerdict` values

**File:** `frontend/src/pages/ScoringResults/components/CoverageDots.tsx:64-66`
**Issue:** `dotColors[point.verdict]` and `labelText[point.verdict]` use string-indexed lookup objects with only three known keys (`COVER`, `PARTIAL`, `MISS`). If the backend returns a verdict string not in this set (e.g., due to a backward-incompatible LLM output change), both lookups return `undefined` — the dot renders invisible and the label is missing, silently degrading the UI.
**Fix:** Add a fallback: `dotColors[point.verdict] ?? '#D9D9D9'` and `labelText[point.verdict] ?? '未知'`, or use an exhaustive switch to make the TypeScript compiler catch unhandled cases.

### IN-04: Upload failure silently swallowed with `console.error`

**File:** `frontend/src/pages/QuestionInterview/index.tsx:126`
**Issue:** `uploadRecording(...).catch(console.error)` silently logs upload failures to the console without surfacing the error to the user. If the recording upload fails, the scoring pipeline will also fail (since the recording file won't exist on disk). The user proceeds through the interview unaware that their answer was never saved.
**Fix:** Consider setting an error state flag that prevents transition to the next question, or shows a toast notification to the user. At minimum, surface this in the UI rather than only in the browser console.

---

_Reviewed: 2026-05-24T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
