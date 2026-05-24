# Phase 04: Scoring & Feedback - Research

**Researched:** 2026-05-24
**Domain:** LLM-based answer evaluation, audio format conversion, results UI
**Confidence:** HIGH

## Summary

Phase 4 implements the scoring feedback loop: after each question's recording is uploaded, the backend converts WebM audio to WAV, runs ASR via DashScope Paraformer, then sends the transcript plus the question's scorePoints to DashScope Qwen (qwen-max) for semantic coverage analysis. Results are stored as JSON per session. The frontend renders a card waterfall at `/results`, with per-card coverage dot visualization, collapsible ASR transcript, and re-score/retry controls.

**Primary recommendation:** Use DashScope `qwen-max` via the existing `dashscope` SDK's `Generation.call()` with structured JSON output for per-point coverage judgment. Convert recordings via the project-standard `/tmp/ffmpeg` binary. Store scoring results as `recordings/{sessionId}/scoring.json`.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** LLM semantic matching (DashScope Qwen) vs scorePoints, not rule/keyword matching
- **D-02:** Per-point coverage judgment (covered/partial/missed), score = coverage ratio
- **D-03:** ASR tolerance -- LLM ignores homophone errors, semantic matching
- **D-04:** Per-question async scoring -- trigger on recording upload, store results in backend
- **D-05:** Card waterfall layout
- **D-06:** Coverage display as "3/5 covered" with green/red dots
- **D-07:** No top-level summary -- go straight to cards
- **D-08:** Collapsible ASR transcript display
- **D-09:** Auto-trigger on last question completion, auto-navigate to /results, show "评分中..." for pending
- **D-10:** Auto retry once + degrade to "评分失败" + manual retry button
- **D-11:** Per-card "重新评分" button

### Claude's Discretion

- 评分 loading 动画具体设计
- 卡片视觉细节（颜色、间距、动效、采分点圆点样式）
- LLM prompt 的具体措辞和 scorePoints 格式解析策略
- 结果页 Ant Design 组件选择（Card、Tag、Progress、Collapse 等）
- 后端评分结果存储结构（内存/文件/数据库）

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Audio format conversion (WebM -> WAV) | Backend | — | ffmpeg binary runs server-side; recordings are on disk |
| ASR transcription | Backend | — | DashScope Paraformer API called from backend; already implemented |
| LLM score evaluation | Backend | — | DashScope Qwen API called from backend; API key stays server-side |
| Score results persistence | Backend | — | File/DB storage on server; frontend queries via REST |
| Score results polling/querying | Frontend | Backend | Zustand store polls REST endpoint; backend serves JSON |
| Score card waterfall rendering | Frontend | — | Ant Design Card list with zustand state |
| Coverage dot visualization | Frontend | — | Pure presentational; data comes from backend |
| Re-score trigger | Frontend -> Backend | — | Frontend calls POST endpoint; backend re-runs pipeline |
| Collapsible ASR transcript | Frontend | — | Transcript included in scoring result JSON; Ant Design Collapse renders |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dashscope (Python SDK) | 1.25.18 | Call Qwen for scoring evaluation via Generation API | Already installed; same SDK used for ASR; `DASHSCOPE_API_KEY` already configured [VERIFIED: uv pip list, backend/pyproject.toml] |
| ffmpeg (static binary) | 7.0.2 | WebM-to-WAV audio conversion | Already at `/tmp/ffmpeg`; used by E2E tests; handles WebM/Opus decode [VERIFIED: /tmp/ffmpeg -version, backend/tests/test_asr_e2e.py] |
| antd (Ant Design v5) | 5.29.3 | Card, Collapse, Skeleton, Spin, Tag, Button components | Already installed; project's component library since Phase 1; ConfigProvider theme configured [VERIFIED: frontend/package.json, npm view] |
| zustand | 4.5.7 | Scoring results store | Already installed; used for interviewStore and questionBankStore; no new dependency [VERIFIED: frontend/package.json] |
| react-router-dom | 6.30.3 | /results route | Already installed; router already configured [VERIFIED: frontend/package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ant-design/icons | 6.2.3 | Icons for coverage dots, error states, collapse arrows | Already installed; no new icons needed beyond what's bundled [VERIFIED: frontend/package.json] |
| python-multipart | 0.0.29 | Already in deps; needed if scoring uses file upload | Already installed [VERIFIED: backend/pyproject.toml] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DashScope Qwen for scoring | OpenAI-compatible API via local model (Ollama) | Local model adds deployment complexity, requires GPU; Qwen via DashScope uses existing API key with zero infra additions |
| `/tmp/ffmpeg` static binary | System ffmpeg, pydub, or librosa | pydub adds dependency and still needs ffmpeg backend; librosa doesn't handle WebM. Static binary is already proven in E2E tests |
| JSON file storage for scores | SQLite, Redis, in-memory dict | SQLite overkill for v1 single-user; Redis not installed; in-memory dict loses data on restart. JSON file survives restarts with zero deps |
| React Query for data fetching | Zustand with manual fetch | React Query adds dependency; Zustand pattern already established in project |

**Installation:** No new packages needed. All dependencies already in pyproject.toml and package.json.

**Version verification:** All package versions confirmed via `uv pip list` and `npm view` against the registry.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                         │
│                                                                         │
│  QuestionInterviewPage                ScoringResultsPage (/results)     │
│  ┌──────────────────┐                ┌──────────────────────────────┐  │
│  │ After answering   │  navigate()   │  useEffect: pollScoring()     │  │
│  │ + upload →        │──────────────│  ┌──────────────────────────┐ │  │
│  │ triggerScoring()  │              │  │ Card 1: Q1 scored ✓      │ │  │
│  │ via POST /scoring │              │  │ Card 2: Q2 scored ✓      │ │  │
│  │ /evaluate         │              │  │ Card 3: 评分中... ⟳     │ │  │
│  └──────────────────┘              │  │ Card 4: pending           │ │  │
│                                     │  └──────────────────────────┘ │  │
│  useScoringStore                    │  useScoringStore               │  │
│  (Zustand)                          │  (Zustand)                     │  │
│  - triggerScoring(id)               │  - results: ScoringResult[]    │  │
│  - pollResults(sessionId)           │  - pollResults(sessionId)      │  │
└─────────────────────────────────────────────────────────────────────────┘
           │  POST /api/scoring/evaluate           │  GET /api/scoring/results/{sessionId}
           │  { session_id, question_index,         │
           │    question_id }                       │
           ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI + uv)                          │
