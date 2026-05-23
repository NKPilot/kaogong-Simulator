---
phase: 02
plan: 02
title: Frontend Static Assets and Base UI Components
completed: 2026-05-23
duration: 0h 8m
tasks: 2/2
commits:
  - 3ca0539: feat(02-02): create 5 examiner SVGs and frontend API modules
  - bb0b90b: feat(02-02): create RedBanner, ExaminerRow, EntryAnimation CSS
files_created:
  - frontend/public/examiners/examiner-1.svg
  - frontend/public/examiners/examiner-2.svg
  - frontend/public/examiners/examiner-3.svg
  - frontend/public/examiners/examiner-4.svg
  - frontend/public/examiners/examiner-5.svg
  - frontend/src/api/guidanceApi.ts
  - frontend/src/api/ttsApi.ts
  - frontend/src/pages/ExamRoom/components/RedBanner.tsx
  - frontend/src/pages/ExamRoom/components/ExaminerRow.tsx
  - frontend/src/pages/ExamRoom/components/EntryAnimation.css
---

# Phase 2 Plan 2: Frontend Static Assets and Base UI Components Summary

Created the visual foundation of the virtual exam room: 5 silhouette examiner SVG placeholders, frontend API modules for guidance text and TTS, and reusable UI components (RedBanner, ExaminerRow, EntryAnimation CSS).

## Task Results

### Task 1: Create 5 silhouette placeholder SVGs and frontend API modules

**Status:** Complete

**Created files:**
- `frontend/public/examiners/examiner-1.svg` through `examiner-5.svg` -- 5 subtly distinct silhouette SVGs (varying head shapes, shoulder widths, postures). Each has a dark gray (#333333) human silhouette on light gray (#F0F0F0) background, viewBox "0 0 200 240", desk and nameplate at bottom, with no text labels.
- `frontend/src/api/guidanceApi.ts` -- Exports `fetchGuidance(questionCount: number)` that calls `GET /api/interview/guidance?question_count=N` and returns typed `{ title, paragraphs[] }` response.
- `frontend/src/api/ttsApi.ts` -- Exports `synthesizeSpeech(text: string)` that POSTs to `/api/tts/synthesize` with `{ text, voice: 'longxiaocheng_v2' }` and returns `Promise<ArrayBuffer>`.

**Verification:**
- All 5 SVG files exist with viewBox and svg tags, no Chinese text labels
- TypeScript compilation passes: `npx tsc --noEmit` exits 0

### Task 2: Create RedBanner, ExaminerRow components and EntryAnimation CSS

**Status:** Complete

**Created files:**
- `frontend/src/pages/ExamRoom/components/RedBanner.tsx` -- Full-width red banner (#BE1E2D, 64px height) with centered white title "2025公务员模拟面试" (28px, 700 weight) and negative margins to counteract AppLayout Content padding.
- `frontend/src/pages/ExamRoom/components/ExaminerRow.tsx` -- Horizontal flex row of 5 examiner images shuffled on mount (Fisher-Yates). Center position labeled "主考官", side positions labeled "考官". Includes empty state fallback (gray placeholder divs). Hover effect via CSS transition (scale 1.02).
- `frontend/src/pages/ExamRoom/components/EntryAnimation.css` -- `@keyframes examRoomEntry` (opacity 0->1, scale 0.98->1, 600ms ease-out) and `.exam-room-entry` class. Also includes `.examiner-item:hover` rule.

**Verification:**
- TypeScript compilation passes: `npx tsc --noEmit` exits 0

## Key Decisions

- **SVG design approach:** Used simple geometric shapes (ellipses, paths, rectangles) for clean, professional-looking silhouettes rather than complex path data. Each of the 5 SVGs has distinct proportions (head shape, shoulder width, posture) while maintaining consistent dark suit on light gray background.
- **API module pattern:** `guidanceApi.ts` reuses `API_BASE_URL` from `client.ts` (single source of truth), while `ttsApi.ts` defines its own `API_BASE_URL` constant to match the pattern established in the plan.
- **Shuffle strategy:** Fisher-Yates shuffle applied in `useMemo` with empty deps to randomize examiner order once on mount without re-shuffling on re-renders.
- **Full-width banner approach:** Negative margins (-32px) to counteract AppLayout's Content padding (32px) rather than modifying AppLayout itself, keeping the banner self-contained.

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None. All created files are production-ready for Phase 3 consumption.

## Threat Flags

None. The SVG files are static assets served by Vite dev server (accepted risk T-02-03). API modules contain no security-sensitive code.

## Self-Check

- [x] 5 SVG files exist in public/examiners/ with non-identical content
- [x] Each SVG has viewBox, silhouette figure, suit shape, light gray background, desk nameplate
- [x] SVGs contain no text labels
- [x] guidanceApi.ts exports fetchGuidance with correct endpoint URL
- [x] ttsApi.ts exports synthesizeSpeech returning Promise<ArrayBuffer>
- [x] RedBanner renders full-width red banner with correct text
- [x] ExaminerRow renders 5 images with correct labels (center "主考官", sides "考官")
- [x] EntryAnimation.css defines @keyframes examRoomEntry at 600ms ease-out
- [x] TypeScript compilation passes with zero errors
- [x] All tasks committed individually
