# Phase 1: Foundation + Question Bank - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

## Phase Boundary

This phase delivers the project scaffold (FastAPI backend + React frontend) and the question browsing/selection capability. Users can browse the 16 available questions and select exactly 3-4 to start a simulated interview session.

**Requirements mapped:** QB-01, QB-02

## Implementation Decisions

### 前端技术栈 (Frontend Stack)
- **D-01:** React 作为前端框架
- **D-02:** Vite 作为构建工具（SPA 模式）
- **D-03:** Ant Design 作为 UI 组件库
- **D-04:** React Router 管理路由
- **D-05:** Zustand 管理前端状态

### 项目目录结构 (Project Structure)
- **D-06:** 根目录下 `backend/` + `frontend/` 分离结构
- **D-07:** 前端内部按功能组织（`pages/QuestionBank`, `components/ExamRoom` 等）
- **D-08:** 后端内部使用 FastAPI 标准结构（`app/routers/`, `app/models/`, `app/services/`）

### 题库数据加载 (Data Loading)
- **D-09:** 将 docs 中的 records.jsonl（仅 16 道有 score_points 的题）提取为静态 JSON 文件
- **D-10:** JSON 文件嵌入前端 `public/` 或 `src/data/` 目录，前端直接引用
- **D-11:** Backend 在 Phase 1 搭建 FastAPI 骨架（健康检查、基础路由结构），为后续 TTS/评分 API 做准备

### 选题交互设计 (Selection UX)
- **D-12:** Ant Design Table + checkbox 作为选题主交互
- **D-13:** 点击题目行展开详情（题目全文、类型、年份），用户确认后再勾选
- **D-14:** 严格限制选择 3-4 道题，选少了提示、选多了禁用额外勾选

### Claude's Discretion

None — all decisions were explicitly selected by the user.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目需求
- `.planning/PROJECT.md` — 项目全景、核心价值、约束条件
- `.planning/REQUIREMENTS.md` — v1 全部 20 条需求，含 QB-01, QB-02 的具体定义
- `.planning/ROADMAP.md` — 4 个 Phase 的完整结构和 Phase 1 成功标准
- `.planning/config.json` — 工作流配置（YOLO 模式、balanced 模型等）

### 题目数据
- `docs/省考数据_整理结果/records.jsonl` — 227 道江苏真题完整数据，Phase 1 仅用其中 16 道有 score_points 的题目
- `docs/省考数据_整理结果/parse_report.json` — 数据解析报告（记录数、题目分类等）

### 参考设计
- `image.png` — 用户提供的理想 UI 效果参考（5 位数字人考官面试界面）

### 前端框架文档 (Context7)
- Ant Design React docs — 表格、复选框、弹窗组件
- React Router v6 docs — SPA 路由
- Zustand docs — 状态管理

## Existing Code Insights

Greenfield project — no existing code. All patterns and structures are being established in this phase.

## Specific Ideas

- 用户提供了真实的面试流程（问好入座 → 听题/看题 → 思考作答），Phase 1 暂不实现，但选题界面设计应为此留好入口（如「开始面试」按钮）
- 参考图片 `image.png` 中的 UI 风格：红底横幅标题、考官席布局、进度条（1/3）。Phase 1 不实现此 UI，但整体设计语言应保持一致

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 1-Foundation + Question Bank*
*Context gathered: 2026-05-23*
