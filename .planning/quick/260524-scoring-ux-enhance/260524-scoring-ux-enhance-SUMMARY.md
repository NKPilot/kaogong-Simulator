---
quick_id: 260524-scoring-ux-enhance
status: complete
date: 2026-05-24
---

## Task 1: Enhance LLM scoring prompt for richer feedback

Done. Updated `backend/app/services/scoring_service.py`:
- `SCORING_SYSTEM_PROMPT`: Added rules for `suggestion`, `overallScore`, and `strengths` fields
- Added `MODEL_ANSWER_SYSTEM_PROMPT` for generating reference answers
- `build_scoring_prompt`: Updated output format to include `overallScore`, `strengths`, and per-point `suggestion`
- `validate_scoring_result`: Normalizes optional fields (overallScore, strengths, suggestion) with defaults
- `evaluate_answer`: Result assembly now includes `overallScore` and `strengths`

## Task 2: Add model answer generation endpoint

Done.
- Added `generate_model_answer()` in `scoring_service.py` — calls Qwen to generate a model answer covering all score points
- Added `GET /api/scoring/model-answer/{question_id}` endpoint in `scoring.py` with in-memory cache
- Model answer generation uses lower temperature (0.3) for consistency

## Task 3: Redesign frontend scoring display

Done.
- `frontend/src/types/scoring.ts`: Added `Strength` interface, `ModelAnswerResult` interface, `overallScore` and `strengths` to `ScoringResult`, `suggestion` to `CoveragePoint`
- `frontend/src/api/scoringApi.ts`: Added `fetchModelAnswer()` function
- `frontend/src/pages/ScoringResults/components/ScoringCard.tsx`: Redesigned with:
  - Tabs: "评分详情" (Review) / "参考回答" (Model Answer)
  - Circular progress indicator with grade letter (A+/A/B+/B/C+/C/D)
  - Strengths section with highlighted cards
  - Enhanced per-point analysis with numbered verdict badges
  - Lazy-loaded model answer tab with AI-generated reference answer
- `frontend/src/pages/ScoringResults/components/CoverageDots.tsx`: Enhanced with:
  - Numbered circles per point, colored verdict badges with icons
  - Evidence quotes from transcript
  - Reasoning text in left-bordered callout
  - Suggestion/demonstration text in highlighted box for MISS/PARTIAL points
- `frontend/src/pages/History/index.tsx`: Updated scoring detail display with overallScore, strength tags, and enhanced coverage dots
