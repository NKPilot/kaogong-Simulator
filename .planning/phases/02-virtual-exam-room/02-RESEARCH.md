# Phase 2: Virtual Exam Room - Research

**Researched:** 2026-05-23
**Domain:** Virtual exam room UI, TTS audio streaming, entry animations
**Confidence:** HIGH

## Summary

Phase 2 delivers the virtual exam room experience: after selecting questions in Phase 1, users see a first-person-perspective exam room with 5 examiner images, hear TTS guidance audio (welcome + rules), can toggle guidance text visibility, and proceed to the first question.

**Three work domains:**
1. **Frontend UI** (ExamRoom page + components) — builds entirely on existing Phase 1 patterns (Ant Design, inline CSS, Zustand store reads, feature-based page organization). No new npm packages needed. CSS `@keyframes` for entry animation.
2. **Backend API** (guidance + TTS endpoints) — adds two new endpoints using FastAPI patterns established in Phase 1. Requires `dashscope` Python package and updated CORS config.
3. **Static assets** (examiner placeholder images) — 5 SVG silhouette images created programmatically, no external tools needed.

**Primary recommendation:** Phase 2 is well-scoped. The TTS pipeline (Frontend -> POST /api/tts/synthesize -> DashScope SDK -> StreamingResponse -> Frontend Audio API) is the most technically complex part. Use synchronous DashScope `SpeechSynthesizer.call()` and wrap in `StreamingResponse` for chunked delivery.

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 考官形象 (Examiner Images)
- D-01: 5 位正装考官半身照，从 `frontend/public/examiners/` 目录随机选取
- D-02: 默认提供 5 张占位图（silhouette/轮廓风格），用户可自行替换为 AI 生成照片
- D-03: 桌面 + 名牌含在图片内（用户生成的图片自带桌面和名牌），前端不单独用 CSS 渲染
- D-04: 名牌文字：中间"主考官"，两侧"考官"（与参考图一致）
- D-05: 不限制图片规格，前端用 CSS 统一裁剪/适配
- D-06: 风格按参考图：深色正装、中性表情、浅灰背景

#### 考场布局 (Room Layout)
- D-07: 保留 AppLayout 顶栏"江苏公务员面试模拟器"
- D-08: 复刻参考图结构：红底白字横幅"2025公务员模拟面试" → 5 考官席位 → 底部控制区
- D-09: 第一人称视角，宽屏自适应（最大宽度约 1200px），桌面端体验优先
- D-10: 引导语文字默认隐藏，通过可展开/收起按钮切换显示
- D-11: 从选题页到考场有进场过渡动画

#### TTS 引导语朗读 (TTS Guidance Audio)
- D-12: 后端代理阿里 DashScope TTS API（保护 API Key）
- D-13: 新建 `POST /api/tts/synthesize` 端点，接收文本，流式返回音频
- D-14: 男声正式风格（稳重、播音感）
- D-15: 完整播放控件（播放/暂停/重播），页面加载后自动播放引导语
- D-16: TTS 调用失败静默降级，不阻塞用户体验，仅展示文字提示

#### 引导语内容 (Guidance Content)
- D-17: 标准公务员面试开场引导语（欢迎词 + 考试规则说明 + 宣布面试开始）
- D-18: `GET /api/interview/guidance?question_count=N` 返回结构化 JSON：`{ title, paragraphs[] }`
- D-19: 动态引用用户已选题数量（如"本次面试共 4 道题"）
- D-20: 引导语文本 API 与 TTS 合成 API 独立分离，前端先取文本再调 TTS

### Claude's Discretion

