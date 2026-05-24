"""Unit tests for scoring_service.py — scorePoints parsing, prompt construction, coverage computation."""

import json
import uuid
from pathlib import Path

import pytest


# We expect these imports to work after scoring_service.py is created
# For RED phase, these will raise ImportError — which is expected
try:
    from app.services.scoring_service import (
        SCORING_SYSTEM_PROMPT,
        build_scoring_prompt,
        compute_coverage_summary,
        evaluate_answer,
        load_scoring_results,
        parse_score_points,
        save_scoring_result,
        validate_scoring_result,
    )
except ImportError:
    pass  # RED phase: module doesn't exist yet


class TestParseScorePoints:
    """Test scorePoints text parsing into flat list of point dicts."""

    def test_parse_score_points_flat(self):
        """Flat list of numbered points with no sub-points."""
        text = "1、第一要点\n2、第二要点\n3、第三要点"
        points = parse_score_points(text)
        assert len(points) == 3
        assert points[0]["id"] == 1
        assert points[0]["text"] == "第一要点"
        assert points[1]["id"] == 2
        assert points[2]["id"] == 3

    def test_parse_score_points_nested(self):
        """Multi-level outline with (1), (2) sub-points under numbered headings."""
        text = (
            "1、描述漫画\n"
            "(1)表述 3 个标题\n"
            "(2)表现不同人需要不同\n"
            "2、分析论证\n"
            "(1)脱贫攻坚一个都不能落\n"
            "(2)黄文秀等基层干部实践\n"
        )
        points = parse_score_points(text)
        # Should produce 4 leaf points: q01-section1 has 2 sub-points, section2 has 2 sub-points
        assert len(points) == 4
        assert points[0]["section"] == "描述漫画"
        assert points[0]["text"] == "表述 3 个标题"
        assert points[1]["section"] == "描述漫画"
        assert points[1]["text"] == "表现不同人需要不同"
        assert points[2]["section"] == "分析论证"
        assert points[3]["section"] == "分析论证"

    def test_parse_score_points_ocr_artifact(self):
        """Input contains 'l、' as first marker — should normalize to '1、'."""
        text = "l、评价集体氛围\n有目标、有行动力\n2、描述初印象\n(1)科长关注目标"
        points = parse_score_points(text)
        assert len(points) >= 2
        # First section should treat 'l、' as '1、'
        # Section heading includes text until next top-level marker (e.g., "2、")
        assert "评价集体氛围" in points[0]["section"]
        # Verify the OCR artifact was normalized
        ids = [p["id"] for p in points]
        assert 1 in ids

    def test_parse_score_points_real_data(self):
        """Parse actual scorePoints from js_exam_00b2138b2b_q01, verify count >= 5."""
        text = (
            "1、描述漫画\n"
            "(1)表述 3 个标题\n"
            "(2)表现了不同人需要不同，用对方法共同进步\n"
            "(3)在共同富裕的道路上，一个都不能少\n"
            "2、分析论证\n"
            "(1)在过去脱贫攻坚的道路上一个都不能落\n"
            "(2)黄文秀、沈浩等基层干部用实践证实一个都不能少\n"
            "(3)共同富裕是全体人民的富裕，一个都不能少\n"
            "(4)农村、城市、各个领域每个人都在参与\n"
            "3、总结展望\n"
            "共同努力，敢想敢干,终将实现目标"
        )
        points = parse_score_points(text)
        assert len(points) >= 5
        # Each point should have id, section, text
        for p in points:
            assert "id" in p
            assert "section" in p
            assert "text" in p
            assert isinstance(p["id"], int)


class TestBuildScoringPrompt:
    """Test LLM prompt construction."""

    def test_build_scoring_prompt_contains_all_elements(self):
        """Prompt includes question text, all point texts, and transcript."""
        question_text = "请评价一下这个氛围"
        points = [
            {"id": 1, "section": "评价集体氛围", "text": "有目标、有行动力"},
            {"id": 2, "section": "描述初印象", "text": "科长关注目标，激励下属"},
            {"id": 3, "section": "描述初印象", "text": "小李谦逊、有团队精神"},
        ]
        transcript = "我觉得这个集体氛围很好，大家都有目标意识"
        prompt = build_scoring_prompt(question_text, points, transcript)
        assert question_text in prompt
        assert "有目标、有行动力" in prompt
        assert "科长关注目标，激励下属" in prompt
        assert "小李谦逊、有团队精神" in prompt
        assert transcript in prompt
        # Should contain instruction markers
        assert "COVER" in prompt or "COVER" in prompt.upper()


