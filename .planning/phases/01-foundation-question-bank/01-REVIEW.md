---
phase: 01-foundation-question-bank
reviewed: 2026-05-23T12:00:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - scripts/extract_scored_questions.py
  - backend/pyproject.toml
  - backend/app/__init__.py
  - backend/app/main.py
  - backend/app/models/__init__.py
  - backend/app/models/question.py
  - backend/app/routers/__init__.py
  - backend/app/routers/health.py
  - backend/app/routers/questions.py
  - backend/app/services/__init__.py
  - backend/app/services/question_service.py
  - backend/data/questions.json
  - frontend/package.json
  - frontend/vite.config.ts
  - frontend/tsconfig.json
  - frontend/tsconfig.app.json
  - frontend/tsconfig.node.json
  - frontend/index.html
  - frontend/src/main.tsx
  - frontend/src/App.tsx
  - frontend/src/router.tsx
  - frontend/src/vite-env.d.ts
  - frontend/src/types/question.ts
  - frontend/src/api/client.ts
  - frontend/src/api/questionsApi.ts
  - frontend/src/store/questionBankStore.ts
  - frontend/src/layouts/AppLayout.tsx
  - frontend/src/pages/QuestionBank/index.tsx
  - frontend/src/pages/QuestionBank/components/QuestionTable.tsx
  - frontend/src/pages/QuestionBank/components/SelectionPanel.tsx
  - frontend/src/pages/QuestionBank/components/TypeTag.tsx
  - frontend/src/pages/QuestionBank/hooks/useQuestionSelection.ts
  - frontend/src/pages/ExamRoom/index.tsx
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-23T12:00:00Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

This review covers the initial foundation of the Civil Service Exam Interview Simulator: a data extraction script, a FastAPI backend serving question data, and a React/TypeScript frontend with a question bank page. The codebase is small, well-structured, and generally clean. No critical security vulnerabilities (hardcoded credentials, injection, unsafe deserialization) were found. However, five warnings and four info items were identified, covering a real bug in the extraction script (crash when `analysis` field is null), duplicated business logic, hardcoded configuration, an accessibility issue in the entry HTML, and missing runtime validation on API responses.

---

## Warnings

### WR-01: Script crashes when `analysis` key exists but is null

**File:** `scripts/extract_scored_questions.py:58`
**Issue:** The `is_scored` function uses `record.get("analysis", {})` to guard against a missing `"analysis"` key, but `dict.get()` only returns the default when the key is absent. If the key exists with value `null` (valid JSON, becomes Python `None`), the call returns `None`, and `None.get("score_points")` raises `AttributeError: 'NoneType' object has no attribute 'get'`. The same vulnerable pattern exists in `extract_question` at line 88.

This crash would abort the entire extraction pipeline.

**Fix:**
```python
def is_scored(record: dict) -> bool:
    analysis = record.get("analysis")
    if not isinstance(analysis, dict):
        return False
    score_points = analysis.get("score_points")
    return bool(score_points and len(str(score_points).strip()) > 0)
```

Also fix `extract_question` at line 88:
```python
    analysis = record.get("analysis") or {}
```

### WR-02: Hardcoded API base URL with no timeout handling

**File:** `frontend/src/api/client.ts:1`
**Issue:** `API_BASE_URL` is hardcoded to `http://localhost:8000`. This does not work in any non-development environment (staging, production, or even Docker-based dev setups with different hostnames). Additionally, `fetch()` calls have no timeout — if the backend is unreachable or slow, the request can hang for 60+ seconds (browser default) before rejecting. The store will only show "加载失败" after that delay, which is a poor user experience.