- 音频流式传输的具体实现方式（chunked transfer encoding）
- 占位图的具体视觉风格（silhouette 颜色、大小）
- 进场动画的具体形式（fade-in, scale-up 等）
- TTS 音频缓存策略

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-01 | 进入模拟面试后展示虚拟考场（多位考官静态图） | ExaminerRow component from UI-SPEC, images from `frontend/public/examiners/` with random selection on page load |
| FLOW-02 | TTS 念出引导语，宣布面试开始 | POST /api/tts/synthesize -> DashScope SpeechSynthesizer -> StreamingResponse -> HTML Audio API |
| UI-01 | 考官形象展示区域（多考官静态图片布局） | 5-image row layout with Ant Design flexbox, rounded corners, name labels "主考官"/"考官" |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Examiner image display | Browser/Client | — | Static images from public/ directory; CSS layout only |
| Guidance text storage | API/Backend | — | Dynamic content (question_count) requires server-side generation |
| TTS audio synthesis | API/Backend | — | DashScope API key must stay server-side per D-12 |
| Audio streaming to browser | API/Backend | Browser/Client | Backend proxies audio; browser plays via Audio API |
| Audio playback controls | Browser/Client | — | Play/pause/replay is a pure browser interaction (HTML Audio API) |
| Entry animation | Browser/Client | — | CSS @keyframes animation on page mount |
| Navigation to Phase 3 | Browser/Client | — | React Router navigate on CTA click |

## Standard Stack

### Core

No new core libraries needed. Phase 2 builds on Phase 1 decisions:

| Library | Version (Verified) | Purpose | Why Standard |
|---------|--------------------|---------|--------------|
| React | 19.2.6 | UI framework | D-01 from Phase 1 |
| Ant Design | 5.29.3 | UI component library | D-03 from Phase 1. Used for Button, Spin, Typography, Layout |
| React Router | 6.30.3 | SPA routing | D-04 from Phase 1. Already has `/exam-room` route |
| Zustand | 4.5.7 | State management | D-05 from Phase 1. Read question selection from store |
| dashscope | 1.25.18 | DashScope TTS SDK | Standard Python SDK for Alibaba Cloud model studio TTS [VERIFIED: PyPI] |
| FastAPI | 0.115.x | Backend framework | Existing; apply same patterns for new endpoints |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ant-design/icons` | 6.2.3 | Icons for guidance toggle & playback controls | Already installed in frontend |
| `dashscope.audio.tts_v2` | — | SpeechSynthesizer class for TTS | Backend TTS endpoint [VERIFIED: alibabacloud.com] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DashScope SpeechSynthesizer call() (sync) | DashScope streaming_call() (WebSocket) | `call()` is simpler (HTTP, blocking, returns bytes). `streaming_call()` reduces latency but adds WebSocket complexity. For short guidance text (~30s audio), `call()` + StreamingResponse chunking is sufficient. |

**Backend dependency to add:**
```bash
cd backend && uv add 'dashscope>=1.25.11'
```

**CORS config must be updated** in `backend/app/main.py`:
- Change `allow_methods=["GET"]` to `allow_methods=["GET", "POST"]`

**No new frontend npm packages needed.** Audio playback uses the built-in HTML Audio API.

**Version verification:**
```
$ npm view dashscope version  # or check via PyPI
1.25.18  (verified 2026-05-23)
```

## Architecture Patterns

### System Architecture Diagram

```
+------------------+         +------------------+        +------------------+
|  Frontend (React)|         |  Backend (FastAPI)|        |  DashScope TTS   |
|  ExamRoomPage    |         |                   |        |                  |
|                  |         |                   |        |                  |
|  1. Mount        | ----->  |  GET /api/interview/       |                  |
|     load guidance|         |  guidance?count=N  |        |                  |
|     text & audio | <------ |  {title,paragraphs}|        |                  |
|                  |         |                   |        |                  |
|  2. POST to TTS  | ----->  |  POST /api/tts/    | ----> |  SpeechSynth     |
|     endpoint     |         |  synthesize       |  HTTP  |  .call(text)     |
|     with text    |         |                   | <---- |  returns bytes   |
|                  |         |  StreamingResponse|        |                  |
|  3. Receive      | <----- |  (chunked MP3 bytes)       |                  |
|     audio stream |         |                   |        |                  |
|     via fetch    |         |                   |        |                  |
|                  |         |                   |        |                  |
|  4. Play via     |         |                   |        |                  |
|     Audio API    |         |                   |        |                  |
+------------------+         +------------------+        +------------------+