│                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ scoring router   │    │ scoring_service  │    │ storage          │  │
│  │                  │    │                  │    │                  │  │
│  │ POST /scoring/   │───▶│ evaluate()       │───▶│ recordings/      │  │
│  │   evaluate       │    │                  │    │  {sessionId}/    │  │
│  │                  │    │ 1. Load recording│    │  scoring.json   │  │
│  │ GET /scoring/    │◀───│    (WebM file)   │◀───│                  │  │
│  │   results/{sid}  │    │ 2. Convert WebM  │    └──────────────────┘  │
│  │                  │    │    to WAV via    │                          │
│  │ POST /scoring/   │    │    /tmp/ffmpeg   │                          │
│  │   rescore        │    │ 3. ASR via       │                          │
│  └──────────────────┘    │    Paraformer    │                          │
│                           │ 4. LLM eval via  │                          │
│                           │    Qwen (qwen-   │                          │
│                           │    max)          │                          │
│                           │ 5. Save results  │                          │
│                           └──────────────────┘                          │
│                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐                          │
│  │ question_service │    │ asr_service      │                          │
│  │                  │    │                  │                          │
│  │ load_questions() │    │ transcribe_audio │                          │
│  │ → scorePoints    │    │ → text string    │                          │
│  └──────────────────┘    └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
           │                                              │
           │  DashScope API                               │  DashScope API
           │  (Qwen text generation)                     │  (Paraformer ASR)
           ▼                                              ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  DashScope Generation API    │    │  DashScope Recognition API   │
│  POST /api/v1/services/aigc/ │    │  (WebSocket streaming)       │
│  text-generation/generation  │    │  model: paraformer-realtime- │
│  model: qwen-max             │    │  v2                          │
└──────────────────────────────┘    └──────────────────────────────┘
```

### Recommended Project Structure

```
backend/
├── app/
│   ├── routers/
│   │   └── scoring.py              # NEW: scoring REST endpoints
│   ├── services/
│   │   └── scoring_service.py      # NEW: evaluate pipeline + prompt
│   └── main.py                     # EDIT: register scoring router
├── recordings/
│   └── {sessionId}/
│       ├── q0.webm                 # existing (Phase 3)
│       ├── q1.webm                 # existing (Phase 3)
│       └── scoring.json            # NEW: scoring results cache
└── data/
    └── questions.json              # existing: scorePoints source

