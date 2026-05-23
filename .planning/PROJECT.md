# 考公面试模拟器 (Civil Service Exam Interview Simulator)

## What This Is

一个面向公务员考试备考的面试模拟器，使用真实省考面试真题，通过数字人考官朗读题目、考生语音作答、限时答题、最终评分的流程，为考生提供接近真实考场的模拟面试体验。v1 阶段聚焦于江苏省考面试真题中有评分要点的 16 道题目，实现从选题到评分的完整闭环。

## Core Value

让考生能够在接近真实考场的环境中练习面试——用真题练、有考官念题、有时间压力、有打分反馈。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 用户可以从题库中选择题目的组合进行模拟面试
- [ ] 数字人考官（静态图/简单动图）念出题目，用户可切换是否显示题目文本
- [ ] 每道题有限时作答（思考 1-2 分钟 + 答题 2-3 分钟），考生语音回答
- [ ] 题目逐题进行，全部作答后统一评分
- [ ] 基于已有评分要点（score_points）对比考生回答内容进行打分和反馈
- [ ] 模拟真实面试流程：问好入座 → 听题/看题 → 思考作答 → 结束

### Out of Scope

- AI 实时追问对话 — v1 考官只念题，无互动追问
- 3D 数字人渲染 — v1 使用静态图片或简单动图
- 除 16 道有 score_points 以外的题目 — 后续扩展
- 多平台部署 — v1 本地开发/演示为主

## Context

- **题目数据**：`docs/省考数据_整理结果/records.jsonl` 包含 227 道江苏公务员面试真题（2018-2025），每道题含题目文本、审题要点、参考答案、思维导图。其中 16 道有明确的 score_points（评分要点），v1 仅使用这 16 道。
- **题目类型**：A 类、B 类执法岗、C 类乡镇岗、结构化小组、法检等
- **真实面试流程**：15-20 分钟，3-4 道题。步骤含问好入座→主考官宣读引导语→逐题听题/看题→思考作答（每道思考 1-2 分钟、答题 2-3 分钟）→部分岗位有追问→退场
- **参考设计**：项目根目录下的 `image.png` 展示了理想的面试模拟器 UI 效果（5 位 3D 数字人考官）
- **目标用户**：初期自己使用和验证，远期做成 SaaS 产品

## Constraints

- **后端**：FastAPI + uv 管理依赖
- **前端**：Web 技术栈
- **数字人**：优先使用第三方 API（如阿里 DashScope），考官只需念题，v1 可用静态图或简单动图
- **语音**：TTS 朗读题目 + 考生录音作答
- **评分数据**：v1 仅使用已有 score_points 的 16 道题

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1 仅用 16 道有评分要点的题目 | 先跑通完整链路，验证可行性 | — Pending |
| 数字人考官用静态图/简单动图而非 3D 渲染 | 大幅降低复杂度，考官只需念题无需高交互 | — Pending |
| 第三方数字人 API 优先 | 快速上线，避免自研渲染引擎 | — Pending |
| FastAPI + uv 后端 | 用户偏好 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-23 after initialization*
