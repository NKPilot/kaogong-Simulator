# Requirements: 考公面试模拟器

**Defined:** 2026-05-23
**Core Value:** 让考生能够在接近真实考场的环境中练习面试——用真题练、有考官念题、有时间压力、有打分反馈

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### 题库与选题 (Question Bank)

- [ ] **QB-01**: 用户可浏览 16 道题库列表，查看题目信息（标题、类型、年份）
- [ ] **QB-02**: 用户可选择 3-4 道题组成一次模拟面试

### 面试流程 (Interview Flow)

- [ ] **FLOW-01**: 进入模拟面试后展示虚拟考场（多位考官静态图）
- [x] **FLOW-02**: TTS 念出引导语，宣布面试开始
- [ ] **FLOW-03**: 题目逐题进行，当前题完成后进入下一题
- [ ] **FLOW-04**: 用户可切换是否在屏幕上显示题目文本

### 语音交互 (Voice)

- [ ] **VOICE-01**: TTS 朗读题目内容
- [ ] **VOICE-02**: 用户语音作答，系统录音保存
- [ ] **VOICE-03**: 没听清题目时可请求重读一次

### 计时系统 (Timer)

- [ ] **TIMER-01**: 每道题有思考倒计时（默认 1-2 分钟）
- [ ] **TIMER-02**: 每道题有答题倒计时（默认 2-3 分钟）
- [ ] **TIMER-03**: 时间到自动结束当前答题

### 评分系统 (Scoring)

- [ ] **SCORE-01**: 全部题目答完后统一评分
- [ ] **SCORE-02**: 基于已有 score_points 对比考生回答内容打分
- [ ] **SCORE-03**: 展示评分结果和各题文字反馈

### 前端界面 (Frontend)

- [ ] **UI-01**: 考官形象展示区域（多考官静态图片布局）
- [ ] **UI-02**: 题目文本展示区域（可切换显隐）
- [ ] **UI-03**: 计时器倒计时展示
- [ ] **UI-04**: 答题进度展示（如 1/3）
- [ ] **UI-05**: 评分结果与反馈展示页面

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 题库扩展 (Question Bank Expansion)

- **QB-03**: 引入全部 227 道题目（目前仅用有 score_points 的 16 道）
- **QB-04**: 支持按省份、年份、类型筛选题目

### 数字人升级 (Digital Human Upgrade)

- **DH-01**: 3D 数字人渲染，口型同步 TTS
- **DH-02**: 考官表情与肢体动作变化

### 交互增强 (Interaction Enhancement)

- **INT-01**: AI 实时追问对话——针对回答内容深入提问
- **INT-02**: 答题回放，用户可以回听自己的录音

### 评分增强 (Scoring Enhancement)

- **SCR-04**: 多维度评分（仪表仪态、逻辑思维、语言表达、政策理解等）
- **SCR-05**: 思维导图对照分析

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI 实时追问对话 | v1 考官只念题不互动，追问留到 v2 |
| 3D 数字人渲染 | v1 用静态图片/简单动图，降低复杂度 |
| 无 score_points 的题目 | v1 只用 16 道有评分要点的题，先跑通链路 |
| OAuth/用户系统 | v1 本地单用户，不需要账号系统 |
| 移动端 App | Web 优先 |
| 视频录制/回放 | v1 只做语音录音，不含视频 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| QB-01 | Phase 1 | Pending |
| QB-02 | Phase 1 | Pending |
| FLOW-01 | Phase 2 | Pending |
| FLOW-02 | Phase 2 | Complete |
| FLOW-03 | Phase 3 | Pending |
| FLOW-04 | Phase 3 | Pending |
| VOICE-01 | Phase 3 | Pending |
| VOICE-02 | Phase 3 | Pending |
| VOICE-03 | Phase 3 | Pending |
| TIMER-01 | Phase 3 | Pending |
| TIMER-02 | Phase 3 | Pending |
| TIMER-03 | Phase 3 | Pending |
| SCORE-01 | Phase 4 | Pending |
| SCORE-02 | Phase 4 | Pending |
| SCORE-03 | Phase 4 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-05-23*
*Last updated: 2026-05-23 after roadmap creation (traceability added)*