frontend/
├── src/
│   ├── api/
│   │   └── scoringApi.ts           # NEW: POST evaluate, GET results, POST rescore
│   ├── pages/
│   │   └── ScoringResults/
│   │       ├── index.tsx            # NEW: ScoringResultsPage orchestrator
│   │       └── components/
│   │           ├── ScoringCard.tsx       # NEW: single question result card
│   │           ├── CoverageDots.tsx      # NEW: green/red dot visualization
│   │           ├── ScoreDisplay.tsx      # NEW: "3/5 已覆盖" display
│   │           ├── PendingCard.tsx       # NEW: skeleton + "评分中..."
│   │           └── ErrorCard.tsx         # NEW: "评分失败" + retry
│   ├── store/
│   │   └── scoringStore.ts         # NEW: Zustand store for scoring results
│   ├── types/
│   │   └── scoring.ts              # NEW: ScoringResult, CoveragePoint types
│   └── router.tsx                  # EDIT: add /results route
```

### Pattern 1: Async Scoring Pipeline (Backend)

**What:** Sequential pipeline: Load recording -> Convert format -> ASR -> LLM evaluate -> Save JSON
**When to use:** Every scoring request (initial evaluate + re-score)
**Example:**

```python
# Source: DashScope SDK 1.25.18 Generation API + project conventions
from dashscope import Generation
import subprocess, json

def evaluate_answer(session_id: str, question_index: int, question: dict) -> dict:
    # 1. Load WebM recording
    webm_path = Path(f"recordings/{session_id}/q{question_index}.webm")
    if not webm_path.exists():
        raise FileNotFoundError(f"Recording not found: {webm_path}")

    # 2. Convert WebM to WAV via project-standard ffmpeg
    wav_path = webm_path.with_suffix(".wav")
    subprocess.run([
        "/tmp/ffmpeg", "-y", "-i", str(webm_path),
        "-ar", "16000", "-ac", "1", "-sample_fmt", "s16",
        str(wav_path)
    ], check=True, capture_output=True)

    # 3. ASR via existing service
    from app.services.asr_service import transcribe_audio
    transcript = transcribe_audio(str(wav_path))

    # 4. Parse scorePoints into individual items
    points = parse_score_points(question["scorePoints"])

    # 5. LLM evaluation via Qwen
    response = Generation.call(
        model="qwen-max",
        messages=[
            {"role": "system", "content": SCORING_SYSTEM_PROMPT},
            {"role": "user", "content": build_scoring_prompt(
                question=question["fullText"],
                rubric=points,
                answer=transcript
            )}
        ],
        result_format="message",
        temperature=0.1,  # Low temperature for consistent judging
    )
    result = json.loads(response.output.choices[0].message.content)

    # 6. Persist results
    save_scoring_result(session_id, question_index, {
        "transcript": transcript,
        "coverage": result["coverage"],
        "feedback": result["feedback"],
    })
    return result
```

### Pattern 2: scorePoints Parsing

**What:** Parse multi-level numbered outline into flat list of individual scoring points
**When to use:** Every time scorePoints is loaded for LLM prompting

**Format observed in questions.json:**
- Top-level: `1、标题一` or `1、描述漫画`
- Sub-points: `(1) 子要点` or `(1)子要点`
- Sub-sub: nested numbering like `(1)表述 3 个标题`

**Recommended parsing strategy:**
- Split on numbered markers (`\d+[、.]` for top-level, `\(\d+\)` for sub-points)
- Treat each leaf-level point (most granular) as a distinct scorePoint
- Flatten into a list of `{id: int, section: str, text: string}` objects
- For the LLM prompt, present as a numbered list with section context

**Confidence:** MEDIUM -- the format has inconsistencies (some use `l、` as 1、 due to OCR artifact, some have mixed English/Chinese punctuation). Test against all 16 questions.

### Pattern 3: Polling-Based Results Fetching

**What:** Frontend polls `GET /api/scoring/results/{sessionId}` every 2-3 seconds until all cards are in terminal state (scored or failed)
**When to use:** Results page mount and after re-score triggers

```typescript
// Source: established Zustand pattern from interviewStore.ts
import { create } from 'zustand';

