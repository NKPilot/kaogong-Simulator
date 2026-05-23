---
phase: 02
plan: 03
subsystem: Virtual Exam Room
tags: [components, orchestrator, TTS, guidance, checkpoint]
requires:
  - 02-01 (API layer + backend endpoints)
  - 02-02 (RedBanner, ExaminerRow, EntryAnimation CSS)
  - 02-RESEARCH (autoplay handling patterns)
  - 02-UI-SPEC (component specs, copywriting contract, interactions)
provides:
  - GuidanceToggle component (expandable/collapsible text panel)
  - TTSControls component (play/pause/replay with state display)
  - CTAButton component (primary "开始答题" navigation)
  - ExamRoomPage orchestrator (full page with all components + API wiring)
affects:
  - Phase 3 (first question page) — ExamRoomPage navigates to /exam-room/question/1
  - AppLayout Content padding — wrapper avoids double negative margins with RedBanner
tech-stack:
  added: []
  patterns:
    - "useRef<HTMLAudioElement> for audio lifecycle management"
    - "Promise-based autoplay with NotAllowedError catch for browser policy fallback"
    - "Zustand store read for selected question count (same pattern as Phase 1)"
    - "CSS max-height transition for smooth expand/collapse animation"
    - "URL.createObjectURL / URL.revokeObjectURL for ephemeral audio blob lifecycle"
key-files:
  created:
    - frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx
    - frontend/src/pages/ExamRoom/components/TTSControls.tsx
    - frontend/src/pages/ExamRoom/components/CTAButton.tsx
  modified:
    - frontend/src/pages/ExamRoom/index.tsx
decisions:
  - "Wrapper negative margins avoided — RedBanner already has its own marginLeft:-32 / marginRight:-32 for full-width self-extension; adding same on wrapper causes double-offset"
  - "Audio blob stored in component-local state, not in Zustand (blobs are large; component-local ref reduces memory pressure)"
  - "Phase 3 navigation uses placeholder /exam-room/question/1 route — actual route defined in Phase 3"
metrics:
  duration: "~8 min"
  completed_date: "2026-05-23"
  tasks_completed: 2
  tasks_total: 3
  checkpoint_at: "Task 3 (human-verify)"
---

# Phase 2 Plan 3: Exam Room Interactive Components Summary

**Partial execution — Tasks 1-2 complete, Task 3 awaiting human verification.**

Interactive exam room components and full-page orchestrator created. The ExamRoomPage now wires together all Plan 02 components (RedBanner, ExaminerRow, GuidanceToggle, TTSControls, CTAButton) with Plan 01 API calls (guidanceApi, ttsApi) and Zustand store reads. Entry animation, autoplay with browser policy fallback, and full playback controls are implemented.

## What Was Built

### Task 1: GuidanceToggle, TTSControls, CTAButton (committed dcf77b4)

**GuidanceToggle** (`frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx`):
- Expandable/collapsible text panel with `paragraphs: string[]` prop
- Initial state collapsed (text hidden, button shows "查看引导语文字" with DownOutlined icon)
- Expanded state: button shows "收起引导语文字" with UpOutlined icon, text visible
- CSS `max-height` transition (300ms) for smooth open/close animation
- White background, borderRadius 6px, padding 16px, max-width 720px centered
- Body text at 16px, weight 400, line-height 1.6, color #262626 per UI-SPEC

**TTSControls** (`frontend/src/pages/ExamRoom/components/TTSControls.tsx`):
- Props: `playing`, `paused`, `ended`, `error`, `loading`, `onPlayPause`, `onReplay`
- Five states per UI-SPEC C-04 States table:
  - **Loading**: Ant Design `Spin` component (no buttons)
  - **Playing**: PauseCircleOutlined button + "正在播放引导语..."
  - **Paused**: PlayCircleOutlined button + "已暂停"
  - **Ended**: PlayCircleOutlined button + "播放完毕"
  - **Error**: Text "语音播放失败，请查看下方文字" (no buttons, no Spin)
- Replay button (ReloadOutlined) visible in all non-loading, non-error states

**CTAButton** (`frontend/src/pages/ExamRoom/components/CTAButton.tsx`):
- Ant Design `Button` type="primary" size="large" with text "开始答题"
- Centered with min-width 200px, margin-top 32px
- Accepts `onClick: () => void` prop
- Never disabled in Phase 2 (always has pre-selected questions)

