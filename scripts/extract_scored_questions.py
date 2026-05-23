#!/usr/bin/env python3
"""
Extract Scored Questions from records.jsonl

Reads the raw records.jsonl file, filters for the 16 records that have non-empty
analysis.score_points, normalizes fields, and writes a clean questions.json to
backend/data/. This JSON file is the single source of truth for question data
consumed by both backend and frontend in subsequent plans.
"""

import json
import os
import sys
from pathlib import Path

# Path constants — resolved relative to project root
INPUT_PATH = "docs/省考数据_整理结果/records.jsonl"
OUTPUT_PATH = "backend/data/questions.json"


def read_records(path: str) -> list[dict]:
    """
    Read a JSONL file and return a list of record dicts.

    Handles FileNotFoundError and JSONDecodeError with clear error messages.
    """
    records = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(
                        f"Error: Invalid JSON on line {line_no}: {e}",
                        file=sys.stderr,
                    )
                    sys.exit(1)
    except FileNotFoundError:
        print(f"Error: Input file not found: {path}", file=sys.stderr)
        print(
            f"Please ensure the file exists at the project root relative path: "
            f"{INPUT_PATH}",
            file=sys.stderr,
        )
        sys.exit(1)

    return records


def is_scored(record: dict) -> bool:
    """
    Return True if the record has a non-empty analysis.score_points field.
    """
    score_points = record.get("analysis", {}).get("score_points")
    return bool(score_points and len(str(score_points).strip()) > 0)


def normalize_type(category: str) -> str:
    """
    Normalize question type to short form.

    Maps: A类 -> A, B类 -> B, C类 -> C, 结构化小组 -> 结构化小组
    """
    mapping = {
        "A类": "A",
        "B类": "B",
        "C类": "C",
        "结构化小组": "结构化小组",
    }
    result = mapping.get(category)
    if result is None:
        print(
            f"Warning: Unknown category '{category}', falling back to 'A'",
            file=sys.stderr,
        )
        return "A"
    return result


def extract_question(record: dict) -> dict:
    """
    Build a normalized question dict from a raw record.
    """
    paper = record.get("paper", {})
    analysis = record.get("analysis", {})

    title = f"{paper.get('title', '')} · 第{record.get('question_no', '')}题"
    score_points = analysis.get("score_points", "")

    return {
        "id": record.get("id", ""),
        "title": title,
        "fullText": record.get("question_text", ""),
        "type": normalize_type(paper.get("category", "")),
        "year": paper.get("year", 0),
        "source": f"{paper.get('province', '')}省考面试真题",
        "scorePoints": score_points if score_points else "",
    }


def print_summary(scored_questions: list, total_records: int) -> None:
    """
    Print a human-readable summary table of extracted questions.
    """
    count = len(scored_questions)
    print(f"\nExtracted {count} scored questions from {total_records} total records\n")

    # Header
    header = f"{'ID':<32} {'Type':<6} {'Year':<6} {'ScorePoints(chars)':<18} {'Title'}"
    print(header)
    print("-" * len(header))

    for q in scored_questions:
        qid = q["id"]
        qtype = q["type"]
        year = q["year"]
        sp_len = len(q["scorePoints"])
        title = q["title"]
        print(f"{qid:<32} {qtype:<6} {year:<6} {sp_len:<18} {title}")

    print(f"\nSummary: {count}/16 questions with score_points")
    print()


def main() -> None:
    """Main entry point."""
    # Resolve project root: script lives in <project_root>/scripts/
    project_root = Path(__file__).resolve().parent.parent
    input_path = project_root / INPUT_PATH
    output_path = project_root / OUTPUT_PATH

    # Read all records
    records = read_records(str(input_path))
    total_records = len(records)

    # Filter to only scored questions
    scored_records = [rec for rec in records if is_scored(rec)]

    # Warn about unscored records (T2 mitigation)
    unscored = [rec for rec in records if not is_scored(rec)]
    for rec in unscored:
        rid = rec.get("id", "unknown")
        print(
            f"Warning: Record {rid} has no score_points — skipping",
            file=sys.stderr,
        )

    # Extract and normalize each scored question
    scored_questions = [extract_question(rec) for rec in scored_records]

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write output JSON (T3 mitigation: ensure_ascii=False for Chinese characters)
    with open(str(output_path), "w", encoding="utf-8") as f:
        json.dump(scored_questions, f, indent=2, ensure_ascii=False)

    print(f"Output written to: {output_path}")

    # Print summary table
    print_summary(scored_questions, total_records)

    # Validate output (T4 mitigation: verify count)
    output_size = os.path.getsize(str(output_path))
    print(f"Output file size: {output_size} bytes")
    if len(scored_questions) != 16:
        print(
            f"ERROR: Expected 16 scored questions, got {len(scored_questions)}",
            file=sys.stderr,
        )
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
