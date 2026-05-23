# Phase 1: Foundation + Question Bank - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 01-foundation-question-bank
**Areas discussed:** 前端框架选择, 项目目录结构, 题库数据加载方式, 选题 UI 交互

---

## 前端框架选择

| Option | Description | Selected |
|--------|-------------|----------|
| React | 生态系统最大，组件库丰富（shadcn/ui, Ant Design），TypeScript 支持最佳 | ✓ |
| Vue | 中文生态更友好，上手简单，官方中文文档完善，国内社区活跃 | |
| Svelte 或其他 | 新兴框架，性能好，但对国内生态的支持还在发展中 | |

**User's choice:** React
**Notes:** None

### UI 组件库

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/ui | Headless component primitives, Tailwind-based, fully customizable, TypeScript-first | |
| Ant Design | Alibaba出品，中文生态最完善的组件库，开箱即用 | ✓ |
| Tailwind 手写 | 不使用组件库，纯 Tailwind CSS 手写组件 | |

**User's choice:** Ant Design
**Notes:** 一致于中文政府考试场景

### 构建工具

| Option | Description | Selected |
|--------|-------------|----------|
| Vite | React 官方推荐，速度快，零配置，社区主流 | ✓ |
| Next.js | Next.js 全栈框架，SSR/SSG 能力（v1 可能用不上） | |
| CRA | Create React App 已不再维护，不推荐 | |

**User's choice:** Vite
**Notes:** SPA 模式

### 路由与状态管理

| Option | Description | Selected |
|--------|-------------|----------|
| RR + Zustand | React Router + Zustand — 轻量灵活，适合 SPA | ✓ |
| TanStack 系列 | TanStack Router + Context — 类型安全路由 + 内置状态 | |
| Next.js（全栈） | Next.js — 自带路由，但引入了 SSR 复杂度 | |

**User's choice:** React Router + Zustand
**Notes:** None

---

## 项目目录结构

| Option | Description | Selected |
|--------|-------------|----------|
| backend + frontend | backend/ + frontend/ 各自独立，清晰分离，最直观 | ✓ |
| Monorepo (pnpm workspaces) | packages/backend + packages/frontend，适合未来扩展更多包 | |
| 单一项目 | 单项目混合结构（如 Next.js 的 api/ routes），耦合度高不推荐 | |

**User's choice:** backend/ + frontend/
**Notes:** 清晰分离

### 前端内部结构

| Option | Description | Selected |
|--------|-------------|----------|
| 按功能组织 | 按功能组织（pages/QuestionBank, components/ExamRoom），便于扩展 | ✓ |
| 按技术类型 | 按技术类型组织（components/, pages/, hooks/, utils/），传统结构 | |
| 路由扁平结构 | 路由即目录结构，每个路由一个文件夹包含所有相关文件 | |

**User's choice:** 按功能组织

### 后端内部结构

| Option | Description | Selected |
|--------|-------------|----------|
| FastAPI 标准 | app/routers/ + app/models/ + app/services/ — FastAPI 标准结构 | ✓ |
| 极简起步 | 极简扁平结构，单文件起步，够用时再拆分 | |

**User's choice:** FastAPI 标准结构

---

## 题库数据加载方式

### 数据服务

| Option | Description | Selected |
|--------|-------------|----------|
| 静态 JSON 嵌入 | 构建时将 JSONL 转为 JSON 嵌入前端，零延迟，16 道题数据量小 | ✓ |
| 后端内存加载 + API | FastAPI 从 JSONL 文件读取，启动时加载到内存，走 API 查询 | |
| SQLite 数据库 | SQLite 存储题目数据，支持未来查询、筛选、扩展 | |

**User's choice:** 静态 JSON 嵌入
**Notes:** 16 道题，数据量小，不需要数据库

### Backend 角色

| Option | Description | Selected |
|--------|-------------|----------|
| 搭建后端骨架 | Phase 1 后端就搭好 FastAPI 骨架（健康检查、基础路由），为后续 TTS/评分接口做准备 | ✓ |
| Phase 1 纯前端 | Phase 1 纯前端，后端在 Phase 2 或 Phase 3 再引入 | |
| 仅 JSON 文件，无后端 | 生成一个 JSON 文件放到前端 public/ 目录 | |

**User's choice:** 搭建后端骨架
**Notes:** Backend scaffold for future phases

---

## 选题 UI 交互

### 选题布局

| Option | Description | Selected |
|--------|-------------|----------|
| 表格 + 复选框 | Ant Design Table 带 checkbox，紧凑高效，适合题目列表浏览 | ✓ |
| 卡片网格 | 每道题一张 Card，可展开查看详情，视觉更丰富 | |
| 简洁列表 | 简单列表，点击选中/取消，适合移动端或窄屏 | |

**User's choice:** 表格 + 复选框

### 详情展开

| Option | Description | Selected |
|--------|-------------|----------|
| 点击展开详情 + 确认选取 | 弹窗展示题目全文、评分要点，用户确认后再选中 | ✓ |
| 表格内预览，直接勾选 | 表格行直接展示题目文本预览（截断），直接勾选即可 | |
| 两步流程 | 表格显示基本信息，选中后进入确认页，统一确认选题 | |

**User's choice:** 点击展开详情 + 确认选取

### 选题约束

| Option | Description | Selected |
|--------|-------------|----------|
| 强制 3-4 道 | 后台强制 3-4 道，选少了提示、选多了禁用额外选择 | ✓ |
| 柔性限制 1-4 道 | 允许选 1-4 道，给用户更多自由度 | |
| 无限制 | 不做限制，用户自选数量 | |

**User's choice:** 严格 3-4 道
**Notes:** 模拟真实面试（3-4 道题）

---

## Claude's Discretion

None — all decisions were explicitly selected by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