### Task 2: ExamRoomPage Orchestrator (committed c4e2f4d, fix 1797adb)

**State management** — 10 state variables covering the full loading/ready/error/autoplay-blocked lifecycle:
- `guidanceText`, `guidanceLoading`, `guidanceError` — guidance API state
- `audioBlob`, `ttsError`, `audioLoading` — TTS API state
- `audioPlaying`, `audioPaused`, `audioEnded` — audio playback state
- `playBlocked` — browser autoplay policy fallback

**On-mount data flow**:
1. Reads `selectedIds` and `questions` from Zustand `useQuestionBankStore`
2. Computes `questionCount` from selected questions
3. Calls `fetchGuidance(questionCount)` → sets `guidanceText`
4. Calls `synthesizeSpeech(fullGuidanceText)` with exact same text (Pitfall 4 prevention)
5. Creates `Blob` → `Object URL` → sets `audio.src` → calls `audio.play()`
6. If `NotAllowedError`: shows fullscreen play overlay ("点击播放引导语")
7. Audio event listeners handle `play`/`pause`/`ended` to update state

**Layout structure** (top to bottom):
1. `exam-room-entry` CSS class for fade-in + scale-up animation (600ms)
2. RedBanner (full-width via its own negative margins)
3. Content area (max-width 960px, centered with `margin: 0 auto`):
   - ExaminerRow
   - 48px spacer
   - Loading state: `Spin` + "正在加载引导语..."
   - Error state: "引导语加载失败，请检查网络连接后重试"
   - Ready state: GuidanceToggle → TTSControls → CTAButton
4. Hidden `<audio>` element managed via `useRef`

**Navigation**: "开始答题" calls `audioRef.current.pause()`, clears `src`, navigates to `/exam-room/question/1` (Phase 3 placeholder route).

**Error handling**:
- TTS error: `ttsError=true`, TTSControls shows fallback text, GuidanceToggle still works (D-16)
- Guidance API error: shows error message text
- Autoplay blocked: play overlay appears, user clicks to start audio (I-02)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed redundant wrapper negative margins causing double-offset**
- **Found during:** Task 2 verification
- **Issue:** The plan recommended setting `marginLeft: -32, marginRight: -32` on the page wrapper to counteract AppLayout Content padding. However, RedBanner already applies this same negative margin internally for its own full-width behavior. Adding the negative margin on the wrapper caused a double -64px offset, pushing RedBanner 32px off-screen on each side.
- **Fix:** Removed the wrapper's negative margins entirely. RedBanner's own marginLeft:-32 / marginRight:-32 already extends it to the viewport edge within the Content padding context. Inner content uses `maxWidth: 960` with `margin: 0 auto` for proper centering.
- **Commit:** 1797adb
- **Impact:** Prevented a visual layout bug where the red banner would extend off-screen.

## Known Stubs

None. All component props are wired to real data sources (API responses or Zustand store). The Phase 3 navigation route `/exam-room/question/1` is a placeholder target, but this is intentional since Phase 3 has not been built yet.

## Threat Flags

None. No new security-relevant surface introduced beyond what is already documented in the plan's threat model (T-02-04: TTS audio blob in frontend memory — disposition: accept, with URL.revokeObjectURL called on unmount).

## Self-Check

- [x] `frontend/src/pages/ExamRoom/components/GuidanceToggle.tsx` exists
- [x] `frontend/src/pages/ExamRoom/components/TTSControls.tsx` exists
- [x] `frontend/src/pages/ExamRoom/components/CTAButton.tsx` exists
- [x] `frontend/src/pages/ExamRoom/index.tsx` exists (replaced placeholder)
- [x] Commit dcf77b4 exists: `feat(02-03): create GuidanceToggle, TTSControls, and CTAButton components`
- [x] Commit c4e2f4d exists: `feat(02-03): create ExamRoomPage orchestrator with full API integration`
- [x] Commit 1797adb exists: `fix(02-03): remove redundant wrapper negative margins to prevent double-offset with RedBander`
- [x] TypeScript compilation passes: `cd frontend && npx tsc --noEmit` exits 0
