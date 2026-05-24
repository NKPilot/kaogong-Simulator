# Phase 4: Scoring & Feedback - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

## Phase Boundary

本阶段实现面试评分闭环——每道题答完后自动触发 ASR 语音识别 + LLM 采分点比对，最终在结果页以卡片瀑布流展示逐题得分和反馈。评分在最后一题完成前就已在后台异步进行，进入结果页时大部分结果已就绪。

**需求映射：** SCORE-01, SCORE-02, SCORE-03, UI-05

## Implementation Decisions

### 评分引擎
- **D-01:** 使用 LLM 语义匹配（DashScope Qwen），对比考生回答和 scorePoints 采分点大纲。不用规则/关键词匹配。
- **D-02:** 逐采分点覆盖判断——每个采分点评 "已覆盖/部分覆盖/未覆盖"，最终得分 = 覆盖率。
- **D-03:** ASR 容错——LLM 评分时忽略同音错别字，按语义而非字面匹配。ASR 识别错误不影响评分公正性。
- **D-04:** 逐题异步评分——每道题答完、录音上传后立即触发 ASR+LLM 评分流程，结果存入后端。不等所有题目完成才统一打分。

### 评分展示
- **D-05:** 卡片瀑布流布局——每道题一张评分卡片，用户自然向下滚动浏览。
- **D-06:** 采分点覆盖率展示——如 "3/5 已覆盖"，绿色圆点标记已覆盖、红色标记未覆盖。不用百分制或等级制。
- **D-07:** 无顶部总评摘要——直接进入逐题卡片，页面更简洁。
- **D-08:** 展示 ASR 识别原文——卡片内可折叠展示，让考生看到自己的回答被识别成了什么，透明可信。

### 评分触发与容错
- **D-09:** 自动触发——最后一题答完后过渡页自动跳转 /results，评分流程已在后台运行。若某题尚未评分完成，卡片显示 "评分中..."。
- **D-10:** 自动重试 + 降级——单题评分失败自动重试一次，仍失败则卡片显示 "评分失败" + 手动重试按钮。其他题不受影响。
- **D-11:** 支持手动重评——每道题卡片有 "重新评分" 按钮，触发重新 ASR+LLM 评分。

### Claude's Discretion
- 评分 loading 动画具体设计
- 卡片视觉细节（颜色、间距、动效、采分点圆点样式）
- LLM prompt 的具体措辞和 scorePoints 格式解析策略
- 结果页 Ant Design 组件选择（Card、Tag、Progress、Collapse 等）
- 后端评分结果存储结构（内存/文件/数据库）

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目级文档
- `.planning/PROJECT.md` — 项目全景、核心价值、约束条件
- `.planning/REQUIREMENTS.md` — v1 全部需求，含 Phase 4 的评分需求 SCORE-01/02/03、UI-05
- `.planning/ROADMAP.md` — Phase 4 成功标准（4 条 SC）

### 前期上下文
- `.planning/phases/03-question-by-question-interview/03-CONTEXT.md` — Phase 3 录音存储格式、路由出口 `/results`、状态管理、面试状态机
- `.planning/phases/02-virtual-exam-room/02-CONTEXT.md` — TTS 服务、考场布局、视觉组件
- `.planning/phases/01-foundation-question-bank/01-CONTEXT.md` — 技术栈决策（React + Vite + Ant Design + Zustand + React Router）

### 试题数据
- `backend/data/questions.json` — 16 道真题，每题含 scorePoints（采分点大纲文本，多级编号格式）

### 评分参考
- 真实江苏省考面试 5 维度评分标准（综合分析、计划组织协调、应变、人际交往、言语表达）—— v2 参考，v1 先用 scorePoints 采分点方式

## Existing Code Insights

### Reusable Assets
- **`useInterviewStore`** — 已有 sessionId、currentIndex、录音 blob 状态，评分阶段从中读取录音和答题序号
- **`useQuestionBankStore`** — 读取 selectedIds 和 questions 数据（含 scorePoints）
- **`synthesizeSpeech()`** (ttsApi.ts) — TTS 不需要，但 API 模块模式可复用
- **`uploadRecording()`** (recordingApi.ts) — 录音上传已在 Phase 3 实现，评分阶段从 `recordings/{sessionId}/` 读取
- **MiniMax TTS 端点** (`/api/tts/minimax`) — E2E 测试可用 TTS 生成答案音频验证评分流程
- **ASR 端点** (`/api/asr/recognize`) — 已可用，接受 WAV 返回文字
- **E2E 测试脚本** (`backend/tests/test_asr_e2e.py`) — TTS→WAV→ASR 全链路验证，100% 识别率
- **MicTestModal** — WAV 录制方式可参考（AudioContext + 16kHz 降采样）

### Established Patterns
- **Zustand store** — 状态管理模式，评分结果可存入新 store 或扩展现有 store
- **Feature-based 目录结构** — 新页面放 `pages/ScoringResults/`，组件放 `components/` 子目录
- **API 模块模式** — 新增 scoringApi.ts，封装评分相关请求
- **CSS-in-JS (inline styles)** — 与 Phase 1-3 一致
- **Ant Design ConfigProvider** — 全局主题已配置

### Integration Points
- **路由**: `/results` — Phase 3 最后一题答完后 navigate 到此，需创建 ScoringResultsPage
- **录音数据**: `recordings/{sessionId}/q{n}.webm` — 后端从此路径读取录音进行 ASR
- **scorePoints 数据**: `questions.json` 中每题已有 scorePoints 字段——评分时直接读取
- **后端新端点**: 
  - `POST /api/scoring/evaluate` — 触发单题评分（ASR + LLM），或
  - `POST /api/scoring/evaluate-all` — 批量评分，或
  - 在录音上传后自动触发（与 Phase 3 upload 端点集成）
- **LLM 调用**: 通过 DashScope API Key 调用 Qwen 模型做采分点覆盖判断
- **前端新 store**: 评分结果状态（每道题得分、覆盖详情、加载/失败状态）

## Specific Ideas

- 真实评分体验参考：公务员面试由 7 名考官按 5 维度打分，去高低取平均。v1 简化为 LLM 按每题专属 scorePoints 做采分点覆盖判断。
- 每道题答完立即异步评分，不等最后——用户进 /results 时大部分结果已就绪，体验丝滑。
- 评分容错设计：ASR 同音错别字不应影响评分，LLM 按语义匹配采分点。
- 手动重评按钮让用户感觉评分透明可控，而非黑盒。

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 4-Scoring & Feedback*
*Context gathered: 2026-05-24*
