---
phase: 2
slug: virtual-exam-room
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react |
| **Config file** | `frontend/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run`
- **After every plan wave:** Run `cd frontend && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | FLOW-01 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | UI-01 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | FLOW-02 | T-02-01 | API key never sent to frontend | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | FLOW-01, FLOW-02 | — | N/A | manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/vitest.config.ts` — vitest configuration
- [ ] `frontend/src/pages/ExamRoom/__tests__/ExaminerRow.test.tsx` — image rendering, count, labels
- [ ] `frontend/src/pages/ExamRoom/__tests__/GuidanceToggle.test.tsx` — expand/collapse toggle
- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — framework install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TTS audio autoplay on page load | FLOW-02 | Browser autoplay policy is environment-dependent; cannot be reliably tested in jsdom | Navigate from Phase 1 "开始面试" → verify audio plays. If blocked, verify "点击播放" overlay appears |
| Entry animation visible | FLOW-01 | CSS animation fidelity is visual; jsdom doesn't render animations | Navigate to /exam-room → verify fade-in + scale-up over 600ms |
| CTA navigation to Phase 3 | FLOW-01 | Route change requires full app context; test via browser | Click "开始答题" → verify navigation to next route |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
