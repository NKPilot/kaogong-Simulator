---
phase: 01-foundation-question-bank
plan: 01
subsystem: data
tags: python, jsonl, data-extraction, json, scored-questions

# Dependency graph
requires: []
provides:
  - backend/data/questions.json — single source of truth for all 16 scored questions
  - scripts/extract_scored_questions.py — reproducible extraction pipeline
affects: [02-backend-scaffold, 03-frontend-scaffold, 04-question-integration]

# Tech tracking
tech-stack:
  added: [python standard library only: json, os, sys, pathlib]
  patterns: [jsonl-to-json extraction, data normalization pipeline]

key-files:
  created:
    - scripts/extract_scored_questions.py
    - backend/data/questions.json
  modified: []

key-decisions:
  - "JSON output uses short-form type (A/B/C) for programmatic use, with display labels handled in frontend"
  - "Title format: '{paper.title} · 第{question_no}题' for user context"
  - "Output written with ensure_ascii=False for Chinese character preservation"

patterns-established:
  - "Project root-relative path constants for data file references"
  - "Structured error handling with clear messages and sys.exit on failure"
  - "Per-record validation warnings for unscored records"
  - "Summary table printed to stdout with column alignment for human verification"

# Metrics
duration: 3min
completed: 2026-05-23
---

# Phase 1 Plan 01: Extract Scored Questions Summary

**Python extraction script that reads 227 records from records.jsonl, filters to 16 with non-empty score_points, normalizes types, and writes a clean questions.json to backend/data/**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-23T13:21:30+08:00
- **Completed:** 2026-05-23T13:24:35+08:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `scripts/extract_scored_questions.py` — a reusable extraction script with full error handling per threat model (missing file, bad JSON, encoding, incorrect count)
- Generated `backend/data/questions.json` — exactly 16 scored questions (8 A, 4 B, 4 C, 0 structured group) with all 7 required fields
- Type normalization verified: all categories converted to short form (A类 -> A, B类 -> B, C类 -> C)
- Chinese text preserved correctly with `ensure_ascii=False`
- Summary table printed with per-question metadata including score_points character count

## Task Commits

Each task was committed atomically:

1. **Task 01.1: Create extraction script** - `138407e` (feat)
2. **Task 01.2: Run extraction and verify output** - `390a504` (feat)

## Files Created/Modified

- `scripts/extract_scored_questions.py` — Extraction script: reads records.jsonl, filters scored questions, normalizes types, writes JSON
- `backend/data/questions.json` — Output JSON: 16 scored questions formatted with 7 normalized fields each

## Decisions Made

- Used only Python standard library (json, os, sys, pathlib) — no external dependencies needed for data extraction
- Title format `"{paper.title} · 第{question_no}题"` provides recognizable context for users browsing questions
- Output type field uses short form ("A", "B", "C") — frontend will map to display labels as needed
- Warning for unscored records printed to stderr to avoid polluting summary stdout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `backend/data/questions.json` ready for Phase 1 Plan 02 (Backend Scaffold) and Plan 03 (Frontend Scaffold)
- Type distribution (8 A, 4 B, 4 C) enables frontend to filter/browse by category
- Each question has a unique `id` field ready for selection tracking in Plan 03

---
*Phase: 01-foundation-question-bank*
*Completed: 2026-05-23*
