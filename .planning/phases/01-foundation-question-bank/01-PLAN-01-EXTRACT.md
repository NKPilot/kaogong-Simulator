---
plan: 01
name: Extract Scored Questions
wave: 1
depends_on: []
files_modified:
  - scripts/extract_scored_questions.py
  - backend/data/questions.json
autonomous: true
---

# Plan 01: Extract Scored Questions (提取 16 道评分题)

Create a Python script that reads the raw `records.jsonl` file, filters for the 16 records that have non-empty `analysis.score_points`, normalizes the fields, and writes a clean `questions.json` file to `backend/data/`. This JSON file is the single source of truth for question data consumed by both backend and frontend in subsequent plans.

## Requirements

| Req ID | Description | Verification |
|--------|-------------|-------------|
| QB-01 | User can browse 16 questions (title, type, year) | Output JSON contains exactly 16 entries with normalized type field |
| QB-02 | User can select 3-4 questions | Output JSON includes unique `id` field for selection tracking |

## Threat Model

```
<threat_model>
  <assets>
    - Question data integrity: extracted JSON must faithfully represent source data
    - Extraction script reliability: must handle malformed input gracefully
  </assets>
  <entry_points>
    - Input: docs/省考数据_整理结果/records.jsonl (local file read, no network)
    - Output: backend/data/questions.json (local file write)
  </entry_points>
  <threats>
    - T1 (HIGH): records.jsonl file missing or unreadable at extraction time
    - T2 (MEDIUM): analysis.score_points field missing on some records (silent data loss)
    - T3 (MEDIUM): JSON serialization error due to encoding issues with Chinese characters
    - T4 (LOW): Incorrect filtering produces wrong number of questions (not exactly 16)
  </threats>
  <mitigations>
    - M1 (T1): Script checks file existence with os.path.exists() and prints clear error message
    - M2 (T2): Script uses dict.get() with default empty string, prints per-record validation warnings
    - M3 (T3): Script opens files with encoding='utf-8' and writes json with ensure_ascii=False
    - M4 (T4): Script prints summary table verifying count=16, all fields present, output file size > 0
  </mitigations>
  <verification>
    Run: python3 scripts/extract_scored_questions.py
    - Exit code 0, no error output
    - Output: "Extracted N/16 questions with score_points" table printed
    - Generated JSON: valid, contains 16 entries, parses without error
  </verification>
</threat_model>
```

## Tasks

### Task 01.1: Create extraction script

<task id="01.1" status="pending">
  <title>Create extraction script</title>
  <description>
    Create scripts/extract_scored_questions.py that reads records.jsonl, filters to only the 16 records with non-empty analysis.score_points, normalizes types (A类 -> A, B类 -> B, C类 -> C, 结构化小组 -> 结构化小组), composes a display title from paper.title + question_no, and writes a clean JSON array to backend/data/questions.json. Prints a human-readable summary table to stdout with id, type, year, and score_points character count for every extracted question.
  </description>
  <read_first>
    - docs/省考数据_整理结果/records.jsonl: source data, understand the 7 top-level keys (id, paper, question_no, question_text, question, analysis, mindmap, source) and the analysis.score_points field format (string)
    - .planning/phases/01-foundation-question-bank/01-CONTEXT.md: D-09 (extract 16 scored questions), D-10 (JSON embedded in frontend)
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Question interface shape (id, title, fullText, type, year, source, scorePoints) and type normalization to short form
  </read_first>
  <action>
    Create file scripts/extract_scored_questions.py with:

    1. Path constants at top:
       - INPUT_PATH = 'docs/省考数据_整理结果/records.jsonl' (resolved relative to project root)
       - OUTPUT_PATH = 'backend/data/questions.json' (resolved relative to project root)

    2. A function read_records(path) that:
       - Opens file with encoding='utf-8'
       - Reads line-by-line, json.loads each line into a list
       - Handles FileNotFoundError with clear message and sys.exit(1)
       - Handles json.JSONDecodeError with line number and sys.exit(1)

    3. A function is_scored(record) that:
       - Returns True if record['analysis'].get('score_points') exists and len(str(...)) > 0
       - Returns False otherwise

    4. A function normalize_type(category: str) -> str that maps:
       - "A类" -> "A"
       - "B类" -> "B"
       - "C类" -> "C"
       - "结构化小组" -> "结构化小组"
       - Anything else -> "A" (fallback, with a printed warning)

    5. A function extract_question(record) -> dict that builds:
       - id: record['id'] (string)
       - title: f"{record['paper']['title']} · 第{record['question_no']}题" (string)
       - fullText: record['question_text'] (string, preserve original line breaks)
       - type: normalize_type(record['paper']['category'])
       - year: record['paper']['year'] (int)
       - source: f"{record['paper']['province']}省考面试真题" (string)
       - scorePoints: record['analysis'].get('score_points', '') (string)

    6. A function print_summary(scored_questions: list) that prints:
       - "Extracted {count} scored questions from {total} total records"
       - A table with columns: ID (first 30 chars), Type, Year, ScorePoints (chars), Title
       - Use formatted string with column widths for alignment

    7. Main block that:
       - Sets project_root = Path(__file__).resolve().parent.parent (navigating from scripts/ up to project root)
       - Reads all records
       - Filters scored questions
       - Extracts and normalizes each
       - Creates backend/data/ directory if it doesn't exist (os.makedirs)
       - Writes JSON with json.dump, indent=2, ensure_ascii=False
       - Prints summary
       - Returns exit code 0

    8. Add a module-level __main__ guard.

    Use only standard library: json, os, sys, pathlib.Path.
  </action>
  <acceptance_criteria>
    1. scripts/extract_scored_questions.py exists and is executable (chmod +x)
    2. Running `python3 scripts/extract_scored_questions.py` from project root exits with code 0
    3. Script prints summary showing exactly 16 questions extracted
    4. backend/data/questions.json is created, valid JSON, parses with `python3 -c "import json; d=json.load(open('backend/data/questions.json')); print(len(d))"` outputting 16
    5. Each entry in questions.json has all 7 fields: id, title, fullText, type, year, source, scorePoints
    6. All 16 entries have type in {"A", "B", "C"} (none has "A类" or "B类" or "C类" — normalization verified)
    7. Score_points is a non-empty string for every entry
  </acceptance_criteria>
