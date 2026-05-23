# Phase 2: Virtual Exam Room - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

## Phase Boundary

This phase delivers the virtual exam room entry experience — after selecting questions in Phase 1, users enter a first-person-perspective exam room view with 5 examiner images, hear TTS guidance audio (welcome message + exam rules), can toggle guidance text visibility, and proceed to the first question when ready.

**Requirements mapped:** FLOW-01, FLOW-02, UI-01

## Implementation Decisions

### 考官形象 (Examiner Images)
- **D-01:** 5 位正装考官半身照，从 `frontend/public/examiners/` 目录随机选取
- **D-02:** 默认提供 5 张占位图（silhouette/轮廓风格），用户可自行替换为 AI 生成照片
- **D-03:** 桌面 + 名牌含在图片内（用户生成的图片自带桌面和名牌），前端不单独用 CSS 渲染
- **D-04:** 名牌文字：中间"主考官"，两侧"考官"（与参考图一致）
- **D-05:** 不限制图片规格，前端用 CSS 统一裁剪/适配
- **D-06:** 风格按参考图：深色正装、中性表情、浅灰背景

### 考场布局 (Room Layout)
- **D-07:** 保留 AppLayout 顶栏"江苏公务员面试模拟器"
- **D-08:** 复刻参考图结构：红底白字横幅"2025公务员模拟面试" → 5 考官席位 → 底部控制区
- **D-09:** 第一人称视角，宽屏自适应（最大宽度约 1200px），桌面端体验优先
- **D-10:** 引导语文字默认隐藏，通过可展开/收起按钮切换显示
- **D-11:** 从选题页到考场有进场过渡动画

### TTS 引导语朗读 (TTS Guidance Audio)
- **D-12:** 后端代理阿里 DashScope TTS API（保护 API Key）
- **D-13:** 新建 `POST /api/tts/synthesize` 端点，接收文本，流式返回音频
- **D-14:** 男声正式风格（稳重、播音感）
- **D-15:** 完整播放控件（播放/暂停/重播），页面加载后自动播放引导语
- **D-16:** TTS 调用失败静默降级，不阻塞用户体验，仅展示文字提示

### 引导语内容 (Guidance Content)
- **D-17:** 标准公务员面试开场引导语（欢迎词 + 考试规则说明 + 宣布面试开始）
- **D-18:** `GET /api/interview/guidance?question_count=N` 返回结构化 JSON：`{ title, paragraphs[] }`
- **D-19:** 动态引用用户已选题数量（如"本次面试共 4 道题"）
- **D-20:** 引导语文本 API 与 TTS 合成 API 独立分离，前端先取文本再调 TTS

### Claude's Discretion

- 音频流式传输的具体实现方式（chunked transfer encoding）
- 占位图的具体视觉风格（silhouette 颜色、大小）
- 进场动画的具体形式（fade-in, scale-up 等）
- TTS 音频缓存策略

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目需求
- `.planning/PROJECT.md` — 项目全景、核心价值、约束条件
- `.planning/REQUIREMENTS.md` — v1 全部 20 条需求，含 FLOW-01, FLOW-02, UI-01 的具体定义
- `.planning/ROADMAP.md` — Phase 2 成功标准

### 参考设计
- `image.png` — **用户提供的理想 UI 效果参考**（5 位数字人考官、红底横幅、1/3 进度、结构化面试题展示）。Phase 2 复刻其考场布局结构

### Phase 1 上下文
- `.planning/phases/01-foundation-question-bank/01-CONTEXT.md` — Phase 1 技术决策（React + Vite + Ant Design + Zustand + React Router，frontend/backend 分离）
- `.planning/STATE.md` — 项目状态、进度 25%

### TTS 服务
- 阿里 DashScope TTS API 文档 — 语音合成、音色选择、流式输出

## Existing Code Insights

### Reusable Assets
- **`useQuestionBankStore`** — 已选题目的 ID 列表和题目数据，考场页需要从中读取选中的题目数量和内容
- **`AppLayout`** — 顶栏"江苏公务员面试模拟器"直接复用
- **`/exam-room` 路由** — 已定义，指向占位 ExamRoomPage
- **`SelectionPanel` 的"开始面试"按钮** — 已实现 navigate('/exam-room')

### Established Patterns
- **Zustand store with `get()` pattern** — 非组件代码通过 `useQuestionBankStore.getState()` 访问 store
- **Ant Design ConfigProvider wrapping** — 全局主题已配置
- **Feature-based page organization** — `pages/ExamRoom/` 目录结构，components/ 子目录放子组件
- **CSS-in-JS (inline styles)** — Phase 1 使用 Ant Design + inline style 对象，Phase 2 保持一致

### Integration Points
- **路由**: `/exam-room` → ExamRoomPage（需替换占位实现）
- **状态**: 从 `useQuestionBankStore` 读取 `selectedIds` 和 `questions`
- **导航**: "开始面试"按钮已在 SelectionPanel 中实现，无需修改
- **后端**: 新建 TTS 和 guidance 两个 API 端点
- **前端 API 层**: 在 `frontend/src/api/` 下新增 TTS 和 interview API 模块

## Specific Ideas

- 参考图 `image.png` 的考场布局是 Phase 2 的核心设计参照：红底横幅 + 5 考官席位 + 桌面名牌 + 底部文字区。Phase 2 复刻这个布局结构，但不包含题目内容区域（那是 Phase 3 的题目展示区）
- 引导语可展开设计：用户先听到 TTS 朗读，需要时可以展开查看文字。这模拟了真实考场中"听考官说话"的体验
- 考场氛围：第一人称视角让用户感觉坐在考生席面对考官，深色桌面在前景

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 2-Virtual Exam Room*
*Context gathered: 2026-05-23*