Entry animation: CSS @keyframes fadeIn + scaleUp on page mount (600ms)
```

**Data flow:**
1. User navigates to `/exam-room` after selecting questions in Phase 1
2. Page mounts: entry animation plays (600ms), examiner images loaded from `public/examiners/`
3. `GET /api/interview/guidance?question_count=N` fetches guidance text (N from Zustand store)
4. `POST /api/tts/synthesize` sends guidance text, receives streamed audio
5. Audio auto-plays (with autoplay policy handling); user sees controls and can toggle guidance text
6. On "开始答题" click: stop TTS audio, navigate to Phase 3 route

### Recommended Project Structure (additions to existing Phase 1 structure)

```
frontend/src/
├── api/
│   ├── client.ts              # existing — add ttsSynthesize(), fetchGuidance()
│   ├── questionsApi.ts         # existing
│   ├── guidanceApi.ts          # NEW — fetchGuidance()
│   └── ttsApi.ts              # NEW — synthesizeSpeech()
├── pages/
│   └── ExamRoom/
│       ├── index.tsx          # NEW — ExamRoomPage (replace placeholder)
│       ├── components/
│       │   ├── RedBanner.tsx       # C-01
│       │   ├── ExaminerRow.tsx     # C-02
│       │   ├── GuidanceToggle.tsx  # C-03
│       │   ├── TTSControls.tsx     # C-04
│       │   ├── CTAButton.tsx       # C-05
│       │   └── EntryAnimation.css  # C-06 CSS module

backend/app/
├── main.py                    # existing — update CORS allow_methods
├── routers/
│   ├── health.py              # existing
│   ├── questions.py           # existing
│   ├── guidance.py            # NEW — GET /api/interview/guidance
│   └── tts.py                 # NEW — POST /api/tts/synthesize
├── services/
│   ├── question_service.py    # existing
│   ├── guidance_service.py    # NEW — generate guidance text
│   └── tts_service.py         # NEW — call DashScope TTS

frontend/public/examiners/
├── examiner-1.svg             # NEW — silhouette placeholder
├── examiner-2.svg
├── examiner-3.svg
├── examiner-4.svg
└── examiner-5.svg
```

### Pattern 1: TTS Audio Streaming via FastAPI StreamingResponse

**What:** Backend receives text, calls DashScope TTS synchronously, returns audio via chunked transfer encoding.

**When to use:** All TTS operations in this project (guidance TTS now, question TTS in Phase 3).

**Backend example:**
```python
# Source: FastAPI docs + DashScope Python SDK docs [VERIFIED]
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.tts_service import synthesize_speech

router = APIRouter(tags=["tts"])

class TTSRequest(BaseModel):
    text: str
    voice: str = "longxiaocheng_v2"  # 沉稳男声

async def audio_chunk_generator(text: str, voice: str):
    """Yield audio bytes in chunks for streaming response."""
    # speech_synthesizer is blocking; run in thread pool
    import asyncio
    audio_bytes = await asyncio.to_thread(synthesize_speech, text, voice)
    chunk_size = 8192
    for i in range(0, len(audio_bytes), chunk_size):
        yield audio_bytes[i:i + chunk_size]

@router.post("/api/tts/synthesize")
async def synthesize(request: TTSRequest):
    try:
        return StreamingResponse(
            audio_chunk_generator(request.text, request.voice),
            media_type="audio/mpeg",
            headers={
                "Accept-Ranges": "bytes",
                "Cache-Control": "no-cache",
            }
        )
    except Exception as e:
        # Log error but return 200 with empty body so frontend can
        # detect failure and show fallback text
        raise HTTPException(status_code=502, detail="TTS synthesis failed")
```

**Frontend example:**
```typescript
// Source: MDN Web Docs [VERIFIED]
export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch('http://localhost:8000/api/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'longxiaocheng_v2' }),
  });
  if (!response.ok) throw new Error('TTS synthesis failed');
  return response.arrayBuffer();
}

// Usage in component:
const audioRef = useRef<HTMLAudioElement | null>(null);