class TestComputeCoverageSummary:
    """Test coverage ratio computation."""

    def test_compute_coverage_summary(self):
        """3 COVER + 1 PARTIAL + 1 MISS -> coveredCount=3, totalCount=5."""
        coverage = [
            {"id": 1, "verdict": "COVER", "evidence": "e1", "reasoning": "r1"},
            {"id": 2, "verdict": "COVER", "evidence": "e2", "reasoning": "r2"},
            {"id": 3, "verdict": "COVER", "evidence": "e3", "reasoning": "r3"},
            {"id": 4, "verdict": "PARTIAL", "evidence": "e4", "reasoning": "r4"},
            {"id": 5, "verdict": "MISS", "evidence": "", "reasoning": "r5"},
        ]
        summary = compute_coverage_summary(coverage)
        assert summary["coveredCount"] == 3
        assert summary["totalCount"] == 5

    def test_compute_coverage_summary_all_cover(self):
        """All COVER -> coveredCount = totalCount."""
        coverage = [
            {"id": 1, "verdict": "COVER", "evidence": "e1", "reasoning": "r1"},
            {"id": 2, "verdict": "COVER", "evidence": "e2", "reasoning": "r2"},
        ]
        summary = compute_coverage_summary(coverage)
        assert summary["coveredCount"] == 2
        assert summary["totalCount"] == 2

    def test_compute_coverage_summary_none_cover(self):
        """No COVER -> coveredCount = 0."""
        coverage = [
            {"id": 1, "verdict": "MISS", "evidence": "", "reasoning": "r1"},
            {"id": 2, "verdict": "PARTIAL", "evidence": "e2", "reasoning": "r2"},
        ]
        summary = compute_coverage_summary(coverage)
        assert summary["coveredCount"] == 0
        assert summary["totalCount"] == 2


class TestValidateScoringResult:
    """Test LLM result validation."""

    def test_validate_scoring_result_valid(self):
        """Valid JSON structure passes validation."""
        result = {
            "coverage": [
                {
                    "id": 1,
                    "verdict": "COVER",
                    "evidence": "考生提到了相关概念",
                    "reasoning": "语义匹配",
                }
            ],
            "feedback": "整体回答不错",
        }
        # Should not raise
        validate_scoring_result(result)

    def test_validate_scoring_result_missing_coverage(self):
        """JSON without 'coverage' key raises ValueError."""
        result = {"feedback": "missing coverage"}
        with pytest.raises(ValueError):
            validate_scoring_result(result)

    def test_validate_scoring_result_missing_feedback(self):
        """JSON without 'feedback' key raises ValueError."""
        result = {
            "coverage": [
                {
                    "id": 1,
                    "verdict": "COVER",
                    "evidence": "something",
                    "reasoning": "something",
                }
            ]
        }
        with pytest.raises(ValueError):
            validate_scoring_result(result)

    def test_validate_scoring_result_empty_coverage(self):
        """Empty coverage array raises ValueError."""
        result = {"coverage": [], "feedback": "empty"}
        with pytest.raises(ValueError):
            validate_scoring_result(result)

    def test_validate_scoring_result_missing_verdict(self):
        """Coverage point missing verdict raises ValueError."""
        result = {
            "coverage": [
                {
                    "id": 1,
                    "evidence": "something",
                    "reasoning": "something",
                }
            ],
            "feedback": "incomplete",
        }
        with pytest.raises(ValueError):
            validate_scoring_result(result)


class TestSaveLoadScoringResults:
    """Test persistence of scoring results."""

    def test_save_and_load_scoring_results(self, temp_scoring_dir):
        """Round-trip: save a scoring result, then load it back."""
        session_id = str(uuid.uuid4())
        result = {
            "question_index": 0,
            "question_id": "js_exam_00b2138b2b_q01",
            "status": "scored",
            "transcript": "考生回答文本",
            "coverage": [
                {
                    "id": 1,
                    "section": "描述漫画",
                    "text": "表述 3 个标题",
                    "verdict": "COVER",
                    "evidence": "考生回答中包含3个标题",
                    "reasoning": "明确给出了3个标题",
                }
            ],
            "feedback": "整体表现良好",
            "coveredCount": 1,
            "totalCount": 5,
        }

        save_scoring_result(session_id, 0, result)
        results = load_scoring_results(session_id)
        assert len(results) == 1
        assert results[0]["question_index"] == 0
        assert results[0]["status"] == "scored"
        assert results[0]["coveredCount"] == 1

    def test_load_scoring_results_empty(self, temp_scoring_dir):
        """Loading from a non-existent scoring.json returns empty list."""
        session_id = str(uuid.uuid4())
        results = load_scoring_results(session_id)
        assert results == []

    def test_scoring_status_flow(self, temp_scoring_dir):
        """Status transitions: pending -> scored on success, pending -> failed on error."""
        session_id = str(uuid.uuid4())

        # Successful scoring: status should be "scored"
        success_result = {
            "question_index": 0,
            "question_id": "test_q",
            "status": "scored",
            "transcript": "test",
            "coverage": [],
            "feedback": "ok",
            "coveredCount": 0,
            "totalCount": 0,
        }
        save_scoring_result(session_id, 0, success_result)
        loaded = load_scoring_results(session_id)
        assert loaded[0]["status"] == "scored"

        # Failed scoring: status should be "failed"
        fail_result = {
            "question_index": 1,
            "question_id": "test_q2",
            "status": "failed",
            "error": "ASR returned empty result",
        }
        save_scoring_result(session_id, 1, fail_result)
        loaded = load_scoring_results(session_id)
        assert len(loaded) == 2
        assert loaded[1]["status"] == "failed"
        assert loaded[1]["error"] == "ASR returned empty result"


class TestScoringSystemPrompt:
    """Test the system prompt constant."""

    def test_system_prompt_exists(self):
        """SCORING_SYSTEM_PROMPT is a non-empty string module-level constant."""
        assert isinstance(SCORING_SYSTEM_PROMPT, str)
        assert len(SCORING_SYSTEM_PROMPT) > 50
        # Should contain key instructions
        assert "evaluator" in SCORING_SYSTEM_PROMPT.lower() or "评估" in SCORING_SYSTEM_PROMPT
