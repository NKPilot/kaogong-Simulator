"""Scoring service — answer evaluation pipeline.

Converts WebM recordings to WAV, runs ASR via DashScope Paraformer,
calls Qwen LLM for per-point coverage evaluation against scorePoints,
and persists results as JSON.
"""

import json
import logging
import os
import re
import subprocess
import time
from pathlib import Path

import dashscope
from dashscope import Generation

from app.services.asr_service import transcribe_audio

logger = logging.getLogger("interview-simulator")

# Load .env file if DASHSCOPE_API_KEY is not already in environment
def _load_dotenv(env_path: str) -> None:
    if not os.path.isfile(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key not in os.environ:
                os.environ[key] = val

if not os.environ.get("DASHSCOPE_API_KEY"):
    _load_dotenv(Path(__file__).resolve().parent.parent / ".env")

dashscope.api_key = os.environ.get("DASHSCOPE_API_KEY", "")

# Base directory for recordings (same convention as recording_service.py)
RECORDINGS_DIR = "recordings"

# Path to static ffmpeg binary
FFMPEG_BIN = "/tmp/ffmpeg"

SCORING_SYSTEM_PROMPT = """You are an expert evaluator for civil service exam interview answers.
Your task: compare the candidate's spoken answer against the scoring criteria provided below.
The answer is an ASR (Automatic Speech Recognition) transcript of the candidate's spoken response.
Output valid JSON only — no markdown, no explanation, no code fences.

IMPORTANT RULES:
1. Do NOT penalize ASR transcription errors (homophones, similar sounds, phonetic artifacts). Evaluate the SEMANTIC MEANING, not exact wording.
2. If the answer implies a point through context but doesn't state it explicitly, judge PARTIAL.
3. For each scoring point, you MUST provide:
   - COVER: the semantic meaning fully matches the scoring point
   - PARTIAL: partially addresses the point, some key elements are missing
   - MISS: the point is not addressed or is semantically unrelated
4. Provide specific evidence from the transcript that supports your verdict. Quote the relevant portion.
5. Provide clear reasoning explaining WHY the verdict was assigned.
6. Be fair and consistent. The candidate is speaking extemporaneously under time pressure.
7. For PARTIAL and MISS points, provide a "suggestion" field with 1-2 sentences in Chinese showing what the candidate COULD have said to cover this point well. For COVER points, leave suggestion empty.
8. Provide an "overallScore" (0-100 integer) reflecting holistic answer quality: 90+ excellent, 80-89 good, 70-79 fair, 60-69 weak, <60 poor.
9. Provide "strengths" — 2-4 specific strengths, each with "title" (short label) and "description" (2-3 sentences explaining what the candidate did well and why it is effective).
10. Provide "weaknesses" — 3-5 detailed weaknesses, each with "title" (short label), "description" (IN-DEPTH analysis: 3-5 sentences covering what specific problem exists, why it matters for scoring, and exactly how to improve), and "example" (concrete model phrasing: 2-4 sentences showing what a BETTER answer would sound like, with specific terminology, policy references, or case examples). Be thorough like a professional coach — each weakness must teach the candidate something actionable.
11. Evaluate the answer on 6 dimensions, each scored 0-10 (10=perfect, 0=absent):
    - 语言表达 (Language Expression): fluency, clarity, appropriate tone and pacing for oral interview
    - 逻辑结构 (Logical Structure): clear organization, coherent argument flow, well-structured reasoning
    - 紧扣题意 (Topic Relevance): how accurately and fully the candidate addresses the specific question asked
    - 政务思维 (Governmental Thinking): demonstrates administrative perspective, policy awareness, public service mindset
    - 分析深度 (Analytical Depth): depth of insight, use of concrete examples, sophistication of arguments
    - 对策可行 (Practical Solutions): feasibility and specificity of proposed solutions or suggestions
    Score each dimension independently. Be strict — a score of 8+ means near-perfect; 5-7 is average; <5 is weak.

Output format (strict JSON):
{
  "coverage": [
    {
      "id": 1,
      "verdict": "COVER",
      "evidence": "...",
      "reasoning": "...",
      "suggestion": ""
    }
  ],
  "overallScore": 75,
  "dimensions": [
    {"name": "语言表达", "score": 7, "comment": "表达流畅，但语速略快，部分语句不够精炼"},
    {"name": "逻辑结构", "score": 8, "comment": "层次分明，从现象到原因再到对策，逻辑清晰"},
    {"name": "紧扣题意", "score": 6, "comment": "基本回应了题目要求，但部分要点展开不够"},
    {"name": "政务思维", "score": 5, "comment": "有一定的政策意识，但未能从政府角度深入分析"},
    {"name": "分析深度", "score": 7, "comment": "分析有一定深度，举了具体例子支撑观点"},
    {"name": "对策可行", "score": 6, "comment": "对策方向正确，但缺乏具体可操作的细节"}
  ],
  "strengths": [
    {"title": "逻辑清晰", "description": "回答结构层次分明，从现象分析到原因探讨再到对策建议，逻辑链条完整"}
  ],
  "weaknesses": [
    {"title": "政务视角不足", "description": "回答从社会学角度分析了适老化问题，但未能站在政府立场思考。公务员面试要求体现政务思维，即从政策制定者、公共管理者的角度分析问题。建议在分析原因时加入政府视角，如'从政府治理角度看，适老化改造的滞后反映了公共服务精细化程度不足'。", "example": "比如可以这样说：'适老化改造不仅是民生工程，更是治理能力的体现。政府应建立老年人需求动态评估机制，将适老化指标纳入城市体检体系，从规划、建设、管理全链条保障老年群体的出行权益。'"},
    {"title": "缺乏具体案例和数据支撑", "description": "回答整体偏宏观论述，没有引用具体的政策案例或数据。在公务员面试中，用真实案例和数据说话比空谈道理更有说服力。建议在分析适老化问题时，引用具体的政策文件（如《无障碍环境建设法》）、城市案例（如上海适老化改造三年行动）或权威数据（如全国老旧小区改造数量）。", "example": "比如可以这样论述：'2023年9月施行的《无障碍环境建设法》明确要求新建改建项目配套无障碍设施。以上海为例，2024年完成老旧小区适老化改造328个，加装电梯超过3000台，这些实践表明适老化改造需要法治保障与地方创新双轮驱动。'"}
  ],
  "feedback": "overall textual feedback in Chinese assessing strengths and areas for improvement"
}"""

MODEL_ANSWER_SYSTEM_PROMPT = """You are an expert civil service exam interview coach. Your task is to generate a model answer (参考答案) for an interview question based on the provided scoring criteria.

The model answer should:
1. Cover ALL scoring points comprehensively — this is a demonstration of what a PERFECT answer looks like
2. Be well-structured with clear logic flow (opening → body → conclusion)
3. Use professional yet natural Chinese appropriate for an oral interview setting
4. Include concrete examples, specific terminology, and demonstrate "政务思维" (governmental thinking perspective)
5. Be approximately 600-1200 characters — substantive but not overly long for a spoken response
6. Sound like a real person speaking extemporaneously, not reading from a script

Output valid JSON only — no markdown, no explanation, no code fences.

Output format (strict JSON):
{
  "modelAnswer": "the full model answer text in Chinese"
}"""


def parse_score_points(score_points_text: str) -> list[dict]:
    """Parse multi-level numbered outline text into a flat list of scoring point dicts.

    Handles formats observed in questions.json:
    - Top-level markers: '1、', '2、', etc. (also OCR artifacts 'l、' and 'I、')
    - Sub-point markers: '(1)', '(2)', etc.
    - Standalone text after a heading without sub-points is treated as a single point.

    Args:
        score_points_text: Raw scorePoints text with multi-level numbered outline.

    Returns:
        List of dicts, each with keys: id (int), section (str), text (str).
        Returns empty list if no points could be parsed.
    """
    if not score_points_text or not score_points_text.strip():
        logger.warning("Empty scorePoints text, returning empty list")
        return []

    text = score_points_text.strip()

    # Step 1: Identify top-level sections
    # Match patterns like "1、", "2、", "3、", "l、", "I、" (normalize OCR artifacts)
    # Also match "1.", "2." etc. as some data may use English dots
    top_level_pattern = r'(?:^|\n)\s*(\d+|[lI])\s*[、.]\s*(.+?)(?=\n\s*(?:\d+|[lI])\s*[、.]|\Z)'
    top_matches = list(re.finditer(top_level_pattern, text, re.DOTALL))

    if not top_matches:
        logger.warning("No top-level sections found in scorePoints text, treating as single criterion")
        # Treat entire text as a single point
        return [{"id": 1, "section": "", "text": text}]

    points = []
    point_id = 0

    for match in top_matches:
        raw_number = match.group(1)
        # Normalize OCR artifacts: 'l' and 'I' become '1'
        # Keep multi-digit numbers as-is
        section_content = match.group(2).strip()

        # Determine section heading (the text before sub-points)
        section_heading = section_content

        # Step 2: Look for sub-points within this section
        sub_point_pattern = r'\(\s*(\d+)\s*\)\s*(.+?)(?=\n\s*\(\s*\d+\s*\)|\Z)'
        sub_matches = list(re.finditer(sub_point_pattern, section_content, re.DOTALL))

        if sub_matches:
            # Section heading is text before the first sub-point (excluding the match)
            first_sub_start = sub_matches[0].start()
            heading = section_content[:first_sub_start].strip()
            # Clean heading: remove trailing newlines, numbers, etc.
            heading = heading.rstrip("\n").strip()

            for sub_match in sub_matches:
                point_id += 1
                sub_text = sub_match.group(2).strip()
                # Clean up trailing punctuation artifacts like orphaned '('
                sub_text = sub_text.rstrip("(").strip()
                if sub_text:
                    points.append({
                        "id": point_id,
                        "section": heading,
                        "text": sub_text,
                    })
        else:
            # No sub-points — the heading itself is a leaf point
            # Check if the heading is essentially the same as a heading-only entry
            # e.g., "表明态度十分有必要" from js_exam_be5b82b874_q04
            point_id += 1
            # The heading might have inline text after the marker; extract clean heading
            heading = section_content.strip()
            # If no sub-points, the entire heading text is the point text
            points.append({
                "id": point_id,
                "section": heading,
                "text": heading,
            })

    if not points:
        logger.warning("ScorePoints parsing produced 0 points from text: %s", text[:100])
        return []

    if len(points) < 2:
        logger.warning("ScorePoints parsing produced only %d point(s) — unexpectedly low", len(points))

    logger.info("Parsed %d scoring points from scorePoints text (size=%d chars)", len(points), len(text))
    return points


def build_scoring_prompt(question_text: str, points: list[dict], transcript: str) -> str:
    """Construct the user prompt for LLM scoring.

    Args:
        question_text: Full text of the interview question.
        points: List of parsed score point dicts from parse_score_points().
        transcript: ASR transcript of the candidate's spoken answer.

    Returns:
        Formatted prompt string ready for the LLM user message.
    """
    # Build the numbered list of scoring points
    points_lines = []
    for p in points:
        section_info = f" [{p['section']}]" if p.get("section") and p["section"] != p["text"] else ""
        points_lines.append(f"  {p['id']}.{section_info} {p['text']}")

    points_text = "\n".join(points_lines)

    prompt = f"""Question:
{question_text}

Candidate's Answer (ASR Transcript):
{transcript}

Scoring Criteria — evaluate EACH point independently:
{points_text}

For EACH numbered scoring point above, determine the coverage verdict:
- COVER: the candidate's answer fully addresses the semantic meaning of this point
- PARTIAL: the candidate partially addresses this point, but key elements are missing
- MISS: this point is not addressed or is semantically unrelated

IMPORTANT: Ignore ASR homophone errors (同音错别字). Judge by semantic meaning, not exact wording.

For PARTIAL and MISS points, provide a "suggestion" — 1-2 sentences showing what the candidate could have said to cover this point. For COVER points, leave suggestion empty.
Also provide "overallScore" (integer 0-100), "dimensions" (6-dimension evaluation array), "strengths" and "weaknesses" (each an array with "title" and "description").

Output ONLY a valid JSON object (no markdown formatting, no code fences):
{{
  "coverage": [
    {{"id": 1, "verdict": "COVER", "evidence": "...", "reasoning": "...", "suggestion": ""}},
    ...
  ],
  "overallScore": 75,
  "dimensions": [
    {{"name": "语言表达", "score": 7, "comment": "..."}},
    ...
  ],
  "strengths": [
    {{"title": "逻辑清晰", "description": "回答结构层次分明..."}}
  ],
  "weaknesses": [
    {{"title": "政务视角不足", "description": "详细分析...", "example": "可以这样说..."}},
    ...
  ],
  "feedback": "overall assessment in Chinese, 2-4 sentences covering strengths and areas for improvement"
}}"""

    return prompt


def compute_coverage_summary(coverage: list[dict]) -> dict:
    """Compute coverage ratio from a list of verdict entries.

    Args:
        coverage: List of dicts with at least a 'verdict' key per entry.

    Returns:
        Dict with coveredCount (int) and totalCount (int).
    """
    total_count = len(coverage)
    covered_count = sum(1 for c in coverage if c.get("verdict") == "COVER")
    return {"coveredCount": covered_count, "totalCount": total_count}


def validate_scoring_result(result: dict) -> None:
    """Validate that the LLM-scored result dict has the required structure.

    Args:
        result: Parsed JSON dict from LLM output.

    Raises:
        ValueError: If required fields are missing or invalid.
    """
    if not isinstance(result, dict):
        raise ValueError("Scoring result must be a JSON object (dict)")

    if "coverage" not in result:
        raise ValueError("Scoring result missing 'coverage' key")

    if "feedback" not in result:
        raise ValueError("Scoring result missing 'feedback' key")

    coverage = result["coverage"]
    if not isinstance(coverage, list):
        raise ValueError("'coverage' must be a JSON array")

    if len(coverage) == 0:
        raise ValueError("'coverage' array must not be empty")

    required_keys = {"id", "verdict", "evidence", "reasoning"}
    for i, point in enumerate(coverage):
        if not isinstance(point, dict):
            raise ValueError(f"coverage[{i}] must be a JSON object, got {type(point).__name__}")
        missing = required_keys - point.keys()
        if missing:
            raise ValueError(f"coverage[{i}] missing required key(s): {', '.join(sorted(missing))}")
        verdict = point.get("verdict")
        if verdict not in ("COVER", "PARTIAL", "MISS"):
            raise ValueError(
                f"coverage[{i}] has invalid verdict '{verdict}'. Must be COVER, PARTIAL, or MISS"
            )
        # Normalize optional fields
        if "suggestion" not in point:
            point["suggestion"] = ""

    # Normalize optional top-level fields
    if "overallScore" not in result:
        result["overallScore"] = 0
    if "strengths" not in result:
        result["strengths"] = []
    if "weaknesses" not in result:
        result["weaknesses"] = []
    # Normalize weakness fields
    for w in result.get("weaknesses", []):
        if isinstance(w, dict) and "example" not in w:
            w["example"] = ""
    if "dimensions" not in result:
        result["dimensions"] = []
    # Validate dimensions if present
    for dim in result.get("dimensions", []):
        if not isinstance(dim, dict):
            continue
        if "score" in dim and not isinstance(dim["score"], (int, float)):
            dim["score"] = 0
        if "comment" not in dim:
            dim["comment"] = ""

    logger.info("Scoring result validation passed: %d coverage points", len(coverage))


def evaluate_answer(
    session_id: str, question_index: int, question: dict, retry_count: int = 0
) -> dict:
    """Full scoring pipeline: load recording → convert → ASR → LLM → save.

    Args:
        session_id: Interview session identifier.
        question_index: Zero-based question number in the session.
        question: Question dict with 'id', 'fullText', 'scorePoints' keys.
        retry_count: Internal retry counter (0 for first attempt, 1 for retry).

    Returns:
        Dict with status "scored" (success) or "failed" (error after retries).
    """
    # Derive recording path using same convention as recording_service
    recordings_base = Path(RECORDINGS_DIR)
    webm_path = recordings_base / session_id / f"q{question_index}.webm"

    if not webm_path.exists():
        msg = f"Recording not found: {webm_path}"
        logger.error(msg)
        if retry_count >= 1:
            return {"status": "failed", "error": msg, "question_index": question_index}
        return evaluate_answer(session_id, question_index, question, retry_count=retry_count + 1)

    wav_path = None
    try:
        # Step 1: Convert WebM to WAV via ffmpeg
        wav_path = webm_path.with_suffix(".wav")
        logger.info(
            "Converting WebM to WAV: %s -> %s (retry=%d)",
            webm_path, wav_path, retry_count,
        )
        result = subprocess.run(
            [
                FFMPEG_BIN, "-y",
                "-i", str(webm_path),
                "-ar", "16000",
                "-ac", "1",
                "-sample_fmt", "s16",
                str(wav_path),
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=30,
        )

        # Step 2: Validate WAV — must be more than 44 bytes (header only = silent/empty)
        wav_size = wav_path.stat().st_size
        if wav_size <= 44:
            logger.warning("Converted WAV is header-only (%d bytes) — silent/empty recording", wav_size)
            return {
                "status": "failed",
                "error": "无有效语音",
                "question_index": question_index,
            }

        # Step 3: Run ASR via existing service
        logger.info("Running ASR on WAV: %s", wav_path)
        transcript = transcribe_audio(str(wav_path))
        logger.info("ASR transcript length: %d chars", len(transcript))

        if not transcript or not transcript.strip():
            logger.warning("ASR returned empty transcript for %s", wav_path)
            return {
                "status": "failed",
                "error": "语音识别无结果",
                "question_index": question_index,
            }

        # Step 4: Parse scorePoints
        score_points_text = question.get("scorePoints") or ""
        points = parse_score_points(score_points_text)
        if not points:
            # Treat entire scorePoints text as a single criterion
            logger.warning("No points parsed from scorePoints, treating as single criterion")
            points = [{"id": 1, "section": "", "text": score_points_text.strip()}]

        # Step 5: Build prompts and call LLM
        user_prompt = build_scoring_prompt(question["fullText"], points, transcript)
        logger.info("Calling Qwen for scoring (%d points, prompt=%d chars)", len(points), len(user_prompt))

        response = Generation.call(
            model="qwen-max",
            messages=[
                {"role": "system", "content": SCORING_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            result_format="message",
            temperature=0.1,
            top_p=0.8,
            seed=42,
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"Qwen scoring failed: [{response.status_code}] {response.message}"
            )

        # Step 6: Parse and validate LLM response
        raw_content = response.output.choices[0].message.content
        logger.info("LLM raw response length: %d chars", len(raw_content))

        try:
            llm_result = json.loads(raw_content)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse LLM JSON response: {e}") from e

        validate_scoring_result(llm_result)

        # Step 7: Compute coverage summary
        summary = compute_coverage_summary(llm_result["coverage"])

        # Step 8: Assemble final result
        scoring_result = {
            "question_index": question_index,
            "question_id": question.get("id", ""),
            "status": "scored",
            "transcript": transcript,
            "coverage": llm_result["coverage"],
            "feedback": llm_result.get("feedback", ""),
            "coveredCount": summary["coveredCount"],
            "totalCount": summary["totalCount"],
            "overallScore": llm_result.get("overallScore", 0),
            "dimensions": llm_result.get("dimensions", []),
            "strengths": llm_result.get("strengths", []),
            "weaknesses": llm_result.get("weaknesses", []),
        }

        logger.info(
            "Scoring complete: q=%d, covered=%d/%d, status=%s",
            question_index, summary["coveredCount"], summary["totalCount"], scoring_result["status"],
        )
        return scoring_result

    except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        msg = f"FFmpeg conversion failed: {e}"
        logger.error(msg)
        if retry_count >= 1:
            return {"status": "failed", "error": msg, "question_index": question_index}
        return evaluate_answer(session_id, question_index, question, retry_count=retry_count + 1)

    except (RuntimeError, ValueError) as e:
        msg = f"Scoring pipeline error: {e}"
        logger.error(msg)
        if retry_count >= 1:
            return {"status": "failed", "error": str(e), "question_index": question_index}
        logger.info("Retrying scoring pipeline (retry %d -> %d)", retry_count, retry_count + 1)
        time.sleep(1)  # Brief delay before retry
        return evaluate_answer(session_id, question_index, question, retry_count=retry_count + 1)

    except Exception as e:
        msg = f"Unexpected scoring error: {e}"
        logger.exception(msg)
        if retry_count >= 1:
            return {"status": "failed", "error": str(e), "question_index": question_index}
        time.sleep(1)
        return evaluate_answer(session_id, question_index, question, retry_count=retry_count + 1)

    finally:
        # Clean up WAV file
        if wav_path and wav_path.exists():
            try:
                wav_path.unlink()
                logger.debug("Cleaned up WAV: %s", wav_path)
            except OSError:
                logger.warning("Failed to clean up WAV: %s", wav_path)


def save_scoring_result(session_id: str, question_index: int, result: dict) -> None:
    """Persist a scoring result to the session's scoring.json file.

    Loads existing results, upserts the new result (by question_index),
    and writes back. Creates the directory structure if needed.

    Args:
        session_id: Interview session identifier.
        question_index: Zero-based question number.
        result: Scoring result dict to persist.
    """
    session_dir = Path(RECORDINGS_DIR) / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    scoring_file = session_dir / "scoring.json"

    # Load existing results
    existing = load_scoring_results(session_id)

    # Upsert: replace entry with matching question_index, or append if new
    replaced = False
    for i, entry in enumerate(existing):
        if entry.get("question_index") == result.get("question_index"):
            existing[i] = result
            replaced = True
            break

    if not replaced:
        existing.append(result)

    try:
        scoring_file.write_text(
            json.dumps(existing, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        logger.info(
            "Scoring result saved: session=%s, q=%d, status=%s",
            session_id, result.get("question_index"), result.get("status"),
        )
    except OSError as e:
        raise RuntimeError(
            f"Failed to save scoring result for session {session_id}, "
            f"question {question_index}: {e}"
        )


def generate_model_answer(question_text: str, points: list[dict]) -> str:
    """Generate a model answer covering all scoring points for a question.

    Args:
        question_text: Full text of the interview question.
        points: List of parsed score point dicts from parse_score_points().

    Returns:
        Model answer text in Chinese, or empty string on failure.
    """
    points_lines = []
    for p in points:
        section_info = f" [{p['section']}]" if p.get("section") and p["section"] != p["text"] else ""
        points_lines.append(f"  {p['id']}.{section_info} {p['text']}")
    points_text = "\n".join(points_lines)

    user_prompt = f"""Question:
{question_text}

Scoring Criteria (the model answer MUST cover ALL of these):
{points_text}

Generate a model answer that comprehensively covers all scoring points above.
The answer should demonstrate what a PERFECT response looks like for a civil service exam interview."""

    logger.info("Calling Qwen for model answer generation (%d points)", len(points))
    try:
        response = Generation.call(
            model="qwen-max",
            messages=[
                {"role": "system", "content": MODEL_ANSWER_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            result_format="message",
            temperature=0.3,
            top_p=0.8,
            seed=42,
        )

        if response.status_code != 200:
            logger.error("Model answer generation failed: [%d] %s", response.status_code, response.message)
            return ""

        raw_content = response.output.choices[0].message.content
        result = json.loads(raw_content)
        answer = result.get("modelAnswer", "")
        logger.info("Model answer generated: %d chars", len(answer))
        return answer
    except Exception as e:
        logger.error("Failed to generate model answer: %s", e)
        return ""

# In-memory cache for model answers: key=question_id, value=answer_text
_model_answer_cache: dict[str, str] = {}


def load_scoring_results(session_id: str) -> list[dict]:
    """Load all scoring results for a session from scoring.json.

    Args:
        session_id: Interview session identifier.

    Returns:
        List of scoring result dicts. Returns empty list if file does not exist.
    """
    scoring_file = Path(RECORDINGS_DIR) / session_id / "scoring.json"

    if not scoring_file.exists():
        return []

    try:
        content = scoring_file.read_text(encoding="utf-8")
        results = json.loads(content)
        if not isinstance(results, list):
            logger.warning("scoring.json for session %s is not a list", session_id)
            return []
        return results
    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to load scoring.json for session %s: %s", session_id, e)
        return []
