---
phase: 04
slug: scoring-feedback
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-24
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (backend) + Vitest/Playwright (frontend; check config) |
| **Config file** | pytest: auto-discovery; frontend: check for vitest.config.ts / playwright.config.ts |
| **Quick run command** | `cd backend && uv run python -m pytest tests/ -x` |
| **Full suite command** | `cd backend && uv run python -m pytest tests/ -v` |
| **Estimated runtime** | ~30 seconds (unit), ~120 seconds (integration) |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && uv run python -m pytest tests/test_scoring_service.py -x`
- **After every plan wave:** Run `cd backend && uv run python -m pytest tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| — | — | — | SCORE-01 | T-04-01 | session_id validated as UUID; path traversal prevented | integration | `uv run python -m pytest tests/test_scoring_e2e.py::test_auto_trigger -x` | ❌ W0 | ⬜ pending |
| — | — | — | SCORE-02 | T-04-02 | prompt injection mitigated via role separation; JSON output validated | unit | `uv run python -m pytest tests/test_scoring_service.py::test_coverage_evaluation -x` | ❌ W0 | ⬜ pending |
| — | — | — | SCORE-03 | T-04-03 | raw LLM output never passed to frontend without validation | e2e | `npx playwright test tests/scoring-results.spec.ts` | ❌ W0 | ⬜ pending |
| — | — | — | UI-05 | N/A | card states render correctly | ui | manual verification (Playwright config TBD) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_scoring_service.py` — stubs for scorePoints parsing, LLM prompt construction, coverage computation
- [ ] `backend/tests/test_scoring_e2e.py` — stubs for full pipeline: recording → ASR → LLM → result JSON
- [ ] `backend/tests/conftest.py` — shared fixtures (mock questions with scorePoints, sample transcripts)
- [ ] Frontend test infrastructure check: confirm vitest.config.ts or playwright.config.ts exists; if absent, manual verification is acceptable for v1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scoring results page renders with real data | SCORE-03, UI-05 | E2E requires full stack + TTS-generated audio + DashScope API | Run full interview flow, check /results page shows all cards with correct scores |
| Re-score button triggers new evaluation | SCORE-03 | Requires live LLM call; unit test covers button handler logic only | Click "重新评分" on a card, verify new result appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
