---
phase: 04-scoring-feedback
verified: 2026-05-24T00:00:00Z
status: human_needed
score: 4/4 roadmap success criteria verified (21/21 plan truths verified)
overrides_applied: 0
overrides: []
human_verification:
  - test: "Complete a full interview flow end-to-end"
    expected: "Select 3-4 questions, complete the full interview (TTS, thinking, answering for all questions), verify auto-navigation to /results, verify all cards render with scores, coverage dots, feedback, and transcript"
    why_human: "Requires running backend + frontend, actual TTS playback, microphone input, ASR processing, and LLM scoring -- all external service dependent"

  - test: "Verify card state transitions"
    expected: "Click 重新评分 on a scored card -- card transitions to pending state, then updates with new result. Click 点击重试 on a failed card -- triggers re-scoring. Click 手动评分 on a not-yet-scored card -- card transitions to pending, then to scored."
    why_human: "Visual state transitions and async API behavior cannot be verified through static code analysis"

  - test: "Verify empty state"
    expected: "Navigate directly to /results without completing an interview. See '暂无评分数据' message with '请先完成一次模拟面试' subtitle. Click '返回题库' to navigate to /."
    why_human: "Requires browser navigation and visual confirmation of empty state rendering"

  - test: "Verify poll timeout behavior"
    expected: "Start an interview but ensure the backend scoring never completes (stop backend). Verify that after ~60 seconds, the poll timeout warning banner appears with refresh link."
    why_human: "Requires timing-dependent behavior that must be observed visually"

  - test: "Verify ASR transcript collapsible section"
    expected: "Click the '语音识别原文' expandable section on a scored card. Verify it expands to show the ASR-transcribed text, and collapses again on second click."
    why_human: "Requires mouse interaction with Ant Design Collapse component"
---

# Phase 4: Scoring & Feedback Verification Report

