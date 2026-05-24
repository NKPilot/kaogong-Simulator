# Roadmap: 考公面试模拟器 (Civil Service Exam Interview Simulator)

## Overview

从选题到评分的一次完整模拟面试体验。用户浏览题库并选择 3-4 道江苏公务员面试真题，进入虚拟考场由数字人考官念题，限时思考并语音作答，最后基于官方评分要点获得打分和文字反馈。v1 聚焦 16 道有 score_points 的真题，跑通从选题到评分的完整闭环。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Question Bank** - 项目 scaffold、题库数据加载、浏览与选题
- [x] **Phase 2: Virtual Exam Room** - 虚拟考场展示、数字人考官形象、引导语播报 (completed 2026-05-23)
- [x] **Phase 3: Question-by-Question Interview** - TTS 读题、限时思考、语音作答、逐题推进
- [ ] **Phase 4: Scoring & Feedback** - 基于 score_points 的统一评分与反馈展示

## Phase Details

### Phase 1: Foundation + Question Bank
**Goal**: Users can browse the question bank and select questions to form a mock interview session.
**Depends on**: Nothing (first phase)
**Requirements**: QB-01, QB-02
**Success Criteria** (what must be TRUE):
  1. User sees a list of 16 available questions, each showing its title, type (A/B/C/结构化小组), and year
  2. User can select any 3-4 questions from the list and see their selection reflected in the UI
  3. User can proceed from selection to start the simulated interview
  4. Backend API serves question data; frontend renders the question list without errors
**Plans**: 4/4 complete — P01-Extract, P02-Backend API, P03-Frontend Scaffold, P04-Question Bank Page

### Phase 2: Virtual Exam Room
**Goal**: Users enter a virtual exam room with examiner images and receive interview guidance.
**Depends on**: Phase 1
**Requirements**: FLOW-01, FLOW-02, UI-01
**Success Criteria** (what must be TRUE):
  1. After selecting questions, user sees a virtual exam room with multiple examiner images displayed in a row
  2. User hears TTS audio reading the interview guidance (welcome message, exam rules)
  3. User can read the guidance text alongside the audio
  4. User can proceed from guidance to the first question when ready
**Plans**: 3 plans

**UI hint**: yes

Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Backend API: guidance text endpoint + TTS synthesis proxy via DashScope
- [x] 02-02-PLAN.md — Frontend assets + base UI: silhouette examiners, red banner, examiner row, entry animation, API modules

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-03-PLAN.md — Frontend integration: guidance toggle, TTS controls, CTA button, ExamRoomPage orchestrator

### Phase 3: Question-by-Question Interview (completed 2026-05-23)
**Goal**: Users complete each question in sequence with timed thinking, voice recording, and managed progression.
**Depends on**: Phase 2
**Requirements**: FLOW-03, FLOW-04, VOICE-01, VOICE-02, VOICE-03, TIMER-01, TIMER-02, TIMER-03, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. For each question, user hears TTS reading the question content aloud
  2. User can toggle question text visibility on/off during the question
  3. Thinking countdown (default 1-2 minutes) starts after question is presented; user cannot skip
  4. Answer countdown (default 2-3 minutes) starts after thinking phase; user voice is recorded throughout
  5. Timer auto-ends the current phase (thinking or answering) when it reaches zero
  6. User can request question re-read once, which replays the TTS and restarts the thinking timer
  7. After answering, user advances to the next question; progress indicator shows current position (e.g., "Question 2/4")
  8. Interview completes after the last question; user transitions to results automatically
**Plans**: 5 plans
**UI hint**: yes

Plans:
**Wave 1**
- [x] 03-01-PLAN.md — Backend recording upload endpoint (POST /api/recording/upload)
- [x] 03-02-PLAN.md — Interview store (useInterviewStore), types, recording API module
- [x] 03-03-PLAN.md — TimerRing, RecordingIndicator, ReReadButton components
- [x] 03-04-PLAN.md — QuestionDrawer, ProgressIndicator, StatusTextBar, TransitionPage, MicPermissionError components

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-05-PLAN.md — QuestionInterviewPage orchestrator + router update

### Phase 4: Scoring & Feedback
**Goal**: Users receive scores and textual feedback based on comparison with official scoring criteria.
**Depends on**: Phase 3
**Requirements**: SCORE-01, SCORE-02, SCORE-03, UI-05
**Success Criteria** (what must be TRUE):
  1. After interview completes, scoring runs automatically without user action
  2. User sees a clear summary of overall performance
  3. For each question, user sees a score and which key points they covered vs missed
  4. User receives textual feedback for each question based on score_points comparison
**Plans**: 4 plans
**UI hint**: yes

Plans:
**Wave 1**
- [ ] 04-01-PLAN.md — Backend scoring pipeline (scoring_service + router + main.py integration)
- [ ] 04-02-PLAN.md — Frontend data layer (scoring types, API module, Zustand store)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 04-03-PLAN.md — Scoring UI components (ScoringCard, CoverageDots, PendingCard, ErrorCard)

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 04-04-PLAN.md — Results page orchestrator, /results route, scoring trigger integration + human verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Question Bank | 4/4 | Complete | 2026-05-23 |
| 2. Virtual Exam Room | 3/3 | Complete | 2026-05-23 |
| 3. Question-by-Question Interview | 5/5 | Complete | 2026-05-23 |
| 4. Scoring & Feedback | 0/4 | Not started | - |