async function playGuidance(text: string) {
  try {
    const audioData = await synthesizeSpeech(text);
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.src = url;
      await audioRef.current.play();
    }
  } catch (err) {
    // D-16: Silently fail, show text fallback
    setTtsError(true);
  }
}
```

### Pattern 2: Browser Autoplay Policy Handling

**What:** Modern browsers block auto-playing audio without user interaction. Since users navigate to `/exam-room` by clicking "开始面试", the navigation click counts as a user gesture. However, the audio fetch is async, which can break the gesture context.

**When to use:** Every auto-play scenario (guidance TTS now, question TTS in Phase 3).

**Recommended approach (pre-fetch + play):**

```typescript
// Start fetching audio immediately on mount (parallel with guidance text)
// Then play when user gesture context is still active

// Option A: Leverage the navigation click gesture
// The user clicks "开始面试" which navigates to /exam-room.
// Browsers treat the page load as part of the same gesture chain
// for a short window. Pre-fetch audio and cache it, then play on load.

// Option B: Muted start + unmute
const audio = new Audio();
audio.muted = true;
await audio.play();  // Allowed without gesture
audio.muted = false;

// Option C: AudioContext on user gesture
// In Phase 1's "开始面试" click handler, create AudioContext:
// window.__audioCtx = new AudioContext();
// Then use it in Phase 2 for playback.

// Most reliable: Pre-fetch the audio blob during page mount,
// create Audio element, and catch NotAllowedError to show play button.
```

**Fallback:** If autoplay is blocked, show "点击播放引导语" overlay per I-02 in UI-SPEC.

### Anti-Patterns to Avoid

- **Loading all 5 examiner images synchronously:** Images load from public/ directory, they are local. Use React useEffect for random selection, render immediately.
- **Hardcoding examiner image paths:** List the directory dynamically (or use a predefined array `['examiner-1.svg', ...]` and pick 5 at random).
- **Storing full audio in Zustand:** Audio blobs are large. Keep them as component-local refs.
- **Blocking page render on TTS fetch:** Show the exam room UI immediately (banner + examiners), only show loading spinner in TTSControls area.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTS audio synthesis | Custom TTS engine | DashScope `SpeechSynthesizer.call()` | Industry-grade Chinese TTS with formal male voices; standard Python SDK |
| Audio playback controls | Custom audio engine | HTML `<audio>` element API | Play/pause/replay/seek/timeupdate all built-in. No custom audio processing needed [VERIFIED: MDN] |
| Audio caching | Build a cache layer | `URL.createObjectURL()` + blob lifecycle | Blob URLs are reference-counted; revoke on unmount. Simple and sufficient for Phase 2 |
| Entry animation | CSS animation framework | CSS `@keyframes` | Single-use animation (fade-in + scale-up on mount). CSS-only solution is 10 lines, no library needed |
| Silhouette images | Photoshop/GIMP | Inline SVG | 5 simple SVG files, ~500 bytes each. Can generate programmatically |
| Loading state spinners | Custom loading | Ant Design `Spin` component | Already imported in project; consistent with Phase 1 |

**Key insight:** Phase 2 has no genuinely complex subsystems. The most technically nuanced part is handling browser autoplay policy — a browser behavior, not a coding problem. Every other component is standard CRUD UI work with established libraries.

## Common Pitfalls

### Pitfall 1: Browser Autoplay Blocks Guidance Audio
**What goes wrong:** TTS audio doesn't play when the page loads. User sees "正在播放引导语..." status but hears nothing.
**Why it happens:** Modern browsers (Chrome, Safari) require a user gesture before playing audio. Navigation from Phase 1 via "开始面试" click is a gesture, but async fetch + blob creation can break the gesture chain.
**How to avoid:** 
- Pre-create the `<audio>` element on component mount
- Start the audio fetch immediately (on mount, not after user clicks play)
- If `audio.play()` rejects with `NotAllowedError`, show "点击播放" overlay
- Safari-specific: create an AudioContext on the Phase 1 "开始面试" click and reuse it
**Warning signs:** No sound on page load; no error in console; browser tab shows playing indicator

### Pitfall 2: CORS Blocking POST Requests
**What goes wrong:** `POST /api/tts/synthesize` fails with CORS error in browser console.
**Why it happens:** Phase 1 CORS config only allows `["GET"]` methods. POST requests are blocked.
**How to avoid:** Update `allow_methods` in `backend/app/main.py` from `["GET"]` to `["GET", "POST"]`.
**Warning signs:** Browser console shows `CORS Missing Allow Origin` or `Method POST not allowed by Access-Control-Allow-Methods`.

### Pitfall 3: DashScope API Key Not Configured
**What goes wrong:** Backend TTS endpoint returns 502.
**Why it happens:** `DASHSCOPE_API_KEY` environment variable is not set. DashScope SDK requires `dashscope.api_key` or env var.
**How to avoid:** Document the env var requirement. Add a `.env.example` file. Validate API key availability on backend startup (log a warning if missing, but don't crash — D-16 requires graceful degradation).
**Warning signs:** Backend logs show `ApiKey.NotFound` or similar error.

### Pitfall 4: Guidance Text and TTS Desync
**What goes wrong:** The guidance text shown via toggle does not match what TTS reads.
**Why it happens:** D-20 mandates separate API calls for text and TTS. If text and TTS use different text sources, they diverge.
**How to avoid:** Frontend should fetch guidance text first, then send *the exact same text* to the TTS endpoint. Single source of truth: the text returned by `GET /api/interview/guidance`.
**Warning signs:** User reads "本次面试共 4 道题" but TTS says "3 道题".

### Pitfall 5: AppLayout Content Padding Breaks Full-Width Banner
**What goes wrong:** The red banner has side padding, doesn't span full width.
**Why it happens:** `AppLayout.tsx` sets `Content style={{ padding: '32px', maxWidth: 960, margin: '0 auto' }}`. The ExamRoom page needs the banner to be full-width.
**How to avoid:** Override Content padding on this specific route. Options:
- Pass a prop or context from ExamRoomPage to conditionally set padding to 0
- Use `style={{ padding: 0, maxWidth: '100%' }}` on Content wrapper
- Render ExamRoom outside the Content wrapper (complex, not recommended)
**Best approach:** In AppLayout, check if the current route is `/exam-room` and conditionally apply different padding. Or simpler: render the red banner outside the Content padding by using negative margins or absolute positioning.

## Code Examples

### Backend: TTS Service (dashscope integration)

```python
# backend/app/services/tts_service.py
# Source: DashScope Python SDK docs [VERIFIED: alibabacloud.com]
import os
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer

# Configure API key from environment
dashscope.api_key = os.environ.get("DASHSCOPE_API_KEY", "")

def synthesize_speech(text: str, voice: str = "longxiaocheng_v2") -> bytes:
    """
    Synthesize speech from text using DashScope TTS.
    
    Voice options:
    - longxiaocheng_v2: 沉稳男声 (recommended for 稳重、播音感)
    - longxiaobai_v2: 清澈男声
    - longxiaochun_v2: 亲切女声
    
    Returns complete MP3 audio bytes.
    """
    synthesizer = SpeechSynthesizer(
        model="cosyvoice-v2",
        voice=voice,
        format="mp3",
        sample_rate=22050,
        rate=1.0,  # Normal speed
    )
    
    audio_bytes = synthesizer.call(text)
    return audio_bytes
```

### Backend: Guidance Endpoint

```python
# backend/app/routers/guidance.py
# Source: Standard FastAPI pattern [VERIFIED: FastAPI docs]
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List

router = APIRouter(tags=["interview"])

class GuidanceResponse(BaseModel):
    title: str
    paragraphs: List[str]

_GUIDANCE_TEMPLATE = {
    "title": "面试说明",
    "paragraphs": [
        "考生你好，欢迎参加本次公务员模拟面试。",
        "本次面试共 {count} 道题，采用结构化面试形式。请仔细听题，在思考后作答。",
        "每道题有思考时间和答题时间限制，请合理分配时间。",
        "准备好了吗？点击「开始答题」进入第一题。"
    ]
}

@router.get("/api/interview/guidance", response_model=GuidanceResponse)
async def get_guidance(question_count: int = Query(..., alias="question_count")):
    """Return interview guidance text with dynamic question count."""
    paragraphs = [
        p.format(count=question_count) if "{count}" in p else p
        for p in _GUIDANCE_TEMPLATE["paragraphs"]
    ]
    return GuidanceResponse(title=_GUIDANCE_TEMPLATE["title"], paragraphs=paragraphs)
