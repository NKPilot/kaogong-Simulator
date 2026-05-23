<!-- GSD:project-start source:PROJECT.md -->
## Project

**考公面试模拟器 (Civil Service Exam Interview Simulator)**

一个面向公务员考试备考的面试模拟器，使用真实省考面试真题，通过数字人考官朗读题目、考生语音作答、限时答题、最终评分的流程，为考生提供接近真实考场的模拟面试体验。v1 阶段聚焦于江苏省考面试真题中有评分要点的 16 道题目，实现从选题到评分的完整闭环。

**Core Value:** 让考生能够在接近真实考场的环境中练习面试——用真题练、有考官念题、有时间压力、有打分反馈。

### Constraints

- **后端**：FastAPI + uv 管理依赖
- **前端**：Web 技术栈
- **数字人**：优先使用第三方 API（如阿里 DashScope），考官只需念题，v1 可用静态图或简单动图
- **语音**：TTS 朗读题目 + 考生录音作答
- **评分数据**：v1 仅使用已有 score_points 的 16 道题
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