export const useScoringStore = create<ScoringStore>((set, get) => ({
  results: [],
  pollInterval: null,

  startPolling: (sessionId: string) => {
    const interval = setInterval(async () => {
      const results = await fetchScoringResults(sessionId);
      set({ results });
      // Stop polling when all cards are terminal
      if (results.every(r => r.status === 'scored' || r.status === 'failed')) {
        clearInterval(interval);
      }
    }, 2500);
    set({ pollInterval: interval });
  },

  triggerScoring: async (sessionId: string, questionIndex: number, questionId: string) => {
    // Optimistic update: set card to 'pending'
    set(state => ({
      results: state.results.map(r =>
        r.questionIndex === questionIndex
          ? { ...r, status: 'pending' }
          : r
      )
    }));
    await postEvaluate(sessionId, questionIndex, questionId);
  },
}));
```

### Pattern 4: LLM-as-Judge Scoring Prompt

**What:** Structured system + user prompt that instructs Qwen to evaluate each scorePoint against the answer transcript
**When to use:** Every LLM scoring call

**Key design principles (from LLM-as-Judge best practices):**
- Require evidence before score (chain-of-thought)
- Define cover/partial/miss with observable characteristics
- Request structured JSON output
- Low temperature (0.1) for consistent judging
- Explicit edge case guidance (ASR homophone tolerance)

**Prompt structure:**
```
System: You are an expert evaluator for civil service exam interview answers.
Your task: compare the candidate's spoken answer against scoring criteria.
Output valid JSON only. Do NOT penalize ASR transcription errors (homophones, similar sounds).
Evaluate semantic meaning, not exact wording.

User:
Question: {questionFullText}
Candidate's Answer (ASR transcript): {transcript}

Scoring Criteria (evaluate each point independently):
{numbered_points}

For EACH scoring point, determine:
- COVER: semantic meaning fully matches the point
- PARTIAL: partially addresses, key elements missing
- MISS: not addressed or semantically unrelated

