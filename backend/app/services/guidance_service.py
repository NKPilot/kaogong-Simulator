"""Guidance text generation service.

Provides the structured welcome/guidance text shown in the exam room,
with dynamic question count substitution.
"""

from typing import Dict, List

# Guidance template with {count} placeholder for dynamic substitution
_GUIDANCE_TEMPLATE: Dict[str, str | List[str]] = {
    "title": "面试说明",
    "paragraphs": [
        "考生你好，欢迎参加本次公务员模拟面试。",
        "本次面试共 {count} 道题，采用结构化面试形式。请仔细听题，在思考后作答。",
        "每道题有思考时间和答题时间限制，请合理分配时间。",
        "准备好了吗？点击「开始答题」进入第一题。",
    ],
}


def generate_guidance_text(question_count: int) -> dict:
    """Generate guidance text with dynamic question count substitution.

    Args:
        question_count: Number of questions in this interview session.

    Returns:
        Dict with "title" (str) and "paragraphs" (list of str) keys.
        The {count} placeholder in paragraph strings is replaced with
        the given question_count.
    """
    paragraphs = [
        p.format(count=question_count) if "{count}" in p else p
        for p in _GUIDANCE_TEMPLATE["paragraphs"]
    ]
    return {
        "title": _GUIDANCE_TEMPLATE["title"],
        "paragraphs": paragraphs,
    }
