"""Shared pytest fixtures for backend tests."""

import json
import os
import tempfile
from pathlib import Path

import pytest


@pytest.fixture
def sample_questions():
    """Return list of 3 Question dicts in the format from questions.json."""
    return [
        {
            "id": "js_exam_00b2138b2b_q01",
            "title": "2022 年 7 月 9 日江苏真题(A 类) · 第1题",
            "fullText": "漫画题是老人坐轮椅，旁边放一个大的自行车，后面一个成年人，骑一个小车，腿脚伸展不开...",
            "type": "A",
            "year": 2022,
            "source": "江苏省考面试真题",
            "scorePoints": (
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
            ),
        },
        {
            "id": "js_exam_4109606d96_q04",
            "title": "2022 年 7 月 9 日江苏真题(A 类) · 第4题",
            "fullText": "请评价一下这个氛围...",
            "type": "A",
            "year": 2022,
            "source": "江苏省考面试真题",
            "scorePoints": (
                "l、评价集体氛围\n"
                "有目标、有行动力\n"
                "2、描述初印象\n"
                "(1)科长:关注目标，激励下属(\n"
                "(2)小李:谦逊、有团队精神\n"
                "(3)小王:有创意，爱表现\n"
                "(4)老赵:物质需求强烈\n"
                "(5)最后一个人:懂得换位思考顾及他人\n"
                "3、提出对策\n"
                "(1)对科长:保持一致目标\n"
                "(2)对小李和最后一个人:积极合作\n"
                "(3)对小王:虚心求教，适时表达钦佩\n"
                "(4)对老赵:有得共享\n"
                "4、总结提升\n"
                "真诚与努力是融入集体的良方"
            ),
        },
        {
            "id": "js_exam_be5b82b874_q04",
            "title": "2022 年 7 月 9 日江苏真题(B 类) · 第4题",
            "fullText": "目前我国农民工群体越发的老龄化...",
            "type": "B",
            "year": 2022,
            "source": "江苏省考面试真题",
            "scorePoints": (
                "1、表明态度十分有必要\n"
                "2、重点方面\n"
                "(1)做好调研工作，了解实际情况\n"
                "(2)做好宣传工作，提升大众意识\n"
                "(3)做好后续保障，制定转岗培训\n"
                "(4)做好后续工作，定期抽查企业\n"
                "3、总结提升\n"
                "积极落实政府政策,保护老年劳动力"
            ),
        },
    ]


@pytest.fixture
def sample_transcript():
    """Return a realistic Chinese ASR transcript string (~200 chars)."""
    return (
        "我认为这幅漫画反映了当前社会中存在的形式主义问题。"
        "一些基层干部在工作中过于注重表面功夫，忽视了实际效果。"
        "这种现象不仅浪费了公共资源，也损害了政府公信力。"
        "要解决这个问题，需要从完善考核机制和加强监督两方面入手。"
        "同时，我们每一个人都应该积极参与到社会建设中来。"
    )


@pytest.fixture
def sample_coverage_json():
    """Return a valid LLM response JSON with mixed COVER/PARTIAL/MISS verdicts."""
    return {
        "coverage": [
            {
                "id": 1,
                "section": "描述漫画",
                "text": "表述 3 个标题",
                "verdict": "COVER",
                "evidence": "我认为这幅漫画反映了...",
                "reasoning": "考生明确给出了3个标题",
            },
            {
                "id": 2,
                "section": "描述漫画",
                "text": "表现了不同人需要不同，用对方法共同进步",
                "verdict": "PARTIAL",
                "evidence": "这种现象不仅浪费了公共资源...",
                "reasoning": "考生提到了资源分配问题，但未明确表达核心观点",
            },
            {
                "id": 3,
                "section": "描述漫画",
                "text": "在共同富裕的道路上，一个都不能少",
                "verdict": "MISS",
                "evidence": "",
                "reasoning": "考生回答中未涉及共同富裕相关内容",
            },
            {
                "id": 4,
                "section": "分析论证",
                "text": "在过去脱贫攻坚的道路上一个都不能落",
                "verdict": "COVER",
                "evidence": "要解决这个问题，需要从完善考核机制...",
                "reasoning": "考生提到了解决方法和路径",
            },
            {
                "id": 5,
                "section": "分析论证",
                "text": "黄文秀、沈浩等基层干部用实践证实一个都不能少",
                "verdict": "COVER",
                "evidence": "我们每一个人都应该积极参与...",
                "reasoning": "考生强调了每个个体的参与",
            },
        ],
        "feedback": "该考生回答围绕形式主义问题展开，部分与采分点相关但整体偏离了漫画的核心主题。建议今后答题时先仔细审题，准确抓住漫画主旨再展开论述。",
    }


@pytest.fixture
def temp_scoring_dir():
    """Create and clean up a temporary recordings directory for persistence tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create session subdirectory
        session_dir = Path(tmpdir) / "test-session-uuid"
        session_dir.mkdir(parents=True, exist_ok=True)
        yield str(session_dir)
