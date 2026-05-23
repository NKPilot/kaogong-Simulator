---
phase: 02-virtual-exam-room
reviewed: 2026-05-23T15:30:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - backend/app/routers/guidance.py
  - backend/app/services/guidance_service.py
  - backend/app/routers/tts.py
  - backend/app/services/tts_service.py
  - backend/app/main.py
  - backend/pyproject.toml
  - frontend/src/api/guidanceApi.ts
  - frontend/src/api/ttsApi.ts
  - frontend/src/pages/ExamRoom/components/RedBanner.tsx
  - frontend/src/pages/ExamRoom/components/ExaminerRow.tsx
  - frontend/src/pages/ExamRoom/components/EntryAnimation.css
  - frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx
  - frontend/src/pages/ExamRoom/components/TTSControls.tsx
  - frontend/src/pages/ExamRoom/components/CTAButton.tsx
  - frontend/src/pages/ExamRoom/index.tsx
findings:
  critical: 2
  warning: 4
  info: 5
  total: 11
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-23T15:30:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed 15 source files across the backend (FastAPI routers, services, main entry point, and project config) and frontend (React components, API clients, store integration). The implementation covers the exam room welcome screen with guidance text, TTS synthesis, examiner display, and a call-to-action button to start the exam.

Two critical (BLOCKER) findings were identified: the CTA button navigates to a non-existent route, breaking the exam flow entirely; and the TTS error handling is structurally broken -- exceptions raised during streaming bypass the try/except block, producing incorrect HTTP status codes. Four warnings include hardcoded API URLs, missing timeouts, and silent error swallowing. Five info items note quality concerns.

## Critical Issues

### CR-01: CTA button navigates to non-existent route -- exam flow broken

**File:** `frontend/src/pages/ExamRoom/index.tsx:179`
**Issue:** The `handleStartExam` function calls `navigate('/exam-room/question/1')`, but the router at `frontend/src/router.tsx:12` only defines `/exam-room` as a leaf route with `<ExamRoomPage />`. No child route for `question/:id` exists anywhere in the router configuration. After clicking "开始答题," the user is directed to a route with no matching element, resulting in a blank or broken page. The entire exam flow beyond the welcome screen is non-functional.

This route does not exist either as a separate file or as a child route. No `QuestionDetailPage` or equivalent component is registered.

**Fix:** Either add the missing route to the router (preferred -- define a route like `{ path: 'question/:questionIndex', element: <QuestionPage /> }` and create the corresponding component), or change the CTA handler to stay on the current page and transition to a question-viewing state. If the intent is to navigate by question index, pass the first selected question's ID (from `selectedIds[0]`) rather than the hardcoded `'1'`:
```typescript
const handleStartExam = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.src = '';
  }
  navigate(`/exam-room/question/${selectedIds[0]}`);
};
```
This still requires the route to exist. A complete fix must include both the route registration and the target component.

---

### CR-02: TTS error handling broken -- exceptions during streaming bypass try/except

**File:** `backend/app/routers/tts.py:75-90`
**Issue:** The `try/except` block wraps the creation and return of `StreamingResponse(audio_chunk_generator(...))`, but the actual call to `synthesize_speech` happens inside the `audio_chunk_generator` async generator, which is iterated by FastAPI/Starlette **after** the handler function has already returned. This means:

1. If `synthesize_speech` raises `ValueError` (text > 500 characters, defense-in-depth check in `tts_service.py:32`), the exception propagates from inside the generator during streaming, **not** inside the try/except block. The intended `422` response is never sent.
2. If the DashScope API call fails (network error, auth failure, API down), the exception also propagates from inside the generator. The intended `502` response is never sent.
3. In both cases, FastAPI/Starlette catches the exception and closes the stream, but the HTTP response status `200` has already been committed. The client sees a successful status code with a truncated or empty body.

The Pydantic `max_length=500` on `TTSRequest.text` provides the primary validation, so the ValueError path requires a configuration mismatch to trigger. However, the DashScope failure path is a real production scenario, and the current code produces a misleading `200` response instead of a proper `502` error.

**Fix:** Move the `synthesize_speech` call outside the generator, before creating the `StreamingResponse`. Validate and pre-fetch before starting the stream:

```python
@router.post("/api/tts/synthesize")
async def synthesize(request: TTSRequest) -> StreamingResponse:
    """Synthesize speech from text and stream MP3 audio back."""
    try:
        # Fetch audio data BEFORE creating the streaming response
        audio_bytes = await asyncio.to_thread(
            synthesize_speech, request.text, request.voice
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        raise HTTPException(status_code=502, detail="TTS synthesis failed")

    # Stream from pre-fetched bytes
    async def chunk_generator(data: bytes):
        for i in range(0, len(data), CHUNK_SIZE):
            yield data[i : i + CHUNK_SIZE]

    return StreamingResponse(
        chunk_generator(audio_bytes),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache",
            "Accept-Ranges": "bytes",
        },
    )
```

Alternatively, add try/except inside the generator and raise an `HTTPException`-like mechanism (though this is more complex since you cannot raise `HTTPException` once the stream has started).

## Warnings

### WR-01: TTS API hardcodes API_BASE_URL instead of importing shared constant

