---
quick_id: 260524-lar
description: "生成第一题漫画题的语音答案并保存到历史记录，然后进行打分测试"
date: 2026-05-24
---

## Task 1: Generate TTS audio for the answer text and save as recording

**Files:** `backend/scripts/generate_answer_audio.py` (new)
**Action:** Write a Python script that splits the user's long answer text into ≤500 char chunks,
calls DashScope TTS for each chunk, concatenates the MP3 audio, and saves it
as `recordings/{session_id}/q0.webm`. The session_id will be a new UUID.
Also save a scoring.json with a pending entry so it shows in history.

**Verify:** Audio file exists at recordings/{session_id}/q0.webm and is playable.
**Done:** Audio saved, session visible in history.

## Task 2: Trigger scoring pipeline

**Files:** None (API call)
**Action:** Call POST /api/scoring/evaluate with the session_id, question_index=0,
and question_id=js_exam_00b2138b2b_q01 to trigger the ASR + LLM scoring pipeline.

**Verify:** Scoring result appears in GET /api/scoring/results/{session_id} with status "scored".
**Done:** Scoring complete, results viewable in history page.
