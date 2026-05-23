---
phase: 03
plan: 04
subsystem: frontend
tags:
  - ui-components
  - question-drawer
  - progress-indicator
  - status-text
  - transition-page
  - mic-error
requires:
  - 03-02 (types/interview.ts QuestionStatus type)
  - antd (Drawer, Steps, Button, Typography)
  - @ant-design/icons (UpOutlined, DownOutlined, WarningOutlined)
affects:
  - 03-05 (orchestrator component integrates these)
key-files:
  created:
    - frontend/src/pages/QuestionInterview/components/QuestionDrawer.tsx
    - frontend/src/pages/QuestionInterview/components/ProgressIndicator.tsx
    - frontend/src/pages/QuestionInterview/components/StatusTextBar.tsx
    - frontend/src/pages/QuestionInterview/components/TransitionPage.tsx
    - frontend/src/pages/QuestionInterview/components/MicPermissionError.tsx
  modified: []
decisions: []
metrics:
  duration: null
  completed_date: "2026-05-23"
---

# Phase 3 Plan 04: Information and Navigation Display Components Summary

Five standalone UI components for the question-by-question interview flow: question text drawer, progress indicator, status text bar, transition page, and microphone permission error state.

## Tasks Completed

### Task 1: QuestionDrawer component
- **File:** `frontend/src/pages/QuestionInterview/components/QuestionDrawer.tsx` (96 lines)
- **Commit:** `ac5378c`
- Ant Design `Drawer` with `placement="bottom"`, `height="auto"`
- Trigger button toggles between "查看题目" / "收起题目" with `UpOutlined`/`DownOutlined` icons
- Drag handle bar at top center (32x4px, `#D9D9D9`, border-radius 2px)
- "题目：" prefix label in 14px semibold, color `#BE1E2D`
- Question title in 14px semibold, question fullText in 16px/400/1.6
- Fallback "暂无题目文本" in `#8C8C8C` when `questionText` is empty
- `aria-expanded` on trigger button
- Overlay `rgba(0,0,0,0.45)` handled by Ant Drawer natively

### Task 2: ProgressIndicator and StatusTextBar components
- **Files:** `ProgressIndicator.tsx` (51 lines), `StatusTextBar.tsx` (64 lines)
- **Commit:** `94d1bce`
- ProgressIndicator:
  - Ant Design `Steps` with `type="default"`, `size="small"`, `direction="horizontal"`
  - Correct `finish`/`process`/`wait` status mapping for each step
  - "第 {current+1}/{total} 题" text in 14px, color `#8C8C8C`
  - Returns `null` when `total === 0`
- StatusTextBar:
  - Maps `QuestionStatus` to dynamic status text
  - TTS error fallback: "题目朗读失败，可查看下方题目文字" when `ttsError=true` and `questionStatus='reading'`
  - Thinking: "思考时间剩余 {M:SS}"
  - Answering: "答题时间剩余 {M:SS}"
  - `formatTime` helper converts seconds to `M:SS`
  - Returns `null` for idle/transition/complete phases

### Task 3: TransitionPage and MicPermissionError components
- **Files:** `TransitionPage.tsx` (84 lines), `MicPermissionError.tsx` (42 lines)
- **Commit:** `56e5e68`
- TransitionPage:
  - Full-viewport overlay with fadeIn animation (300ms ease-out)
  - Heading: "第 X 题完成" (normal) / "所有题目作答完毕" (last question)
  - Steps dots showing completed state for all questions
  - Subtitle: "下一题即将开始..." / "即将进入评分环节..."
  - `@media (prefers-reduced-motion)` disables animation
  - Returns `null` when `visible=false`
- MicPermissionError:
  - `WarningOutlined` icon at 24px, color `#FA8C16`
  - Error message: "麦克风权限被拒，请开启麦克风权限后重试"
  - "重试" primary button calling `onRetry`
  - No skip option (conforms to D-09)
  - Returns `null` when `visible=false`

## Verification

- `npx tsc --noEmit`: exit 0 (no errors)
- All 5 component files exist in `frontend/src/pages/QuestionInterview/components/`
- Component line counts meet or exceed plan minimums:
  - QuestionDrawer: 96 >= 60
  - ProgressIndicator: 51 >= 50
  - StatusTextBar: 64 >= 40
  - TransitionPage: 84 >= 50
  - MicPermissionError: 42 >= 40

## Deviations from Plan

None — plan executed exactly as written.

## Key Design Decisions

- QuestionDrawer wraps both trigger button and Drawer as a fragment (trigger rendered outside Drawer in page layout)
- ProgressIndicator uses Ant Steps `items` prop with explicit `status` for each step
- TransitionPage uses inline `<style>` tag for CSS animation keyframes to avoid external CSS dependencies
- MicPermissionError uses `WarningOutlined` per UI-SPEC C-07 (Alternative to `AudioMutedOutlined`)

## Known Stubs

None.

## Threat Flags

None. All components are pure presentational — no new network endpoints, auth paths, or security-relevant surface.

## Self-Check: PASSED

- All 5 files exist and are readable
- All 3 commit hashes confirmed in git log
- TypeScript compilation passes with exit 0