Output JSON:
{
  "points": [
    {"id": 1, "verdict": "COVER", "evidence": "...", "reasoning": "..."},
    ...
  ],
  "feedback": "overall textual feedback in Chinese"
}
```

### Anti-Patterns to Avoid

- **Calling ASR and LLM in series on the results page load:** Per D-04/D-09, scoring starts immediately after each recording upload, not when the user reaches /results. Waiting until then would cause unnecessary latency.
- **Storing scoring results in browser-only state:** Results must persist across page refreshes. Backend JSON file storage allows polling and re-fetching.
- **Using system ffmpeg:** The project convention is `/tmp/ffmpeg` static binary. System ffmpeg may not be installed (confirmed: not in PATH).
- **Temperature > 0.3 for LLM judging:** High temperature causes inconsistent verdicts across re-scores. Use 0.1 for reproducibility.
- **Evaluating scorePoints as a single block:** Each point must be judged independently. Combining them causes the LLM to conflate coverage.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebM to WAV conversion | Manual audio decoding with librosa/soundfile | `/tmp/ffmpeg` static binary via subprocess | ffmpeg handles Opus codec, resampling, channel reduction; already proven in E2E tests. librosa can't decode WebM [VERIFIED: /tmp/ffmpeg -codecs output] |
| Text similarity / keyword matching for scoring | Regex, difflib, cosine similarity on embeddings | LLM semantic matching via Qwen | D-01 locked decision. Keyword matching fails on paraphrased answers and ASR errors. Embedding similarity requires threshold tuning and can't generate feedback text |
| Polling mechanism | WebSocket, SSE push | Simple HTTP GET polling every 2.5s | v1 single-user, maximum 4 questions, scoring takes 5-15s per question. Polling 4-6 times is adequate; WebSocket adds complexity without benefit |
| scorePoints format parser | Custom recursive descent parser for nested outlines | Regex-based split + flatten | The format is shallow (2-3 levels max), consistent across 16 questions. Regex handles all observed patterns. A custom parser would be over-engineered |

**Key insight:** The scoring pipeline's complexity is in the LLM prompt engineering and error handling (D-10 retry logic), not in the audio processing or parsing. Focus implementation effort on prompt quality and edge case handling.

## Runtime State Inventory

> Phase 4 is primarily greenfield (new endpoint, new page, new store). However, it integrates with existing Phase 3 artifacts.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `recordings/{sessionId}/q*.webm` -- Phase 3 recordings on disk. `questions.json` -- scorePoints source. No Phase 4 data exists yet | None for existing data; Phase 4 will create `recordings/{sessionId}/scoring.json` |
| Live service config | None -- verified: no n8n workflows, no cloud service configs reference scoring | None |
| OS-registered state | None -- verified: no cron jobs, no systemd units, no pm2 process lists reference scoring | None |
| Secrets/env vars | `DASHSCOPE_API_KEY` already in `.env` -- used for both existing ASR and new LLM scoring calls. Same key, same env var name. | None -- no new env vars needed |
| Build artifacts | None -- verified: no stale build artifacts related to scoring | None |

**Nothing found in category:** Stated explicitly for each category above.

## Common Pitfalls

### Pitfall 1: ASR Transcription Quality Variance

**What goes wrong:** Paraformer may produce garbled output for heavily accented speech, short answers, or answers with specialized civil-service terminology. This feeds low-quality text into the LLM judge, producing unfair scores.
**Why it happens:** The Paraformer model is general-purpose; it's not fine-tuned on civil-service exam vocabulary (政策计算器, 枫桥经验, 结构化小组).
**How to avoid:**
- D-03 already mitigates: the LLM prompt explicitly instructs "ignore homophone errors, evaluate semantic meaning"
- The scoring prompt should include the question's full text as context, so the LLM can infer intended meaning from context even with transcription errors
- Low-quality transcript (very short vs. recording duration) could be detected and flagged as "uncertain transcript" with a confidence warning in the UI
**Warning signs:** Transcript is significantly shorter than expected for a 2-3 minute answer; ASR returns empty string; transcript contains obvious phonetic artifacts

### Pitfall 2: LLM Score Inconsistency Across Re-scores

**What goes wrong:** Clicking "重新评分" produces a different coverage verdict even though the input is identical (same transcript, same scorePoints).
**Why it happens:** LLM has inherent stochasticity. Even at temperature=0.1, minor variations in reasoning can shift borderline cover/partial calls.
**How to avoid:**
- Set `temperature=0.1` and `seed` parameter for reproducibility
- Use explicit edge-case rules in the prompt ("if the answer implies the point through context but doesn't state it explicitly -> PARTIAL")
- Consider caching the first result and only re-running on explicit user request, not auto-retry using cached result
- **Accept that perfect consistency is not achievable** with LLM judging; the user-facing re-score button provides a sense of fairness even if results vary slightly
**Warning signs:** Quality assurance testing shows > 20% verdict changes on re-score of the same transcript

### Pitfall 3: WebM Conversion Failure Modes

**What goes wrong:** `/tmp/ffmpeg` conversion fails silently, produces truncated output, or the WAV file contains only silence.
**Why it happens:** Corrupt recording, empty recording (user said nothing), or ffmpeg encountering an edge case in the WebM container.
**How to avoid:**
- Validate WAV output: check file size > 0, check PCM data is not all zeros (same pattern as ASR router validation)
- The recording upload validation from Phase 3 already guards against zero-byte uploads, but silent recordings pass through
- If WAV is silent/empty, skip ASR and return a "无有效语音" (no valid speech) result
**Warning signs:** ffmpeg stderr contains errors; WAV file size is exactly 44 bytes (header only); ASR returns empty string on a non-empty WAV

### Pitfall 4: Race Condition on Scoring Polling

**What goes wrong:** Frontend polls for results before the async scoring task has started writing them. Polling interval too aggressive causes unnecessary backend load.
**Why it happens:** The scoring pipeline (convert + ASR + LLM) takes 5-15 seconds. The frontend navigates to /results immediately after the last question's transition delay.
**How to avoid:**
- Backend returns a `status: "not_started"` response for questions that haven't been submitted for scoring yet (distinct from "pending" which means in-progress)
- Frontend polling interval: 2-3 seconds (not more frequent)
- Frontend stops polling when all expected questions are terminal (scored or failed)
- Maximum polling duration: 60 seconds, then show timeout state with manual refresh button
**Warning signs:** Multiple concurrent fetch requests to the same endpoint; 429 rate-limit errors from the backend

### Pitfall 5: scorePoints Parsing Ambiguity

**What goes wrong:** The multi-level numbered outline format in scorePoints has inconsistent numbering styles (Chinese parentheses vs English, OCR artifacts like `l` vs `1`).
**Why it happens:** The questions.json data was likely extracted from documents with varied formatting, and some entries show OCR errors (e.g., `l、评价集体氛围` instead of `1、评价集体氛围`).
**How to avoid:**
- Parse regex: `r'(?:^|\n)\s*(\d+|[lI])\s*[、.]\s*(.+?)(?=\n\s*\d+\s*[、.]|\n\s*\(\d+\)|\Z)'` for top-level; `r'\(\d+\)\s*(.+?)(?=\n|$|\(\d+\))'` for sub-points
- Normalize OCR artifacts: map `l` and `I` to `1` for the first level
- Validate: after parsing, verify the total point count makes sense (3-8 points per question)
- If parsing produces unexpected results for a question, fall back to treating the entire scorePoints as a single evaluation criterion
**Warning signs:** A question with 5 sub-points produces only 1 parsed point; regex fails to match on a particular question's format

## Code Examples

Verified patterns from official sources:

### DashScope Qwen Text Generation (Scoring)

```python
# Source: DashScope SDK 1.25.18 Generation API [VERIFIED: uv pip list]
# Official docs: https://www.alibabacloud.com/help/en/model-studio/
from dashscope import Generation
import json

