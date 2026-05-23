---
phase: 01-foundation-question-bank
plan: 03
subsystem: ui
tags: [react, vite, antd, zustand, react-router, typescript]

requires:
  - plan: 01
    provides: Question JSON data structure (16 scored questions)

provides:
  - Frontend Vite + React + TypeScript scaffold
  - Ant Design ConfigProvider with crimson red theme (#BE1E2D)
  - Question type definitions and API client module
  - Zustand question bank store with selection logic
  - App shell with sticky header and router (/, /exam-room)
  - Placeholder pages for Question Bank and Exam Room

affects:
  - Phase 2 (Exam Room): Uses router route, store state, theme tokens
  - Phase 4 (Scoring): Uses Question type, store for selected questions

tech-stack:
  added:
    - react v19, react-dom v19
    - react-router-dom v6
    - antd v5, @ant-design/icons
    - zustand v4
    - vite v8, @vitejs/plugin-react
  patterns:
    - Feature-based page organization (pages/FeatureName/index.tsx)
    - Zustand store with separate actions and computed helpers
    - API client layer separated from store/component logic

key-files:
  created:
    - frontend/src/types/question.ts
    - frontend/src/api/client.ts
    - frontend/src/api/questionsApi.ts
    - frontend/src/store/questionBankStore.ts
    - frontend/src/router.tsx
    - frontend/src/layouts/AppLayout.tsx
    - frontend/src/pages/QuestionBank/index.tsx
    - frontend/src/pages/ExamRoom/index.tsx
    - frontend/public/questions.json
  modified:
    - frontend/src/main.tsx
    - frontend/src/App.tsx
    - frontend/vite.config.ts

key-decisions:
  - "Vite config server.host pinned to localhost (not 0.0.0.0) for dev safety (threat model M2)"
  - "lineHeight token typed as number (not string) per Ant Design v5 API"

patterns-established:
  - "API layer: base client (fetch wrappers) + questionsApi (error-handling facade)"
  - "Store pattern: Zustand with get() for computed helpers instead of derived selectors"
  - "Page components: export default function, import Zustand store directly"

requirements-completed: [QB-01]

duration: 7min
completed: 2026-05-23
---

# Phase 1 Plan 03: Frontend React+Vite Scaffold Summary

**Vite + React + TypeScript frontend scaffold with Ant Design crimson red theme, React Router v6 routes, Zustand question bank store, Question type definitions, and placeholder pages for Question Bank and Exam Room**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-23T05:29:38Z
- **Completed:** 2026-05-23T05:36:12Z
- **Tasks:** 7 / 7
- **Commits:** 7

## Accomplishments

- Scaffolded Vite React TypeScript project with antd v5, react-router-dom v6, zustand v4 installed
- Configured Ant Design ConfigProvider wrapping the app with zhCN locale and crimson red (#BE1E2D) theme tokens including Layout, Table, Button, Tag, Badge, Checkbox component overrides
- Created Question TypeScript interface with all 7 fields matching backend data structure
- Built API client module with fetch-based helper functions and error-handling facade
- Implemented Zustand question bank store with questions/loading/error state, selection logic (min 3, max 4), and data loading action
- Created app shell with sticky crimson header ("江苏公务员面试模拟器"), centered content area, and React Router with / and /exam-room routes
- Added placeholder pages: QuestionBank (loading/error/loaded states via useQuestionBankStore) and ExamRoom ("面试考场 (即将开放)")
- Copied 16 scored questions JSON to frontend/public/ as local reference copy
- Set Vite dev server host to localhost per threat model mitigation M2

## Task Commits

Each task was committed atomically:

1. **Task 03.1: Scaffold Vite React TypeScript project** - `10c7bf9` (feat)
2. **Task 03.2: Set up Ant Design ConfigProvider with theme** - `79bbba3` (feat)
3. **Task 03.3: Create type definitions and API client module** - `0038fd3` (feat)
4. **Task 03.4: Create Zustand question bank store** - `550b348` (feat)
5. **Task 03.5: Create app shell with Layout and Header** - `815a4b4` (feat)
6. **Task 03.6: Create placeholder pages** - `45910ed` (feat)
7. **Task 03.7: Copy questions.json to frontend and verify dev server** - `71157db` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `frontend/vite.config.ts` - Vite config with React plugin and localhost host binding
- `frontend/src/main.tsx` - App entry with ConfigProvider wrapping (zhCN locale, crimson red theme)
- `frontend/src/App.tsx` - Root component rendering RouterProvider
- `frontend/src/types/question.ts` - Question interface (id, title, fullText, type, year, source, scorePoints)
- `frontend/src/api/client.ts` - Base API client (fetchQuestions, fetchQuestion, healthCheck)
- `frontend/src/api/questionsApi.ts` - Higher-level loadQuestions with error handling
- `frontend/src/store/questionBankStore.ts` - Zustand store (questions, loading, error, selectedIds, toggleSelect, isSelected, isMaxReached, canProceed, loadQuestions, resetSelection)
- `frontend/src/router.tsx` - React Router v6 config (/, /exam-room)
- `frontend/src/layouts/AppLayout.tsx` - App shell (sticky crimson Header, centered Content with Outlet)
- `frontend/src/pages/QuestionBank/index.tsx` - QuestionBank page (loading Spin, error Alert with retry, loaded state)
- `frontend/src/pages/ExamRoom/index.tsx` - ExamRoom placeholder ("面试考场 (即将开放)")
- `frontend/public/questions.json` - Copy of backend 16 scored questions

## Decisions Made

- Vite config `server.host` pinned to `localhost` (not `0.0.0.0`) for dev safety, implementing threat model mitigation M2
- `lineHeight` token typed as number per Ant Design v5 API (compile-time type enforcement, not CSS string)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Mitigation] Added server.host: 'localhost' to Vite config**

- **Found during:** Task 03.1 (Scaffold Vite project)
- **Issue:** Plan threat model M2 requires Vite dev server to bind to localhost only, but the scaffolded vite.config.ts had no server configuration
- **Fix:** Added `server: { host: 'localhost' }` to vite.config.ts
- **Files modified:** `frontend/vite.config.ts`
- **Verification:** `npm run dev` starts on `http://localhost:5173/` only
- **Committed in:** `10c7bf9` (Task 03.1 commit)

**2. [Rule 1 - Bug] Fixed lineHeight type from string to number**

- **Found during:** Task 03.2 (Ant Design theme configuration)
- **Issue:** Ant Design v5 component tokens type `lineHeight` as `number`, not CSS string. The plan specified `lineHeight: '20px'` which causes TS2322 build error
- **Fix:** Changed `lineHeight: '20px'` to `lineHeight: 20` in Tag component theme override
- **Files modified:** `frontend/src/main.tsx`
- **Verification:** `npm run build` passes without TypeScript errors
- **Committed in:** `79bbba3` (Task 03.2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness and security. No scope creep.

## Issues Encountered

- Vite 9 scaffolding template does not create `src/vite-env.d.ts` (listed in plan's `files_modified`). This is a harmless version difference — the file is not required for the build to pass.
- Task 03.5 required creating stub pages to satisfy the build (router imports page components). Full page implementations were delivered in Task 03.6 as planned — the stubs were interim artifacts committed with Task 03.5.

## User Setup Required

None - no external service configuration required for the frontend scaffold.

## Next Phase Readiness

- Frontend skeleton fully scaffolded with routing, theme, store, and type definitions
- Question Bank page renders with loading/error states — will show actual question list when backend is running
- Exam Room route is wired (placeholder awaiting Phase 2 implementation)
- "开始面试" button on Question Bank page will navigate to /exam-room (Phase 2)
- Backend integration is ready: API client calls localhost:8000 endpoints (health, questions)

---
*Phase: 01-foundation-question-bank*
*Completed: 2026-05-23*
