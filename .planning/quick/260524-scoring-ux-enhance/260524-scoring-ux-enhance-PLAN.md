---
quick_id: 260524-scoring-ux-enhance
description: "增强评分展示：参考粉笔AI评分体系，改进打分UI和答案参考功能"
date: 2026-05-24
---

## Task 1: Enhance LLM scoring prompt for richer feedback

**Files:** `backend/app/services/scoring_service.py`
**Action:** Update SCORING_SYSTEM_PROMPT and build_scoring_prompt to request:
- `overallScore`: numeric 0-100 holistic score
- `strengths`: array of {title, description} for strengths found
- `suggestion`: per-point example text for PARTIAL/MISS points showing what the candidate could have said
- Update `validate_scoring_result` to accept new optional fields
- Update `evaluate_answer` result assembly to include new fields

## Task 2: Add model answer generation endpoint

**Files:** `backend/app/services/scoring_service.py`, `backend/app/routers/scoring.py`
**Action:** Create `generate_model_answer()` function that:
- Takes question text + parsed score points
- Calls Qwen to generate a model/standard answer covering all points
- Returns structured model answer text

Add `POST /api/scoring/model-answer` endpoint that:
- Takes question_id, loads question, generates and returns model answer
- Caches result in memory for reuse

## Task 3: Redesign frontend scoring display

**Files:**
- `frontend/src/types/scoring.ts` - Add new types (overallScore, strengths, suggestion, ModelAnswerResult)
- `frontend/src/pages/ScoringResults/components/ScoringCard.tsx` - Redesign with:
  - Tabs: "评分详情" / "参考回答"
  - Overall score display (percentage + grade letter)
  - Strengths section
  - Per-point analysis with verdict badge + reasoning + suggestion for missed points
- `frontend/src/pages/ScoringResults/components/CoverageDots.tsx` - Enhanced per-point display with suggestion text
- `frontend/src/pages/ScoringResults/index.tsx` - Pass sessionId to ScoringCard for model answer fetching
- `frontend/src/pages/History/index.tsx` - Minor updates for new scoring data display
