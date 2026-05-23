---
phase: 01-foundation-question-bank
plan: 02
subsystem: api
tags: [fastapi, pydantic, uvicorn, python, backend]
requires:
  - phase: 01-foundation-question-bank
    plan: 01
    provides: backend/data/questions.json with 16 scored questions
provides:
  - FastAPI backend scaffold with health check and question-serving endpoints
  - Pydantic Question model matching the JSON schema
  - Service layer for data access from questions.json
  - CORS configuration restricted to frontend dev server origin
affects:
  - Phase 2: Virtual Exam Room
  - Phase 3: Question-by-Question Interview
  - Phase 4: Scoring & Feedback
tech-stack:
  added:
    - fastapi 0.136.1
    - uvicorn 0.47.0
    - pydantic 2.13.4
    - uv (Python project management)
  patterns:
    - FastAPI standard layout: app/routers/, app/models/, app/services/
    - Lifespan handler for startup data loading
    - Service layer pattern with module-level in-memory cache
    - CORS middleware restricted to known origins
key-files:
  created:
    - backend/pyproject.toml
    - backend/.gitignore
    - backend/app/__init__.py
    - backend/app/main.py
    - backend/app/routers/health.py
    - backend/app/routers/questions.py
    - backend/app/models/question.py
    - backend/app/services/question_service.py
  modified: []
key-decisions:
  - "uv sync establishes .venv in backend/ per project, uv run activates it"
  - "Question model uses from_attributes mode for dict-based construction"
  - "Question data path is hardcoded relative to service module (path traversal mitigation)"
  - "CORS restricted to localhost:5173 and 127.0.0.1:5173 (frontend dev server)"
  - "Server binds to 127.0.0.1 by default (LAN exposure mitigation)"
  - "Questions loaded at startup via lifespan handler; server exits on data error"
patterns-established:
  - "Service module: module-level _questions list as in-memory cache, explicit load_questions() on startup"
  - "Router module: APIRouter with tags, explicit response_model on endpoints"
  - "Verification: curl-based endpoint tests from README"
requirements-completed:
  - QB-01
  - QB-02
duration: 2min
completed: 2026-05-23
---

# Phase 1 Plan 2: Backend FastAPI Scaffold Summary

**FastAPI backend scaffold with Pydantic Question model, question service layer reading from questions.json, health check and question-serving REST endpoints, and CORS restricted to frontend dev server**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-23T05:26:09Z
- **Completed:** 2026-05-23T05:27:41Z
- **Tasks:** 6
- **Files created:** 11

## Accomplishments

- Backend project structure created with FastAPI standard layout (app/routers/, app/models/, app/services/)
- uv-based Python project with fastapi, uvicorn, and pydantic dependencies installed
- Pydantic Question model with all 7 fields matching questions.json schema
- Question service layer: load_questions() reads and validates JSON at startup, get_all()/get_by_id()/count() provide data access
- Health check endpoint (GET /api/health) returns server status
- Questions endpoints (GET /api/questions and GET /api/questions/{id}) serve question data
- CORS middleware configured to allow only frontend dev server (localhost:5173)
- Server startup verified: all 16 questions loaded, both endpoints respond correctly
- Each question in API response contains all 7 fields (id, title, fullText, type, year, source, scorePoints)

## Task Commits

Each task was committed atomically:

1. **Task 02.1: Create backend directory structure and pyproject.toml** - `b246414` (feat)
2. **Task 02.2: Create Pydantic models for Question** - `487bba5` (feat)
3. **Task 02.3: Create question service** - `f1f36db` (feat)
4. **Task 02.4: Create REST routers** - `280d8bd` (feat)
5. **Task 02.5: Create FastAPI application with CORS** - `8540bc1` (feat)
6. **Task 02.6: Run backend and verify endpoints** - verification only, no code changes

**Plan metadata:** `e68ec5b` (docs: complete 01-02 Backend FastAPI Scaffold plan)

## Files Created

- `backend/pyproject.toml` - Project configuration with fastapi, uvicorn, pydantic dependencies
- `backend/.gitignore` - Python project ignores (pycache, venv, env, uv.lock)
- `backend/app/__init__.py` - Package init
- `backend/app/main.py` - FastAPI application entry point with lifespan, CORS, router registration
- `backend/app/routers/__init__.py` - Package init
- `backend/app/routers/health.py` - GET /api/health endpoint
- `backend/app/routers/questions.py` - GET /api/questions and GET /api/questions/{question_id}
- `backend/app/models/__init__.py` - Package init
- `backend/app/models/question.py` - Pydantic Question model
- `backend/app/services/__init__.py` - Package init
- `backend/app/services/question_service.py` - Question data access layer

## Decisions Made

- **uv sync workflow**: uv creates a .venv in backend/ and manages dependencies; all Python commands use `uv run` to activate the environment
- **Pydantic from_attributes**: model uses `from_attributes=True` config to accept camelCase fields from JSON dicts
- **Hardcoded data path**: _QUESTIONS_FILE is computed relative to the service module location, making it non-user-controllable (path traversal mitigation)
- **CORS restriction**: only http://localhost:5173 and http://127.0.0.1:5173 are allowed in keep with threat model M2
- **Default bind**: server binds to 127.0.0.1 by default, not 0.0.0.0 (threat model M4)
- **Startup validation**: lifespan handler calls load_questions() and exits on failure (threat model M3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed deprecated dev-dependencies field**
- **Found during:** Task 02.1 (Create backend directory structure)
- **Issue:** The plan included `[tool.uv] dev-dependencies = []` which uv reported as deprecated, recommending `[dependency-groups.dev]` instead
- **Fix:** Removed the `[tool.uv] dev-dependencies = []` field entirely; the `[dependency-groups] dev = []` already serves the same purpose
- **Files modified:** backend/pyproject.toml
- **Verification:** `uv sync` completes without warnings
- **Committed in:** b246414 (Task 02.1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor — resolved uv deprecation warning. No scope creep.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Verification Results

```
GET /api/health           -> 200 {"status":"ok","service":"interview-simulator"}
GET /api/questions         -> 200 with 16 questions (types: A, B, C)
GET /api/questions/{id}    -> 200 with single question object (7 fields)
GET /api/questions/bad     -> 404 {"detail":"Question not found"}
CORS allowed origin        -> access-control-allow-origin: http://localhost:5173
CORS rejected origin       -> no access-control-allow-origin header
```

## Next Phase Readiness

- Backend API is fully functional and serves question data
- Ready for Phase 2 (Virtual Exam Room) and Phase 3 (Question-by-Question Interview) which need the API endpoints
- Service layer can be extended with TTS and scoring endpoints in later phases

## Self-Check: PASSED

All 11 files verified on disk. All 5 commits verified in git log.

---
*Phase: 01-foundation-question-bank*
*Completed: 2026-05-23*
