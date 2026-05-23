---
phase: 02
plan: 01
type: execute
subsystem: backend-api
tags: [guidance, tts, dashscope, cors]
requires: [phase-01-backend]
provides: [guidance-endpoint, tts-endpoint]
affects: [cors-config, pyproject-deps]
tech-stack:
  added:
    - "dashscope>=1.25.11: DashScope TTS SDK (SpeechSynthesizer)"
  patterns:
    - "FastAPI APIRouter with tag-based grouping"
    - "StreamingResponse wrapping thread-pool SDK calls"
    - "Module-level service functions with template constants"
key-files:
  created:
    - backend/app/services/guidance_service.py
    - backend/app/routers/guidance.py
    - backend/app/services/tts_service.py
    - backend/app/routers/tts.py
  modified:
    - backend/app/main.py
    - backend/pyproject.toml
decisions:
  - "Voice default is longxiaocheng_v2 (formal male, broadcast-style)"
  - "TTS service validates text length <= 500 chars in both Pydantic model and service layer (defense-in-depth)"
  - "Guidance template uses str.format with {count} placeholder"
metrics:
  duration: "~12 min"
  completed: 2026-05-23
---

# Phase 2 Plan 1: Backend API Layer (Guidance + TTS)

**Summary:** Created the backend API layer for Phase 2 Virtual Exam Room — guidance text endpoint and TTS audio synthesis proxy.

## Task Execution

### Task 1: Create Guidance Service and API Endpoint

**Files created:**
- `backend/app/services/guidance_service.py` — Module-level `_GUIDANCE_TEMPLATE` dict with title ("面试说明") and 4 paragraph strings using `{count}` placeholder. Exports `generate_guidance_text(question_count)` function.
- `backend/app/routers/guidance.py` — APIRouter with `GET /api/interview/guidance?question_count=N` endpoint. Returns `GuidanceResponse` Pydantic model with `title: str` and `paragraphs: List[str]`.

**Verification:** Guidance text generates correctly with dynamic question count (e.g., "本次面试共 3 道题"). Pydantic model validates response shape.

**Commit:** 04e6249

### Task 2: Create TTS Service, API Endpoint, Update CORS and Dependencies

**Files created:**
- `backend/app/services/tts_service.py` — Wraps DashScope `SpeechSynthesizer` (model=cosyvoice-v2, format=mp3, sample_rate=22050). API key set from `DASHSCOPE_API_KEY` env var at module level. Input validation: raises `ValueError` if text > 500 chars. Voice default: `longxiaocheng_v2`.
- `backend/app/routers/tts.py` — APIRouter with `POST /api/tts/synthesize`. `TTSRequest` Pydantic model with `text: str` (max_length=500) and `voice: str` (default longxiaocheng_v2). Returns `StreamingResponse` with chunked MP3 audio (8192-byte chunks). Blocking SDK call wrapped in `asyncio.to_thread()`. Catches `ValueError` (422) and synthesis errors (502).

**Files modified:**
- `backend/app/main.py` — Updated CORS `allow_methods` from `["GET"]` to `["GET", "POST"]`. Added imports for `guidance` and `tts` routers with `app.include_router()`. Added startup warning if `DASHSCOPE_API_KEY` is not set (graceful degradation per D-16).
- `backend/pyproject.toml` — Added `dashscope>=1.25.11` to dependencies.

**Verification:** All automated checks pass: service signature, input validation, Pydantic model max_length, pyproject.toml parsing, route registration, CORS POST method allowed.

**Commit:** ffa8192

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — threat mitigations per the plan's threat model are correctly implemented:
- T-02-01 (Information Disclosure): API key set via env var on server only, never exposed in frontend responses
- T-02-02 (Tampering): `TTSRequest.text` has `max_length=500` via Pydantic Field validation + `synthesize_speech` validates length and raises `ValueError`

## Self-Check: PASSED

- [x] `backend/app/services/guidance_service.py` exists
- [x] `backend/app/routers/guidance.py` exists
- [x] `backend/app/services/tts_service.py` exists
- [x] `backend/app/routers/tts.py` exists
- [x] `backend/app/main.py` modified (CORS POST, router registration, API key warning)
- [x] `backend/pyproject.toml` modified (dashscope dependency)
- [x] Commit 04e6249: `feat(02-01): create guidance service and API endpoint`
- [x] Commit ffa8192: `feat(02-01): create TTS service, API endpoint, update CORS and deps`