**Fix:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchQuestions(): Promise<Response> {
  return fetchWithTimeout(`${API_BASE_URL}/api/questions`);
}
```

### WR-03: Duplicated max-selection limit at two layers

**File:** `frontend/src/store/questionBankStore.ts:40` and `frontend/src/pages/QuestionBank/components/QuestionTable.tsx:14`
**Issue:** The constant `4` (maximum number of selectable questions) is hardcoded in two independent locations:
1. The store's `toggleSelect` method checks `state.selectedIds.length >= 4`
2. The `QuestionTable` component checks `selectedIds.length >= 4` in `handleCheckboxClick`

If the limit needs to change, both must be updated in sync or the behavior will be inconsistent (the store could silently drop selections past the limit while the UI shows a wrong warning message, or vice versa).

**Fix:** Define a shared constant, e.g. in `src/config.ts`:
```typescript
export const MAX_SELECTION = 4;
export const MIN_SELECTION = 3;
```
Then import it in both locations.

### WR-04: Incorrect `lang` attribute and generic title in entry HTML

**File:** `frontend/index.html:1,7`
**Issue:** The `<html>` tag uses `lang="en"` but the entire application UI is in Chinese. This misleads screen readers and browser translation tools about the page language. The `<title>` is set to `"frontend"` instead of a descriptive Chinese title like `"江苏公务员面试模拟器"`. This is an accessibility and SEO concern.

**Fix:**
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>江苏公务员面试模拟器</title>
  </head>
```

### WR-05: Async route handlers call synchronous code without thread pool offloading

**File:** `backend/app/routers/questions.py:9,16`
**Issue:** Both `list_questions` and `get_question` are defined as `async def` but call synchronous functions (`get_all()`, `get_by_id()`) without offloading to a thread pool. While these specific calls are currently fast (in-memory list iteration), the pattern is fragile: if either function ever performs I/O (e.g., database query, file read), it will block the ASGI event loop and degrade all concurrent requests. FastAPI correctly runs sync `def` handlers in a thread pool, so the handlers should simply be `def` instead of `async def` since they don't await anything.

**Fix:**
```python
@router.get("/api/questions", response_model=List[Question])
def list_questions():
    """Return all scored questions."""
    return get_all()

@router.get("/api/questions/{question_id}", response_model=Question)
def get_question(question_id: str):
    """Return a specific question by ID."""
    question = get_by_id(question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question
```

---

## Info

### IN-01: Variable shadowing in store method and import

**File:** `frontend/src/store/questionBankStore.ts:3,61`
**Issue:** The store method `loadQuestions` (line 58) shares its name with the imported function `loadQuestions` from `../api/questionsApi` (line 3). Inside the arrow function body, `loadQuestions()` on line 61 resolves to the import, not the method itself, due to JavaScript scope rules. While functionally correct, this is confusing and could lead to accidental recursion if the function is refactored. Rename one of them (e.g., `fetchQuestionsFromApi` for the import) to make the code self-documenting.

### IN-02: No runtime type validation on API response

**File:** `frontend/src/api/questionsApi.ts:9`
**Issue:** `response.json() as Promise<Question[]>` uses a TypeScript type assertion (compile-time only) with no runtime validation. If the backend returns data with unexpected types (e.g., `year` as a string instead of number), the app will silently operate on corrupted data. Consider using Zod or a similar schema validator to parse and validate the API response shape at runtime.

### IN-03: Verbose stderr output for all unscored records

**File:** `scripts/extract_scored_questions.py:145-149`
**Issue:** The extraction script prints a warning to stderr for every unscored record in the input file. If the input file contains hundreds of records (likely for a real exam data set), this produces noisy, voluminous output that obscures other messages. Consider suppressing individual warnings and only printing a count summary, or providing a `--verbose` flag.

### IN-04: CORS allows all headers in production-configured middleware

**File:** `backend/app/main.py:41`
**Issue:** `allow_headers=["*"]` allows any HTTP header in cross-origin requests. Combined with `allow_methods=["GET"]` the blast radius is limited, but this is an overly permissive default that could allow custom headers to pass through if POST/PUT methods are enabled later. Restrict to the specific headers the frontend sends (e.g., `Content-Type`, `Accept`).

---

_Reviewed: 2026-05-23T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
