import { API_BASE_URL } from './client';
import type { ScoringResult, ModelAnswerResult } from '../types/scoring';

/**
 * Trigger the async scoring pipeline for a single question.
 *
 * POST /api/scoring/evaluate
 * Sends the session ID, question index, and question ID to the backend
 * to kick off the ASR + LLM evaluation pipeline.
 *
 * @param sessionId - The interview session UUID
 * @param questionIndex - Zero-based question number in the session
 * @param questionId - Question identifier from questions.json
 * @throws Error with status code if the backend returns a non-ok response
 */
export async function triggerScoring(
  sessionId: string,
  questionIndex: number,
  questionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scoring/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_index: questionIndex,
      question_id: questionId,
    }),
  });

  if (!response.ok) {
    const errorMsg = `Scoring trigger failed: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Fetch all scoring results for a session.
 *
 * GET /api/scoring/results/{sessionId}
 * Returns the current state of all scoring results. Results that haven't
 * been started yet will have status 'not_started'. In-progress results
 * will show 'pending'. Completed results include transcript, coverage
 * data, and feedback.
 *
 * @param sessionId - The interview session UUID
 * @returns Array of scoring results, one per question
 * @throws Error with status code if the backend returns a non-ok response
 */
export async function fetchScoringResults(
  sessionId: string
): Promise<ScoringResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/scoring/results/${encodeURIComponent(sessionId)}`
  );

  if (!response.ok) {
    const errorMsg = `Failed to fetch results: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Re-trigger scoring for a previously evaluated question.
 *
 * POST /api/scoring/rescore
 * Re-runs the ASR + LLM pipeline for the specified question. The card
 * should show a pending state until the new results arrive via polling.
 *
 * @param sessionId - The interview session UUID
 * @param questionIndex - Zero-based question number in the session
 * @param questionId - Question identifier from questions.json
 * @throws Error with status code if the backend returns a non-ok response
 */
export async function rescoreQuestion(
  sessionId: string,
  questionIndex: number,
  questionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scoring/rescore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_index: questionIndex,
      question_id: questionId,
    }),
  });

  if (!response.ok) {
    const errorMsg = `Rescore failed: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Fetch or generate a model answer for a question.
 *
 * GET /api/scoring/model-answer/{questionId}
 * Returns a model/standard answer covering all score points.
 * Results are cached server-side after first generation.
 *
 * @param questionId - Question identifier from questions.json
 * @returns Model answer result with text and cache status
 */
export async function fetchModelAnswer(
  questionId: string
): Promise<ModelAnswerResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/scoring/model-answer/${encodeURIComponent(questionId)}`
  );

  if (!response.ok) {
    const errorMsg = `Failed to fetch model answer: ${response.status}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return response.json();
}