**Phase Goal:** Users receive scores and textual feedback based on comparison with official scoring criteria.
**Verified:** 2026-05-24
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Roadmap Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | After interview completes, scoring runs automatically without user action | VERIFIED | `QuestionInterview/index.tsx:117-125` -- `uploadRecording(...).then(() => useScoringStore.getState().triggerScoring(...))` chains scoring trigger after recording upload. No user action required. |
| 2 | User sees a clear summary of overall performance | VERIFIED | `ScoringResultsPage/index.tsx` renders a card waterfall with one card per question, each showing coverage fraction (e.g., "3/5 已覆盖"), coverage dot breakdown, and LLM feedback. Per UI-SPEC D-07, the card waterfall itself is the summary -- no separate aggregate section by design. |
| 3 | For each question, user sees a score and which key points they covered vs missed | VERIFIED | `CoverageDots.tsx` renders per-point colored dots (green=COVER, orange=PARTIAL, red=MISS) with status labels and point text. `ScoringCard.tsx` displays coverage fraction prominently (28px/700, accent #BE1E2D). |
| 4 | User receives textual feedback for each question based on score_points comparison | VERIFIED | `ScoringCard.tsx` shows LLM-generated Chinese feedback under "文字反馈" label. Backend `scoring_service.py` builds prompt with scorePoints for LLM evaluation, returning per-point verdicts + overall feedback. |

**Score:** 4/4 roadmap success criteria verified

### Plan Must-Have Truths (Aggregated Across All Plans)

#### 04-01: Backend Scoring Pipeline

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Backend accepts scoring trigger requests per question with session_id, question_index, question_id | VERIFIED | `scoring.py` POST `/api/scoring/evaluate` accepts `EvaluateRequest` model with all three fields, validates UUID and non-negative index |
| 2 | Scoring pipeline converts WebM to WAV, runs ASR, and calls LLM for per-point coverage evaluation | VERIFIED | `scoring_service.py:evaluate_answer()` -- WebM->WAV via ffmpeg (line 287-300), ASR via `transcribe_audio()` (line 314), LLM via `dashscope.Generation.call()` (line 337) |
| 3 | LLM returns COVER/PARTIAL/MISS verdict for each scorePoint with evidence and reasoning | VERIFIED | `SCORING_SYSTEM_PROMPT` defines output format requiring id/verdict/evidence/reasoning per point. `validate_scoring_result()` checks all required keys. |
| 4 | Scoring results are persisted as JSON and retrievable by session ID | VERIFIED | `save_scoring_result()` writes to `recordings/{sid}/scoring.json` with upsert. `load_scoring_results()` reads it back. GET `/api/scoring/results/{sid}` returns the list. |
| 5 | Failed scoring auto-retries once, then degrades to failed status | VERIFIED | `evaluate_answer()` has `retry_count` parameter; retries once on any exception (line 400), returns `status: "failed"` on second failure (line 406) |

#### 04-02: Frontend Data Layer

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | User sees coverage dot visualization and feedback text for each scored question at /results | VERIFIED | `CoverageDots.tsx` renders colored dots + labels. `ScoringCard.tsx` composes coverage, feedback, and transcript sections. |
| 7 | User can view all question scores on one page with loading skeletons and retry buttons | VERIFIED | `ScoringResultsPage/index.tsx` renders card waterfall; PendingCard for pending, ErrorCard for failed with retry |
| 8 | Scoring results update automatically without page refresh | VERIFIED | `scoringStore.ts:startPolling()` polls every 2500ms, updates `results` state reactively via Zustand set() |
| 9 | User can click '重新评分' to trigger re-evaluation with immediate pending state | VERIFIED | `ScoringCard.tsx` has "重新评分" Button primary. `rescoreCard()` does optimistic update to pending before API call. |

#### 04-03: UI Components

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 10 | CoverageDots renders colored dots for COVER/PARTIAL/MISS with status labels | VERIFIED | `CoverageDots.tsx` -- dotColors: #52C41A/#FA8C16/#FF4D4F, labelText: 已覆盖/部分覆盖/未覆盖 |
| 11 | ScoringCard displays question title, coverage fraction, dots, feedback, transcript, re-score button | VERIFIED | `ScoringCard.tsx` has all 6 sections: Title, fraction (28px/700), CoverageDots, 文字反馈, Collapse transcript, 重新评分 button |
| 12 | PendingCard shows Skeleton with Spin and 评分中... text | VERIFIED | `PendingCard.tsx` -- Spin size="small" + "评分中..." + Skeleton active paragraph rows=3 |
| 13 | ErrorCard shows error icon, 评分失败 heading, and 点击重试 button | VERIFIED | `ErrorCard.tsx` -- CloseCircleOutlined icon (red), "评分失败" heading (16px/700/red), "点击重试" button (red outline) |
| 14 | All components use inline CSS-in-JS styles | VERIFIED | All 4 components use inline `React.CSSProperties` objects. No external CSS files, CSS modules, or styled-components. |
| 15 | Card entry animation fades in with 300ms ease-out | VERIFIED | `ScoringCard.tsx` and `PendingCard.tsx` have `opacity 0->1 + translateY(8px->0) 300ms ease-out` with `prefers-reduced-motion` gating |

#### 04-04: Integration

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 16 | User arrives at /results and sees a card waterfall with one card per question | VERIFIED | `router.tsx` has `{ path: 'results', element: <ScoringResultsPage /> }`. Page maps `selectedIds` to card configs rendering one card per question. |
| 17 | Cards in scored/pending/failed states render correctly per status | VERIFIED | `ScoringResultsPage/index.tsx` switch statement: scored->ScoringCard, pending->PendingCard, failed->ErrorCard |
| 18 | Empty state shows '暂无评分数据' + '返回题库' when no session | VERIFIED | isEmpty check: sessionId empty AND no results -> Ant Design Result with status="info", title="暂无评分数据", subTitle="请先完成一次模拟面试", extra button "返回题库" |
| 19 | Page polls backend every 2.5s, stops when terminal or after 60s | VERIFIED | `scoringStore.ts:startPolling()` -- POLL_INTERVAL_MS=2500, MAX_POLL_DURATION_MS=60000, checks allTerminal condition |
| 20 | User can click '返回题库' to navigate back to / | VERIFIED | Bottom of page: Button type="default" with accent border #BE1E2D, onClick={() => navigate('/')} |
| 21 | Scoring triggered automatically after recording upload, chained to prevent race | VERIFIED | `QuestionInterview/index.tsx:117-125` -- `.then(() => { useScoringStore.getState().triggerScoring(...) })` chained after `uploadRecording(...)`. Calls triggerScoring only after upload resolves. |

**Score:** 21/21 plan truths verified

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| SCORE-01 | 04-01, 04-02, 04-04 | 全部题目答完后统一评分 | SATISFIED | Per-question async scoring triggered automatically after each recording upload (D-04). By the time user reaches /results, all questions have been triggered and results are available via polling. The scoring runs without user action -- the spirit of "统一评分" is met through the results page aggregating all per-question results. |
| SCORE-02 | 04-01 | 基于已有 score_points 对比考生回答内容打分 | SATISFIED | `parse_score_points()` parses scorePoints into individual criteria. `build_scoring_prompt()` includes them in the LLM prompt. `evaluate_answer()` calls Qwen with system prompt instructing per-point comparison. LLM returns COVER/PARTIAL/MISS per point with evidence. |
| SCORE-03 | 04-02, 04-03, 04-04 | 展示评分结果和各题文字反馈 | SATISFIED | `ScoringResultsPage` renders card waterfall with `ScoringCard` per question. Each card shows coverage fraction, per-point `CoverageDots`, LLM feedback under "文字反馈" label, and collapsible ASR transcript. |
| UI-05 | 04-03, 04-04 | 评分结果与反馈展示页面 | SATISFIED | `/results` route exists in `router.tsx`. `ScoringResultsPage` orchestrates polling, renders empty/pending/scored/failed/not-started states. All copywriting per UI-SPEC contract. Card waterfall layout per UI-SPEC Layout Contract. |

All 4 requirement IDs from PLAN frontmatters are accounted for. No orphaned requirements.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/app/services/scoring_service.py` | Scoring pipeline: parse, prompt, evaluate, save/load | VERIFIED | 489 lines. 8 functions: parse_score_points, build_scoring_prompt, SCORING_SYSTEM_PROMPT, evaluate_answer, save_scoring_result, load_scoring_results, validate_scoring_result, compute_coverage_summary. Fully substantive. |
| `backend/app/routers/scoring.py` | REST endpoints for scoring | VERIFIED | 201 lines. 3 endpoints: POST /evaluate, GET /results/{sid}, POST /rescore. Pydantic models with validation. UUID pattern check. In-memory rate limiting (3 rescore max). |
| `backend/app/main.py` | Router registration | VERIFIED | Line 8: `from app.routers import ... scoring`. Line 61: `app.include_router(scoring.router)`. |
| `backend/tests/test_scoring_service.py` | Unit tests for scoring | VERIFIED | 299 lines. 17 tests across 6 test classes covering parsing, prompt, coverage, validation, persistence. |
| `backend/tests/test_scoring_e2e.py` | Integration tests for API | VERIFIED | 158 lines. 11 tests across 3 test classes covering evaluate, results, rescore endpoints. |
| `backend/tests/conftest.py` | Shared test fixtures | VERIFIED | 152 lines. 4 fixtures: sample_questions, sample_transcript, sample_coverage_json, temp_scoring_dir. |
| `frontend/src/types/scoring.ts` | TypeScript types | VERIFIED | 112 lines. 7 exports: ScoringStatus, CoverageVerdict, CoveragePoint, ScoringResult, ScoringStore, EvaluateRequest, RescoreRequest. All with JSDoc. |
| `frontend/src/api/scoringApi.ts` | API client module | VERIFIED | 100 lines. 3 functions: triggerScoring, fetchScoringResults, rescoreQuestion. Uses API_BASE_URL from client.ts. |
| `frontend/src/store/scoringStore.ts` | Zustand store | VERIFIED | 212 lines. 5 actions: startPolling, stopPolling, triggerScoring, rescoreCard, reset. Polling 2.5s interval, 60s timeout. |
| `frontend/src/pages/ScoringResults/components/CoverageDots.tsx` | Coverage dot visualization | VERIFIED | 72 lines. Maps CoveragePoint[] to colored dot rows with verdict labels and section-text display. |
| `frontend/src/pages/ScoringResults/components/ScoringCard.tsx` | Full scored result card | VERIFIED | 177 lines. 6 sections: title, fraction, dots, feedback, transcript collapse, re-score button. Animation gated. |
| `frontend/src/pages/ScoringResults/components/PendingCard.tsx` | Loading skeleton state | VERIFIED | 92 lines. Title + Spin indicator + "评分中..." + Skeleton(3 rows). Animation gated. |
| `frontend/src/pages/ScoringResults/components/ErrorCard.tsx` | Error state with retry | VERIFIED | 120 lines. Title + CloseCircleOutlined + "评分失败" + optional error detail + "点击重试". Animation gated. |
| `frontend/src/pages/ScoringResults/index.tsx` | Page orchestrator | VERIFIED | 207 lines. Reads 3 Zustand stores. Polling on mount/cleanup. Empty state. Card waterfall with all 4 states + not_started fallback. Poll timeout banner. 返回题库 button. |
| `frontend/src/router.tsx` | Route configuration | VERIFIED | Line 6: imports ScoringResultsPage. Line 17: `{ path: 'results', element: <ScoringResultsPage /> }` under AppLayout. |
| `frontend/src/pages/QuestionInterview/index.tsx` | Scoring trigger integration | VERIFIED | Line 9: imports useScoringStore. Lines 117-125: chained `.then()` pattern -- uploadRecording resolves first, then triggerScoring fires. Uses getState() pattern for event handler closure. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scoring.py` | `scoring_service.py` | import evaluate_answer, load_scoring_results, save_scoring_result | WIRED | `scoring.py:15-19` imports all three functions |
| `scoring_service.py` | `asr_service.py` | import transcribe_audio | WIRED | `scoring_service.py:19` imports transcribe_audio |
| `scoring_service.py` | DashScope Generation API | dashscope.Generation.call with qwen-max | WIRED | `scoring_service.py:337` calls Generation.call with model, messages, temperature, top_p, seed |
| `main.py` | `scoring.py` router | app.include_router(scoring.router) | WIRED | `main.py:8` imports scoring, `main.py:61` registers router |
| `scoringStore.ts` | `scoringApi.ts` | import triggerScoring, fetchScoringResults, rescoreQuestion | WIRED | `scoringStore.ts:3-7` imports all three API functions |
| `scoringStore.ts` | `scoring.ts` types | import ScoringResult, ScoringStore | WIRED | `scoringStore.ts:2` imports ScoringResult and ScoringStore |
| `scoringApi.ts` | Backend scoring endpoints | fetch to /api/scoring/* | WIRED | `scoringApi.ts:21,54,84` calls /api/scoring/evaluate, /results/, /rescore |
| `ScoringCard.tsx` | `CoverageDots.tsx` | import CoverageDots, pass coverage prop | WIRED | `ScoringCard.tsx:4` imports, line 135 renders `<CoverageDots coverage={...} />` |
| `ScoringCard.tsx` | Ant Design Collapse | ASR transcript section | WIRED | `ScoringCard.tsx:2` imports Collapse, line 150 renders `<Collapse>` |
| `ScoringCard.tsx` | `ScoringResult` type | Props interface | WIRED | `ScoringCard.tsx:3` imports ScoringResult, line 8-12 defines ScoringCardProps with result: ScoringResult |
| `ScoringResultsPage` | `scoringStore` | useScoringStore hook | WIRED | `ScoringResultsPage/index.tsx:4` imports, line 17 uses useScoringStore() |
| `ScoringResultsPage` | `interviewStore` | useInterviewStore hook | WIRED | `ScoringResultsPage/index.tsx:5` imports, line 18 uses useInterviewStore() |
| `ScoringResultsPage` | `questionBankStore` | useQuestionBankStore hook | WIRED | `ScoringResultsPage/index.tsx:6` imports, line 19 uses useQuestionBankStore() |
| `router.tsx` | `ScoringResultsPage` | import + route entry | WIRED | `router.tsx:6` imports, line 17 routes to 'results' |
| `QuestionInterviewPage` | `scoringStore` | useScoringStore.getState().triggerScoring() | WIRED | `QuestionInterview/index.tsx:9` imports, line 121 calls getState().triggerScoring() |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ScoringResultsPage/index.tsx` | `results` (ScoringResult[]) | `useScoringStore().results` -> populated by `startPolling()` -> `fetchScoringResults()` -> GET backend -> `load_scoring_results()` -> reads `recordings/{sid}/scoring.json` | Conditional (requires backend running + LLM scoring) | VERIFIED -- Data path exists end-to-end. Backend writes to scoring.json on pipeline completion. Frontend polls every 2.5s. Full data flow is wired but requires running services. |
| `ScoringCard.tsx` | `result.coverage` (CoveragePoint[]) | Prop from parent (ScoringResultsPage) -> Zustand store -> backend JSON | Same as above | VERIFIED -- CoveragePoint[] prop is typed and rendered by CoverageDots. |
| `ScoringCard.tsx` | `result.feedback` (string) | LLM-generated via DashScope Qwen -> persisted in scoring.json -> fetched by frontend | LLM (external API) | VERIFIED -- Feedback text renders under "文字反馈" label. |
| `ScoringCard.tsx` | `result.transcript` (string) | ASR via DashScope Paraformer -> included in scoring.json | ASR service (external) | VERIFIED -- Transcript is conditionally rendered in Collapse component. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Backend test suite passes | `cd backend && uv run python -m pytest tests/test_scoring_service.py tests/test_scoring_e2e.py -v 2>&1 \| tail -5` | Would require running the test suite | SKIP -- tests require DashScope API key and ffmpeg binary; not runnable in verification context |
| TypeScript compilation passes | `cd frontend && npx tsc --noEmit 2>&1 \| tail -5` | Would require node_modules | SKIP -- frontend dependencies not installed in current worktree context |
| Scoring service module importable | `cd backend && python -c "from app.services.scoring_service import parse_score_points, SCORING_SYSTEM_PROMPT, evaluate_answer; print('OK')"` | Would require venv + dashscope | SKIP -- Python environment not available in current context |

Step 7b: SKIPPED -- no runnable entry points in the current worktree environment (node_modules not installed, Python venv not active). All behavioral verification is routed to human verification (below).

### Probe Execution

No probes declared for Phase 4. Probe execution skipped.

### Anti-Patterns Found

**Debt markers (TBD/FIXME/XXX):** None found in any phase file.

**Warning markers (TODO/HACK/PLACEHOLDER):** None found in any phase file.

**Placeholder text:** None found in any phase file.

**Empty implementations:**
- `return {}` in PendingCard, ScoringCard, ErrorCard (3 locations) -- these are the `getAnimatedStyle` function returning empty style when `prefersReducedMotion` is true. This is intentional accessibility behavior, not a stub.
- `return null` in ScoringResultsPage (line 190) -- unreachable default case in switch covering all ScoringStatus values. Not a stub.

**Console.log:** No console.log-only implementations found.

**Hardcoded empty data:** No hardcoded empty arrays/objects flowing to rendering. All state variables are populated by real data sources (API responses, store actions).

**Classification:** No anti-patterns. All code is substantive. No stubs, no placeholders, no unresolved debt markers.

### Design Decision Notes

**SCORE-01 implementation deviation:** The requirement states "全部题目答完后统一评分" (unified scoring after all questions). The implementation uses per-question async scoring (D-04) triggered automatically after each recording upload. From the user's perspective, all scoring results are available by the time they reach /results, and the page presents them in a unified card waterfall. This is an intentional architectural decision documented in the plan (referencing D-04 and D-09). The outcome -- automatic scoring with no user action, and unified display of all results -- is achieved.

**No aggregate performance summary:** The roadmap SC #2 references "clear summary of overall performance." The UI-SPEC (D-07) explicitly specifies "no top-level summary" -- the card waterfall with per-question coverage fractions and feedback IS the overall performance view. No separate aggregate section (e.g., total points across all questions) exists. This is by design per the approved UI-SPEC.

### Human Verification Required

The plan 04-04 Task 3 is a `checkpoint:human-verify` gate that has not been completed. The following must be verified by a human running the full application stack:

1. **End-to-end interview flow:** Complete a full interview (select questions, TTS playback, thinking, answering for all questions), verify auto-navigation to /results, verify all cards render with scores, coverage dots, feedback, and transcript.

2. **Card state transitions:** Click 重新评分 on a scored card -- verify card transitions to pending state, then updates with new result. Click 点击重试 on a failed card -- verify re-scoring triggers. Click 手动评分 on a not-yet-scored card -- verify card transitions to pending, then to scored.

3. **Empty state:** Navigate directly to /results without completing an interview. Verify "暂无评分数据" message with "请先完成一次模拟面试" subtitle and functional "返回题库" button.

4. **Poll timeout:** Verify that after ~60 seconds of backend unavailability, the poll timeout warning banner appears with functional refresh link.

5. **ASR transcript collapsible:** Click the "语音识别原文" expandable section on a scored card. Verify it expands to show the ASR-transcribed text and collapses on second click.

### Gaps Summary

No technical gaps found. All 21 plan truths verified. All 16 required artifacts exist, are substantive, and are correctly wired. All 15 key links verified as connected. No anti-patterns, stubs, or debt markers. All 4 requirement IDs (SCORE-01, SCORE-02, SCORE-03, UI-05) are satisfied by implementation evidence.

The phase is code-complete. Human verification of the end-to-end flow is required before the phase can be marked as fully passed.

---

_Verified: 2026-05-24_
_Verifier: Claude (gsd-verifier)_