**File:** `frontend/src/api/ttsApi.ts:1`
**Issue:** The TTS API module defines its own `API_BASE_URL` as the hardcoded string `'http://localhost:8000'`. Meanwhile, `frontend/src/api/guidanceApi.ts:1` correctly imports `API_BASE_URL` from `./client.ts` (which also hardcodes the same value, but does so in a single location). Any future change to the API base URL (different port, production URL, environment variable) will silently break the TTS API while the guidance API continues to work, creating a confusing inconsistency.

**Fix:** Import `API_BASE_URL` from `./client.ts` and remove the local constant:
```typescript
import { API_BASE_URL } from './client';

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE_URL}/api/tts/synthesize`, {
    ...
  });
}
```

---

### WR-02: No timeout on DashScope TTS API call risks worker pool exhaustion

**File:** `backend/app/services/tts_service.py:45`
**Issue:** The `synthesizer.call(text)` call has no configurable timeout. If the DashScope API becomes unresponsive (network partition, server hang, rate limiting), the thread pool worker executing this call blocks indefinitely. Under load, all uvicorn workers could become stuck waiting on the DashScope API, making the entire backend unresponsive to new requests.

**Fix:** Wrap the call with a timeout: either configure a timeout at the DashScope SDK level if supported, or use `asyncio.wait_for` at the call site in `tts.py`:
```python
# In tts_service.py or the caller
async def synthesize_speech_with_timeout(text: str, voice: str = "longxiaocheng_v2") -> bytes:
    loop = asyncio.get_event_loop()
    return await asyncio.wait_for(
        loop.run_in_executor(None, synthesize_speech, text, voice),
        timeout=30.0  # 30-second timeout
    )
```

---

### WR-03: Audio play errors silently swallowed with empty catch

**File:** `frontend/src/pages/ExamRoom/index.tsx:148-149, 158-159, 168-169`
**Issue:** The `.catch(() => {})` on all three `audioRef.current.play()` calls silently swallows every error. Errors other than `NotAllowedError` (e.g., invalid audio source, network failure loading the audio blob, browser internal errors) are hidden. This makes debugging audio playback issues impossible without console inspection.

**Fix:** Log the error before swallowing, or at minimum handle known error types explicitly:
```typescript
audioRef.current.play().catch((err) => {
  console.error('Audio playback failed:', err);
  // Re-throw or handle specific errors
});
```

---

### WR-04: No minimum validation on question_count in guidance endpoint

**File:** `backend/app/routers/guidance.py:29`
**Issue:** The `question_count` query parameter is an integer with no `ge=1` (greater than or equal to 1) constraint. Passing `0` or a negative value produces semantically invalid guidance text ("本次面试共 0 道题" or "本次面试共 -3 道题"). While the frontend fallback at `index.tsx:87` (`questionCount || 3`) masks this for the primary flow, the backend accepts any integer value including negative numbers.

**Fix:** Add a Pydantic `Field` constraint:
```python
from pydantic import Field

question_count: int = Query(..., alias="question_count", ge=1)
```

## Info

### IN-01: RedBanner fragile layout coupling via negative margin hack

**File:** `frontend/src/pages/ExamRoom/components/RedBanner.tsx:13-14`
**Issue:** The `marginLeft: -32` and `marginRight: -32` values directly negate the 32px padding from `AppLayout.tsx:32`. If the layout padding ever changes, the banner breaks alignment. This is an implicit, fragile CSS dependency between two components that have no formal relationship.

**Fix:** Either make the banner a full-viewport-width element that sits outside the `Content` container, or pass the offset as a prop.

---

### IN-02: Empty dev dependency group in pyproject.toml

**File:** `backend/pyproject.toml:13`
**Issue:** The `[dependency-groups] dev = []` section is empty. No testing (pytest, httpx), linting (ruff, flake8), or type-checking (mypy) tools are specified. This means CI or any developer running `uv sync --dev` gets nothing. Testing infrastructure is entirely unmanaged.

**Fix:** Add standard development dependencies:
```toml
[dependency-groups]
dev = [
    "pytest>=8.0",
    "httpx>=0.27",
    "ruff>=0.6",
]
```

---

### IN-03: Array index as React key in GuidanceToggle

**File:** `frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx:71`
**Issue:** The `.map()` callback uses `idx` (array index) as the React `key` prop. While acceptable for a static, non-reordered list like guidance paragraphs, it is an anti-pattern that can cause subtle rendering bugs if the list ever changes order or is filtered.

**Fix:** If the guidance text paragraphs ever gain stable IDs, use those instead. For now, this is low risk but worth documenting.

---

### IN-04: Redundant alias parameter in Query definition

**File:** `backend/app/routers/guidance.py:29`
**Issue:** `Query(..., alias="question_count")` specifies an alias that is identical to the Python parameter name `question_count`. The alias is only necessary when the query parameter name differs from the function argument name.

**Fix:** Remove the alias:
```python
question_count: int = Query(...)
```

---

### IN-05: Type assertions instead of runtime validation in API response parsing

**Files:** `frontend/src/api/guidanceApi.ts:17`, `frontend/src/api/ttsApi.ts:14`, `frontend/src/api/questionsApi.ts:9`
**Issue:** All three API modules use TypeScript type assertions (`as Promise<GuidanceResponse>`, `response.arrayBuffer()`, `as Promise<Question[]>`) instead of runtime validation. If the backend API returns data with an unexpected shape, the frontend silently trusts it, potentially causing cryptic errors downstream. For a v1 prototype this is acceptable, but for production reliability, consider a runtime schema validator (zod, valibot, etc.).

---

_Reviewed: 2026-05-23T15:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
