---
phase: 1
plan: 4
name: Question Bank Page
subsystem: Frontend
tags:
  - question-bank
  - ant-design
  - zustand
  - ui
dependency_graph:
  requires:
    - Plan 02 (Backend API)
    - Plan 03 (Frontend Scaffold)
  provides:
    - Question Bank UI (QB-01, QB-02)
  affects:
    - Phase 2 (Exam Room)
tech-stack:
  added:
    - Ant Design Table with expandable rows
    - Ant Design Badge, Tag, Tooltip, Alert, Button
  patterns:
    - Zustand store consumption from component layer
    - Utility hook wrapping store for UI helpers
key-files:
  created:
    - frontend/src/pages/QuestionBank/components/TypeTag.tsx
    - frontend/src/pages/QuestionBank/components/QuestionTable.tsx
    - frontend/src/pages/QuestionBank/components/SelectionPanel.tsx
    - frontend/src/pages/QuestionBank/hooks/useQuestionSelection.ts
  modified:
    - frontend/src/pages/QuestionBank/index.tsx
decisions:
  - TypeTag uses TYPE_CONFIG lookup with "类" suffix for Chinese display labels
  - QuestionTable reads directly from Zustand store (no props drilling)
  - SelectionPanel uses getState() for tag close to avoid stale closure
  - useQuestionSelection hook wraps store with useCallback for render optimization
metrics:
  duration_minutes: 6
  completed_date: "2026-05-23T05:39:40Z"
  tasks_completed: 6
  files_created: 4
  files_modified: 1
  total_lines_added: 292
  total_lines_deleted: 20
---

# Phase 1 Plan 4: Question Bank Page Summary

Question bank page with Ant Design Table showing 16 questions, expandable-row detail view, color-coded type tags, checkbox-based selection with 3-4 constraint enforcement, selection panel with badge and navigation.

## Verification Checklist

- [x] TypeTag maps A/B/C/结构化小组 to correct colors
- [x] QuestionTable renders 4 columns: checkbox, title (题目), type (类型), year (年份)
- [x] Expandable rows show full question text with "题目全文" label and metadata
- [x] Checkbox selection enforces min 3 / max 4
- [x] "开始面试" button disabled until >=3 selections
- [x] Selection panel shows correct copy for all 4 states
- [x] Badge color changes at >=3 (crimson red)
- [x] Warning Alert shown for 1-2 selections
- [x] Closable Tags for removing selections
- [x] Loading state with centered Spin
- [x] Error state with retry Alert
- [x] Empty state Alert
- [x] Navigation to /exam-room on button click
- [x] API integration: fetches from backend /api/questions
- [x] Production build compiles without errors
- [x] Backend serves 16 questions
- [x] CORS headers set for frontend origin

## Tasks Executed

### Task 04.1: TypeTag Component

- Created `TypeTag.tsx` with TYPE_CONFIG lookup for A/B/C/结构化小组
- Colors match UI-SPEC: geekblue (A), green (B), orange (C), red (结构化小组)
- Unknown types fall back to 'default' color
- **Commit:** `8fae170`

### Task 04.2: QuestionTable Component

- Created `QuestionTable.tsx` with 4-column Ant Design Table
- Checkbox column: wrapped in Tooltip when disabled at max selection
- Expandable rows show full question text (pre-wrap) + metadata line
- Row key set to question.id, pagination disabled, size middle
- Overflow prevention via `message.warning`
- **Commit:** `c7e9467`

### Task 04.3: SelectionPanel Component

- Created `SelectionPanel.tsx` with Badge showing selected count
- Status text matches all 4 copywriting states
- "开始面试" button disabled until canProceed(), navigates to /exam-room
- Warning Alert shown for 1 <= count < 3
- Closable Tags for selected questions call toggleSelect via getState()
- **Commit:** `5d27f81`

### Task 04.4: useQuestionSelection Hook

- Created `useQuestionSelection.ts` wrapping Zustand store
- Provides: selectedIds, selectedQuestions, selectedCount
- isCheckboxDisabled helper for max-reached + not-selected check
- handleToggleSelect wraps toggle with question.id extraction
- **Commit:** `0d6cc96`

### Task 04.5: Assemble QuestionBank Page

- Replaced placeholder `index.tsx` with full page
- Loading state: centered Spin with "题目加载中..."
- Error state: Alert with "刷新" retry button
- Empty state: Alert "暂无可用题目"
- Page header: "题库" (Title level 3) + subtitle
- **Commit:** `3d550c2`

### Task 04.6: End-to-End Verification

- Backend (uvicorn on port 8000) starts and returns 16 questions
- Frontend (Vite on port 5174) serves SPA with routing
- Production build compiles without errors (307 KB gzip)
- CORS headers present for frontend-backend communication
- **Commit:** `a5bdbe1` (includes Rule 1 fix)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Dead Code] Removed unused getAlertType function in SelectionPanel**

- **Found during:** Task 04.6 build verification
- **Issue:** `getAlertType` function was defined but never referenced in JSX. TypeScript strict mode flagged it with `error TS6133`.
- **Fix:** Removed the unused function declaration.
- **Files modified:** `frontend/src/pages/QuestionBank/components/SelectionPanel.tsx`
- **Commit:** `a5bdbe1`

## Deferred Issues

None.

## Known Stubs

None. All components are fully wired to Zustand store which fetches from backend API.

## Threat Flags

None. No new security-relevant surface introduced beyond the existing API endpoint pattern.

## Self-Check: PASSED

Verification of all claims:

| Claim | Status |
|-------|--------|
| `frontend/src/pages/QuestionBank/components/TypeTag.tsx` exists | PASS |
| `frontend/src/pages/QuestionBank/components/QuestionTable.tsx` exists | PASS |
| `frontend/src/pages/QuestionBank/components/SelectionPanel.tsx` exists | PASS |
| `frontend/src/pages/QuestionBank/hooks/useQuestionSelection.ts` exists | PASS |
| Commit `8fae170` exists | PASS |
| Commit `c7e9467` exists | PASS |
| Commit `5d27f81` exists | PASS |
| Commit `0d6cc96` exists | PASS |
| Commit `3d550c2` exists | PASS |
| Commit `a5bdbe1` exists | PASS |
| Production build passes (`npm run build`) | PASS |
| Backend returns 16 questions | PASS |