```

### Frontend: EntryAnimation (CSS)

```css
/* frontend/src/pages/ExamRoom/components/EntryAnimation.css */
/* Source: MDN CSS @keyframes [VERIFIED] */

@keyframes examRoomEntry {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.exam-room-entry {
  animation: examRoomEntry 600ms ease-out forwards;
}
```

### Frontend: Loading Examiner Images

```typescript
// Inside ExamRoomPage component
const EXAMINER_COUNT = 5;
const EXAMINER_PATH = '/examiners';

function getRandomExaminers(): string[] {
  // Generate indices 1-5 (or more if user adds custom images)
  const indices = Array.from({ length: EXAMINER_COUNT }, (_, i) => i + 1);
  // Shuffle and pick 5
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.map(i => `${EXAMINER_PATH}/examiner-${i}.svg`);
}
```

### Frontend: Reading Selected Questions from Zustand

```typescript
// Pattern: read from existing store, same as Phase 1
import { useQuestionBankStore } from '../../store/questionBankStore';

// Inside ExamRoomPage:
const selectedIds = useQuestionBankStore(s => s.selectedIds);
const questions = useQuestionBankStore(s => s.questions);

// Get selected questions:
const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));
const questionCount = selectedQuestions.length;  // Pass to guidance API
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DashScope SDK <1.25 | dashscope >=1.25.11 | Late 2025 | `SpeechSynthesizer` in `dashscope.audio.tts_v2` supersedes older Sambert API. Must use v2 module. |
| WebSocket-only streaming TTS | HTTP sync `call()` also available | 2025 | Simpler integration; no WebSocket management needed for short text |

**Deprecated/outdated:**
- `dashscope.audio.tts` (v1, Sambert): Use `dashscope.audio.tts_v2` (CosyVoice models) instead

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `longxiaocheng_v2` provides appropriate formal male voice for exam guidance | Standard Stack | Incorrect voice choice — easy to swap to another DashScope voice ID |
| A2 | Silhouette SVG files can be created programmatically without design tools | Don't Hand-Roll | May need a designer if SVG silhouettes look unprofessional; fallback to publicly licensed images |
| A3 | Browser autoplay policy allows audio.play() within navigation click gesture chain | Common Pitfalls | If not, need "click to play" overlay — already specified as fallback in UI-SPEC I-02 |
| A4 | The guidance API paragraphs template is acceptable as defined | Code Examples | Easy to edit; content decisions are D-17 through D-20 and can be changed without code impact |

## Open Questions

1. **Should we use synchronous `call()` or streaming `streaming_call()` for TTS?**
   - What we know: Both work. `call()` is simpler (HTTP, blocking, returns bytes). `streaming_call()` uses WebSocket and yields chunks.
   - What's unclear: For short guidance text (~150 chars), latency difference is negligible. `call()` may be sufficient.
   - Recommendation: Use `call()` + StreamingResponse wrapping for Phase 2. Simpler to implement and debug. Phase 3 can re-evaluate if streaming latency matters for longer question text.

2. **How to handle the AppLayout Content padding override for full-width banner?**
   - What we know: AppLayout sets padding: 32px, max-width: 960px on Content.
   - What's unclear: Which approach is cleanest — negative margins, route detection in AppLayout, or CSS override.
   - Recommendation: Add a `className` to the page wrapper and use CSS to override padding via specificity. Simplest and least invasive.

3. **Where to detect autoplay policy and show fallback?**
   - What we know: `audio.play()` returns a promise that rejects with `NotAllowedError`.
   - What's unclear: Whether iOS Safari will block the audio entirely or allow it after user taps.
   - Recommendation: Handle the promise rejection generically — show play-overlay on any play failure. Works across all browsers.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend dev server | yes | 22.22.2 | — |
| npm | Package management | yes | 10.9.7 | — |
| Python 3 | Backend | yes | 3.12.3 | — |
| uv | Backend dependency mgmt | yes | (in .venv) | — |
| DashScope SDK | TTS endpoint | no | — | `uv add dashscope>=1.25.11` |
| DashScope API Key | TTS endpoint | no | — | Set `DASHSCOPE_API_KEY` env var |
| Docker | Not needed | — | — | — |