</task>

### Task 01.2: Run extraction and verify output

<task id="01.2" status="pending">
  <title>Run extraction and verify output</title>
  <description>
    Execute the extraction script and manually verify that the output JSON is correct — exactly 16 questions, all fields present, type normalization correct, and the JSON parses without error.
  </description>
  <read_first>
    - scripts/extract_scored_questions.py (the script just created in task 01.1)
    - backend/data/questions.json (the output file after running)
  </read_first>
  <action>
    1. From project root, run: `python3 scripts/extract_scored_questions.py`
    2. Verify exit code 0 and summary table prints with 16 rows
    3. Run validation: `python3 -c "
    import json
    d = json.load(open('backend/data/questions.json'))
    assert len(d) == 16, f'Expected 16, got {len(d)}'
    for q in d:
        assert all(k in q for k in ('id','title','fullText','type','year','source','scorePoints')), f'Missing fields in {q[\"id\"]}'
        assert q['type'] in ('A','B','C','结构化小组'), f'Bad type in {q[\"id\"]}: {q[\"type\"]}'
        assert isinstance(q['year'], int), f'Year not int in {q[\"id\"]}'
        assert len(q['fullText']) > 0, f'Empty fullText in {q[\"id\"]}'
        assert len(q['scorePoints']) > 0, f'Empty scorePoints in {q[\"id\"]}'
    print('All 16 questions validated successfully')
    "
    `
    4. Spot-check the first and last entry in the JSON to ensure Chinese text renders correctly
  </action>
  <acceptance_criteria>
    1. Script exits with code 0
    2. Validation script prints "All 16 questions validated successfully"
    3. `cat backend/data/questions.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))"` outputs 16
    4. `cat backend/data/questions.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['title'])"` shows readable Chinese text (not escaped unicode)
  </acceptance_criteria>
</task>

## Verification Criteria

1. `scripts/extract_scored_questions.py` exists and is executable
2. `backend/data/questions.json` exists, is valid JSON, contains exactly 16 entries
3. Each entry has the 7 required fields with correct types
4. Type field is normalized (A类 -> A, etc.)
5. Summary output matches known distribution: 8 A类, 4 B类, 4 C类, 0 结构化小组

## Must Haves

1. BACKEND_DATA_FILE: `backend/data/questions.json` must contain exactly 16 scored questions
2. TITLE_FORMAT: Each question title must include the paper name and question number for user context
3. TYPE_NORMALIZATION: The type field must use short form ("A", "B", "C") for programmatic use, with display labels handled in frontend

## Wave Notes

Wave 1 — extracted data is a prerequisite for Plans 02 (backend reads it) and 03 (frontend embeds it). Must complete before those plans start.