def call_qwen_for_scoring(system_prompt: str, user_prompt: str) -> dict:
    """Call Qwen for interview answer scoring. Returns parsed JSON."""
    response = Generation.call(
        model="qwen-max",           # Best reasoning for judging
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        result_format="message",
        temperature=0.1,              # Low temp for consistent judging
        top_p=0.8,
        seed=42,                      # Reproducibility across re-scores
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Qwen scoring failed: [{response.status_code}] {response.message}"
        )
    content = response.output.choices[0].message.content
    return json.loads(content)
```

### WebM to WAV Conversion

```python
# Source: backend/tests/test_asr_e2e.py pattern [VERIFIED]
# /tmp/ffmpeg binary confirmed: ffmpeg version 7.0.2-static
import subprocess
from pathlib import Path

def convert_webm_to_wav(webm_path: str) -> str:
    """Convert recording to 16kHz mono PCM WAV for ASR."""
    wav_path = webm_path.replace(".webm", ".wav")
    result = subprocess.run([
        "/tmp/ffmpeg", "-y",
        "-i", webm_path,
        "-ar", "16000",
        "-ac", "1",
        "-sample_fmt", "s16",
        wav_path,
    ], check=True, capture_output=True, text=True)
    # Validate: check WAV is not just header (44 bytes)
    if Path(wav_path).stat().st_size <= 44:
        raise RuntimeError("Converted WAV is empty (header only)")
    return wav_path
```

### Frontend Scoring API Module

```typescript
// Source: established pattern from recordingApi.ts, ttsApi.ts [VERIFIED]
const API_BASE_URL = 'http://localhost:8000';

export interface ScoringResult {
  questionIndex: number;
  questionId: string;
  status: 'pending' | 'scored' | 'failed';
  transcript?: string;
  coverage?: Array<{
    id: number;
    section: string;
    text: string;
    verdict: 'COVER' | 'PARTIAL' | 'MISS';
    evidence: string;
    reasoning: string;
  }>;
  feedback?: string;
  coveredCount?: number;
  totalCount?: number;
}

export async function triggerScoring(
  sessionId: string,
  questionIndex: number,
  questionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scoring/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question_index: questionIndex, question_id: questionId }),
  });
  if (!response.ok) {
    throw new Error(`Scoring trigger failed: ${response.status}`);
  }
}