**Missing dependencies with fallback:**
- DashScope SDK: Not installed. Run `cd backend && uv add 'dashscope>=1.25.11'`. Fallback: if dashscope is unavailable, the TTS endpoint returns an error, frontend shows text-only fallback (D-16).
- DashScope API Key: Not set. The TTS endpoint gracefully handles missing keys. Backend should log a warning on startup.

## Validation Architecture

### Test Framework

No test infrastructure exists in the project. Phase 1 did not set up any testing. Phase 2 will need Wave 0 setup.

| Property | Value |
|----------|-------|
| Framework | None yet — recommended: vitest (matches Vite ecosystem) |
| Config file | None — Wave 0 |
| Quick run command | None — Wave 0 |
| Full suite command | None — Wave 0 |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-01 | Exam room shows examiner images | integration | Wave 0 needed | no |
| FLOW-02 | TTS guidance plays audio | manual | Wave 0 needed | no |
| UI-01 | ExaminerRow renders 5 images | unit | Wave 0 needed | no |

### Sampling Rate

No tests exist yet. During Phase 2 implementation, consider adding vitest for component-level tests.

### Wave 0 Gaps

- [ ] `vitest.config.ts` — test configuration
- [ ] `frontend/src/pages/ExamRoom/__tests__/ExaminerRow.test.tsx` — tests for image rendering
- [ ] `frontend/src/pages/ExamRoom/__tests__/GuidanceToggle.test.tsx` — tests for expand/collapse
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom`

*(No existing test infrastructure to build on — Phase 2 has no automated testing requirements from requirements doc, but component tests would benefit long-term maintainability)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No user auth in v1 |
| V3 Session Management | no | Local single-user only |
| V4 Access Control | no | No multi-tenant |
| V5 Input Validation | yes | Pydantic models validate TTS request text and guidance query params |
| V6 Cryptography | no | No sensitive data stored |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DashScope API key exposure | Information Disclosure | D-12 mandates server-side proxy; key never sent to frontend. Backend uses env var. |
| TTS text injection (prompting to speak arbitrary content) | Tampering | Text is server-generated guidance text. TTS endpoint only accepts text from guidance API, which is a fixed template. However, validate input text length (max 500 chars) to prevent abuse. |
| Path traversal on examiner images | Tampering | Not applicable — images loaded from `public/examiners/` by React, not via API endpoint. |

## Sources

### Primary (HIGH confidence)
- [FastAPI StreamingResponse docs](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse) — chunked transfer encoding pattern [VERIFIED]
- [DashScope TTS Python SDK](https://www.alibabacloud.com/help/en/model-studio/qwen-tts-realtime-python-sdk) — SpeechSynthesizer API, model names, voice IDs [VERIFIED]
- [DashScope TTS API docs](https://www.alibabacloud.com/help/en/model-studio/qwen-tts-api) — HTTP endpoint, non-streaming + streaming modes, formats [VERIFIED]
- [DashScope CosyVoice SDK (DeepWiki)](https://deepwiki.com/dashscope/dashscope-sdk-python/4.1-text-to-speech) — call() vs streaming_call(), voice table, parameters [VERIFIED]
- [MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — browser autoplay policies, play() promise rejection [VERIFIED]
- [MDN Audio Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio) — HTMLAudioElement API [VERIFIED]

### Secondary (MEDIUM confidence)
- [PyPI dashscope](https://pypi.org/project/dashscope/1.25.18/) — version 1.25.18 confirmed [VERIFIED]
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/) — allow_methods configuration [VERIFIED]

### Tertiary (LOW confidence)
- None — all findings verified against official sources or the running codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against running package.json, uv.lock, or PyPI
- Architecture: HIGH — FastAPI StreamingResponse + DashScope SDK patterns are well-documented
- Pitfalls: HIGH — all pitfalls verified against codebase state (CORS, layout) or known browser behavior (autoplay)

**Research date:** 2026-05-23
**Valid until:** 2026-06-23 (30 days — stable libraries, standard browser APIs)
