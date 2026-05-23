# Phase 3: Question-by-Question Interview - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

## Phase Boundary

本阶段实现面试的核心循环——每道题依次进行 TTS 念题、限时思考、语音作答、逐题推进。用户完成所有选题后自动过渡到评分阶段（Phase 4）。

**需求映射：** FLOW-03, FLOW-04, VOICE-01, VOICE-02, VOICE-03, TIMER-01, TIMER-02, TIMER-03, UI-02, UI-03, UI-04

## Implementation Decisions

### 计时器（TIMER-01/02/03, UI-03）
- **D-01:** 固定时长——思考 2 分钟，答题 3 分钟。不可配置。
- **D-02:** 环形进度圈展示倒计时，中间显示剩余 MM:SS。
- **D-03:** 剩余 30s 变橙色+脉冲动画，剩余 10s 变红色+快速脉冲，归零自动过渡到下一阶段。
- **D-04:** 每个阶段计时器自动开始（念题结束后自动开始思考，思考结束后自动开始答题）。

### 语音录制（VOICE-02）
- **D-05:** 浏览器端 MediaRecorder API 录制，答题结束后后台静默上传至后端。
- **D-06:** 音频格式 WebM/Opus，不转码。
- **D-07:** 存储路径：`recordings/{session_id}/q{n}.webm`，按面试会话分目录。
- **D-08:** 录音中展示红色录音指示灯（闪烁圆点）+ 已录时长 + 声波/音量可视化。
- **D-09:** 麦克风权限被拒时显示引导文字教用户开启权限 + 重试按钮。不提供跳过录音的降级路径。
- **D-10:** 上传在后台静默进行，不阻塞进入下一题。

### 题目展示与布局（FLOW-04, UI-02, UI-04）
- **D-11:** 题目浮层+极简主界面。主界面保留考官席（缩小版）、计时环形进度圈、录音状态、进度指示器。
- **D-12:** 题目文本通过底部抽屉上滑展示，点击「查看题目」按钮触发，下滑关闭。
- **D-13:** 每道新题开始时题目默认隐藏，用户以听 TTS 为主。想看时可手动展开抽屉。
- **D-14:** 进度指示器使用 Ant Design Steps 组件横向展示圆点（已完成/当前/未开始）+ 「第 2/4 题」文字。

### 流程与状态机（FLOW-03, VOICE-01, VOICE-03）
- **D-15:** 每道题分 4 个阶段：① TTS 念题（不占计时）→ ② 思考（2min 倒计时）→ ③ 答题（3min 倒计时+录音）→ ④ 本题完成。
- **D-16:** 答完后展示过渡页（「第 X 题完成」+ 进度），2-3 秒后自动跳到下一题念题。
- **D-17:** 仅思考阶段可请求重读题目（限 1 次），重读后思考计时器重置为 2 分钟从零开始。
- **D-18:** 不支持中途会话恢复。刷新页面或关闭浏览器即回到首页重新选题。

### Claude's Discretion

- 过渡页的具体视觉设计和动画时长
- 录音声波可视化的具体实现方式（CSS 动画 vs Canvas）
- 底部抽屉的动画曲线和高度
- 后端录音上传 API 的具体端点设计
- 面试 session_id 的生成方式

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目需求
- `.planning/PROJECT.md` — 项目全景、核心价值、约束条件
- `.planning/REQUIREMENTS.md` — v1 全部 20 条需求，含 Phase 3 的 11 条需求定义
- `.planning/ROADMAP.md` — Phase 3 成功标准（8 条 SC）

### Phase 1 & 2 上下文
- `.planning/phases/01-foundation-question-bank/01-CONTEXT.md` — 技术栈决策（React + Vite + Ant Design + Zustand + React Router，前后端分离）
- `.planning/phases/02-virtual-exam-room/02-CONTEXT.md` — TTS（DashScope longxiaocheng_v2）、考场布局（5考官第一人称）、进场过渡

### 参考设计
- `image.png` — 理想 UI 效果参考（考场布局、红底横幅），Phase 3 在其基础上加入题目浮层和计时录音控制

### TTS 服务
- 阿里 DashScope TTS API — 语音合成、音色 longxiaocheng_v2
- `backend/app/routers/tts.py` — 现有 POST /api/tts/synthesize 端点
- `frontend/src/api/ttsApi.ts` — 现有 synthesizeSpeech() 函数

## Existing Code Insights

### Reusable Assets
- **`useQuestionBankStore`** — 已选题目 ID 列表和题目数据（含 fullText），面试页从此读取要逐题进行的题目
- **`synthesizeSpeech()`** — TTS API 已封装，传入文本返回 ArrayBuffer，可直接用于念题
- **`AppLayout`** — 顶栏「江苏公务员面试模拟器」直接复用
- **`ExamRoomPage`** — 已有音频播放管理逻辑（Audio 元素、播放/暂停/重播/自动播放被阻处理），念题阶段可复用此模式
- **`ExaminerRow`** / **`RedBanner`** — 考场视觉组件，在答题页缩小复用
- **`CTAButton`** — 已导航到 `/exam-room/question/1`

### Established Patterns
- **Zustand store with `get()` pattern** — 非组件代码通过 `useQuestionBankStore.getState()` 访问
- **Ant Design ConfigProvider wrapping** — 全局主题已配置
- **Feature-based page organization** — `pages/ExamRoom/` 目录结构，components/ 子目录
- **CSS-in-JS (inline styles)** — 保持与 Phase 1/2 一致的样式方式
- **API client 模式** — 每个 API 域独立模块（ttsApi.ts, guidanceApi.ts 等）
- **Audio 元素管理** — 使用 useRef + useEffect 创建隐藏 audio 元素，事件驱动状态更新

### Integration Points
- **路由**: `/exam-room/question/1` — CTA 已导航到此处，需创建 QuestionInterviewPage
- **状态**: 从 `useQuestionBankStore` 读取 `selectedIds` 和 `questions`，需新增面试状态（当前题号、阶段、计时状态）
- **TTS API**: 复用 `POST /api/tts/synthesize` 念每道题的 fullText
- **新后端端点**: `POST /api/recording/upload` — 接收录音文件并保存到 `recordings/{session_id}/`
- **前端新 API 模块**: recordingApi.ts — 上传录音到后端
- **页面出口**: 最后一题完成后导航到 Phase 4 评分页（路由待定，如 `/results`）

## Specific Ideas

- 面试流程完全模拟真实考场体验：听考官念题（TTS）→ 思考 → 作答。题目文本默认隐藏，用户以听为主，需要时可以看。这对应真实考场中考生不能一直盯着题本的状态。
- 计时器用环形进度圈而非简单数字钟——让用户对剩余时间有直观感知，产生适度的时间压力，但不过度焦虑。
- 每道题之间的过渡页（2-3s）给用户一个心理缓冲，模拟真实考场中「下一题」的停顿感。

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 3-Question-by-Question Interview*
*Context gathered: 2026-05-23*