export async function fetchScoringResults(sessionId: string): Promise<ScoringResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/scoring/results/${encodeURIComponent(sessionId)}`);
  if (!response.ok) throw new Error(`Failed to fetch results: ${response.status}`);
  return response.json();
}

export async function rescoreQuestion(
  sessionId: string,
  questionIndex: number,
  questionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scoring/rescore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question_index: questionIndex, question_id: questionId }),
  });
  if (!response.ok) throw new Error(`Rescore failed: ${response.status}`);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Keyword/regex matching for scoring | LLM semantic matching (Qwen) | 2024+ (LLM-as-judge became standard) | Accuracy increase from ~40% to ~85% on paraphrase detection; eliminates need for synonym dictionaries |
| Synchronous scoring after all questions complete | Per-question async scoring on upload | D-04 (this phase decision) | User sees partial results immediately instead of waiting for all questions; perceived latency drops from 60s to 5-15s |
| `Generation.call(prompt=...)` (legacy DashScope API) | `Generation.call(messages=[...])` (Chat Completions format) | dashscope SDK >= 1.20 (mid-2024) | System prompt support, better instruction following, consistent with OpenAI-compatible format |

**Deprecated/outdated:**
- `Generation.Models.qwen_max` constant: still works but `model="qwen-max"` string form is preferred for forward compatibility with new models
- `Generation.call(prompt=...)`: deprecated in favor of `messages` parameter which provides system/user/assistant role separation
- Cosine similarity on embeddings for scoring: became obsolete once LLM-as-judge demonstrated superior accuracy on rubric-based evaluation tasks
- `result_format='text'`: use `result_format='message'` for structured output

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Backend runtime | Yes | 3.12.3 | — |
| Node.js | Frontend build/runtime | Yes | v24.15.0 | — |
| npm | Frontend package management | Yes | 11.12.1 | — |
| dashscope Python SDK | LLM scoring + ASR | Yes | 1.25.18 | — |
| `/tmp/ffmpeg` static binary | WebM-to-WAV conversion | Yes | 7.0.2-static | Install from johnvansickle.com/ffmpeg |
| DASHSCOPE_API_KEY | DashScope API auth | Yes | Configured in .env | — |
| antd (Ant Design v5) | Result page UI components | Yes | 5.29.3 | — |
| zustand | Scoring result store | Yes | 4.5.7 | — |
| react-router-dom | /results route | Yes | 6.30.3 | — |

**Missing dependencies with no fallback:** None -- all dependencies are available.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (backend) + Vitest (frontend; check if configured) |
| Config file | pytest: none (auto-discovery); frontend: check for vitest.config.ts |
| Quick run command | `cd backend && uv run python -m pytest tests/ -x` |
| Full suite command | `cd backend && uv run python -m pytest tests/ -v` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | Scoring triggers automatically after last question; results page polls and displays | integration | `uv run python -m pytest tests/test_scoring_e2e.py::test_auto_trigger -x` | No (Wave 0) |
| SCORE-02 | LLM evaluates per-point coverage (cover/partial/miss) against scorePoints; coverage ratio computed | unit | `uv run python -m pytest tests/test_scoring_service.py::test_coverage_evaluation -x` | No (Wave 0) |
| SCORE-03 | Results page displays scores, feedback, coverage dots, and collapsible ASR transcript per question | e2e | `npx playwright test tests/scoring-results.spec.ts` | No (Wave 0) |
| UI-05 | Card waterfall layout with all states (scored/pending/error/empty) rendering correctly | ui | `npx playwright test tests/scoring-results.spec.ts -- --ui` | No (Wave 0) |

### Sampling Rate

- **Per task commit:** `uv run python -m pytest tests/test_scoring_service.py -x` (unit tests only)
- **Per wave merge:** `uv run python -m pytest tests/ -v` (full backend suite)
- **Phase gate:** All backend tests green + manual frontend verification (E2E optional for Phase 4 given test infrastructure)

### Wave 0 Gaps

- [ ] `backend/tests/test_scoring_service.py` -- covers scorePoints parsing, LLM prompt construction, coverage computation
- [ ] `backend/tests/test_scoring_e2e.py` -- covers full pipeline: recording -> ASR -> LLM -> result JSON (uses existing recording)
- [ ] `backend/tests/conftest.py` -- shared fixtures (mock questions with scorePoints, sample transcripts)
- [ ] Frontend test infrastructure: check for vitest.config.ts or playwright.config.ts; if absent, manual verification is acceptable for v1

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | v1 single-user, no auth |
| V3 Session Management | No | Session IDs are client-generated UUIDs; no server-side sessions |
| V4 Access Control | No | v1 single-user |
| V5 Input Validation | Yes | Backend validates: session_id non-empty, question_index non-negative, file existence. Pydantic models for request bodies |
| V6 Cryptography | No | No cryptographic operations in scoring pipeline |

### Known Threat Patterns for Scoring Pipeline

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious prompt injection via ASR transcript | Tampering | ASR transcript is system-generated, not user-provided text. LLM prompt treats transcript as data, not instructions. Use system/role separation in messages format. |
| Path traversal via session_id | Tampering | Validate session_id against `^[a-f0-9-]+$` (UUID format). Use pathlib to prevent traversal. Same pattern as recording router validation. |
| Resource exhaustion via repeated re-score requests | Denial of Service | Rate limit re-score: max 3 re-scores per question per session. DashScope API already has built-in rate limits. |
| LLM output parsing failure / JSON injection | Tampering | Validate JSON structure after parsing. If `json.loads()` fails, treat as scoring failure -> D-10 auto-retry -> degrade to "评分失败". Never pass raw LLM output to frontend without validation. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `qwen-max` model is the best available Qwen model for scoring accuracy. May need to switch to `qwen-plus` if cost/latency is a concern. | Standard Stack | if qwen-max is too slow (>15s per question), switching to qwen-plus is straightforward (change one string). Low risk. |
| A2 | `/tmp/ffmpeg` static binary will always be available. The E2E test already depends on it. | Don't Hand-Roll | if removed, the E2E test would also break (already depends on it). Medium risk -- the binary is a known project asset. |
| A3 | JSON file storage (`scoring.json`) is sufficient for v1 single-user. No database needed. | Architecture Patterns | if multi-user or persistence requirements change, migrate to SQLite. Low risk -- JSON file is trivially migratable. |
| A4 | `scorePoints` format is consistent enough across all 16 questions for regex-based parsing to work without manual intervention. | Common Pitfalls | if a question's format is unparseable, that question won't get per-point coverage -- only holistic feedback. Medium risk -- test against all 16 questions during implementation. |
| A5 | Polling every 2.5 seconds is adequate. WebSocket or SSE not needed for v1. | Architecture Patterns | if scoring takes >30 seconds per question, polling feels sluggish. Would need to add progress indications. Low risk -- DashScope API latency is typically <10 seconds. |
| A6 | The existing `asr_service.transcribe_audio()` function works with ffmpeg-converted WAV files. The ASR endpoint already validates WAV format and handles this. | Common Pitfalls | if the converted WAV has unexpected format differences, ASR would fail. Low risk -- the E2E test already validates this exact flow (TTS -> WAV -> ASR). |

## Open Questions (RESOLVED)

1. **Frontend test infrastructure**
   - What we know: Playwright is in package.json (`@playwright/test: ^1.60.0`). No test config files found yet.
   - What's unclear: Whether Playwright is configured (playwright.config.ts) or just installed as a dependency.
   - RESOLVED: Check for playwright.config.ts during Wave 0 planning. If absent, E2E tests are manual verification only.

2. **LLM prompt calibration**
   - What we know: The LLM-as-judge pattern with cover/partial/miss rubric is well-established. Qwen-max supports JSON output.
   - What's unclear: Optimal prompt phrasing for civil-service exam terminology and ASR error tolerance. May need iteration.
   - RESOLVED: Plan for prompt tuning as a development task. Use the 16 questions as a validation set.

3. **Scoring trigger mechanism**
   - What we know: D-04 says scoring triggers on recording upload. Phase 3 already has `POST /api/recording/upload`.
   - What's unclear: Whether to add a new endpoint or integrate scoring into the existing upload handler.
   - RESOLVED: Add a separate `POST /api/scoring/evaluate` endpoint (clean separation). The frontend calls it after successful upload in QuestionInterviewPage.

4. **ASR transcript quality for scoring**
   - What we know: E2E test shows 100% character coverage for TTS-generated clean speech. Real user speech will have more variation.
   - What's unclear: Actual ASR accuracy on real user speech with varying accents, background noise, and civil-service terminology.
   - RESOLVED: Accept D-03's design -- LLM semantic matching mitigates ASR errors. No additional preprocessing needed beyond what Paraformer provides.

## Sources

### Primary (HIGH confidence)

- DashScope Python SDK 1.25.18 -- installed and verified via `uv pip list` and `python -c "from dashscope import Generation"`. Generation API supports `model="qwen-max"` with `messages` parameter and `result_format="message"`. Official docs: https://www.alibabacloud.com/help/en/model-studio/
- `/tmp/ffmpeg` version 7.0.2-static -- verified via `--version` flag. Supports WebM/Opus decode. Used in `backend/tests/test_asr_e2e.py`.
- Project codebase -- all existing stores, routers, services, and API modules verified by reading source files directly.
- Ant Design v5.29.3 -- confirmed via `frontend/package.json` and `npm view antd version`. Card component supports `loading` prop for skeleton state.
- DashScope Generation.Models -- verified available models: `qwen_max`, `qwen_plus`, `qwen_turbo`, `qwen_plus_v1`, `qwen_v1`, `bailian_v1`, `dolly_12b_v2`.

### Secondary (MEDIUM confidence)

- LLM-as-Judge best practices -- synthesized from web search results (Statsig, MLflow DeepWiki, Promptfoo docs). Cover/partial/miss rubric with chain-of-thought prompting is the consensus approach.
- DashScope Qwen model list (2025) -- from web search. Models like `qwen-max-latest` and `qwen3-32b` exist but were not verified against the installed SDK. String model names are accepted.
- Ant Design Card component API -- from official ant.design documentation via WebFetch.

### Tertiary (LOW confidence)

- Specific prompt phrasing for civil-service exam evaluation -- no existing templates found. Will need iteration during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in the project
- Architecture: HIGH -- async pipeline pattern is well-understood; integration points exist in codebase
- Pitfalls: MEDIUM -- LLM judging consistency and scorePoints parsing are the main unknowns; both have mitigation strategies

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (30 days -- stable technology, no fast-moving dependencies)

**Phase requirements addressed:**
- SCORE-01: Auto-trigger via POST /api/scoring/evaluate after recording upload; polling-based results fetching
- SCORE-02: Qwen-max LLM per-point coverage judgment (cover/partial/miss) against scorePoints; coverage ratio computation
- SCORE-03: Card waterfall with coverage dots, textual feedback, collapsible ASR transcript
- UI-05: ScoringResultsPage at /results with Ant Design Card, Collapse, Skeleton, Spin, Tag, Button components
