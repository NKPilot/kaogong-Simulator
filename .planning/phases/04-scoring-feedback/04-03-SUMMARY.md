---
phase: 04-scoring-feedback
plan: 03
type: execute
subsystem: frontend
tags: [scoring, ui, components, react]
requires: [04-02]
provides: [CoverageDots, ScoringCard, PendingCard, ErrorCard]
affects: [04-04]
tech-stack:
  added: []
  patterns: [CSS-in-JS, inline React.CSSProperties, prefers-reduced-motion animation gating]
decisions:
  - CoverageVerdict colors match UI-SPEC: green #52C41A / orange #FA8C16 / red #FF4D4F
  - Card entry animation uses 300ms ease-out fade+translateY per UI-SPEC contract
  - ErrorCard uses 200ms ease-out fade-only (no translateY) per UI-SPEC error animation contract
  - All components use Ant Design v5 Card/Typography/Collapse/Button/Skeleton/Spin
  - Animation gated by matchMedia('(prefers-reduced-motion: reduce)') consistent with Phase 3 TransitionPage
metrics:
  duration: ~10 min
  completed: "2026-05-24T03:34:49Z"
  tasks: 2
  files: 4
key-files:
  created:
    - frontend/src/pages/ScoringResults/components/CoverageDots.tsx
    - frontend/src/pages/ScoringResults/components/ScoringCard.tsx
    - frontend/src/pages/ScoringResults/components/PendingCard.tsx
    - frontend/src/pages/ScoringResults/components/ErrorCard.tsx
  modified: []
---

# Phase 04 Plan 03: Scoring Result Leaf Components

Four visual building blocks for the scoring results card waterfall.

## Completed Tasks

| Task | Name | Type | Commit | Files |
|------|------|------|--------|-------|
| 1 | CoverageDots + ScoringCard | auto | d50a63a | CoverageDots.tsx, ScoringCard.tsx |
| 2 | PendingCard + ErrorCard | auto | 000aa04 | PendingCard.tsx, ErrorCard.tsx |

## What Was Built

### CoverageDots.tsx
Per-point coverage dot visualization. Renders each `CoveragePoint` as a flexbox row with:
- 12px diameter colored dot (`borderRadius: '50%'`) — green/orange/red per verdict
- Status label: "已覆盖" (COVER), "部分覆盖" (PARTIAL), "未覆盖" (MISS)
- Point text: `{section} — {text}` concatenated with em-dash

Props: `{ coverage: CoveragePoint[] }`

### ScoringCard.tsx
Full scored question result card composing multiple sections:
1. Question title (Typography.Title level={4})
2. Coverage fraction — `{coveredCount} / {totalCount} 已覆盖` in 28px/700, number in accent #BE1E2D
3. CoverageDots component
4. LLM feedback section (label "文字反馈" + body text)
5. Collapsible ASR transcript (Ant Design Collapse, default collapsed, header "语音识别原文")
6. "重新评分" button (Ant Design Button type="primary")

Props: `{ result: ScoringResult, animationDelay?: number, onRescore: () => void }`
Animation: fade-in + translateY(8px->0) 300ms ease-out, gated by prefers-reduced-motion

### PendingCard.tsx
Loading skeleton state for in-progress scoring. Renders:
- Question title
- Spin indicator + "评分中..." text in flex layout
- Ant Design Skeleton active with 3 paragraph rows

Props: `{ questionTitle: string, animationDelay?: number }`

### ErrorCard.tsx
Error state card with retry for failed scoring. Renders:
- Question title
- CloseCircleOutlined icon (24px, red #FF4D4F)
- "评分失败" heading (16px/700, red #FF4D4F)
- Optional error detail message (13px, secondary color)
- "点击重试" button (red outline: borderColor and color #FF4D4F)

Props: `{ questionTitle: string, errorMessage?: string, animationDelay?: number, onRetry: () => void }`
Animation: fade-only 200ms ease-out, gated by prefers-reduced-motion

## Design Conventions Followed

- All styles: inline `React.CSSProperties` objects (CSS-in-JS pattern from Phases 1-3)
- No external CSS files, no CSS modules, no styled-components, no Tailwind
- Ant Design v5 components: Card, Typography (Title, Text), Collapse, Button, Skeleton, Spin
- @ant-design/icons: CloseCircleOutlined for error state
- Color tokens: accent #BE1E2D, semantic green/orange/red, text primary #262626, text secondary #8C8C8C, border #E8E8E8
- Spacing: xs=4px, sm=8px, md=16px, lg=24px
- Typography: Card Heading 16px/700, Score Display 28px/700, Body 14px/400, Label 13px/400
- Reduced motion: `matchMedia('(prefers-reduced-motion: reduce)')` check with listener

## Verification

- TypeScript compilation: `cd frontend && npx tsc --noEmit` — passed with zero errors
- All four components type-check against interfaces from `src/types/scoring.ts` (created by Plan 04-02)
- Component signatures match the prop interfaces specified in the plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree path misalignment for Write operations**
- **Found during:** Task 1 and Task 2 file creation
- **Issue:** Initial Write operations used absolute paths pointing to the main repo (`/home/he/workwork/interview-simulator/frontend/...`) instead of the worktree directory (`/home/he/workwork/interview-simulator/.claude/worktrees/agent-.../frontend/...`). Files were silently written to the wrong location and git could not see them from the worktree context.
- **Fix:** Re-derived absolute paths from `git rev-parse --show-toplevel` (worktree root). Recreated all files at correct worktree paths.
- **Files affected:** All four component files (created twice — once at wrong path, once corrected)

**2. [Rule 3 - Blocking] Worktree node_modules missing**
- **Found during:** Task 2 TypeScript verification
- **Issue:** The git worktree did not include `node_modules` (it's in .gitignore). `npx tsc` failed because TypeScript was not installed in the worktree.
- **Fix:** Ran `npm install` in the worktree's `frontend/` directory to install all dependencies.
- **Files affected:** None (infrastructure only)

**3. [Rule 3 - Blocking] Worktree HEAD drifted to master branch**
- **Found during:** Task 1 commit
- **Issue:** The worktree was initially set up on the `master` branch instead of the `worktree-agent-*` branch. The first commit initially landed on `master`.
- **Fix:** Used `git checkout -B worktree-agent-a0d0383916dce8ca1` to move the worktree branch forward to the commit. Did NOT use `git update-ref` on master (per #2924 prohibition). Subsequent commits went to the worktree branch correctly.
- **Files affected:** None (branch metadata only)

## Threat Flags

None — all threat surfaces match the plan's threat model. Components render text via React's default JSX escaping (no `dangerouslySetInnerHTML`). The retry button delegates to the parent via callback, which handles pending state per T-04-11 mitigation plan.

## Known Stubs

None — all four components are fully wired to their props interfaces. They are presentational leaf components that receive data from parent; no hardcoded empty values, no placeholder text, no TODOs/FIXMEs.
