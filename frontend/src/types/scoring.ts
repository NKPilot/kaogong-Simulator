/**
 * Scoring system types for the interview simulator.
 *
 * These types define the data contracts between the backend scoring API
 * and the frontend Zustand store and UI components.
 */

/**
 * Scoring status for a single question.
 *
 * - `not_started` — scoring has not been triggered yet for this question
 * - `pending` — scoring is in progress (ASR + LLM pipeline running)
 * - `scored` — scoring completed successfully
 * - `failed` — scoring failed after auto-retry (per D-10)
 */
export type ScoringStatus = 'not_started' | 'pending' | 'scored' | 'failed';

/**
 * Per-point coverage verdict from LLM evaluation.
 *
 * - `COVER` — point fully covered (green dot per D-06)
 * - `PARTIAL` — point partially covered (orange dot per D-06)
 * - `MISS` — point not covered (red dot per D-06)
 */
export type CoverageVerdict = 'COVER' | 'PARTIAL' | 'MISS';

/**
 * A single score point with its coverage verdict and supporting evidence.
 */
export interface CoveragePoint {
  /** Point identifier (1-based, matching scorePoints list order) */
  id: number;
  /** Top-level section heading text (e.g., "描述漫画", "分析论证") */
  section: string;
  /** The individual scoring point text */
  text: string;
  /** Coverage verdict assigned by LLM evaluation */
  verdict: CoverageVerdict;
  /** Excerpt from the ASR transcript supporting the verdict */
  evidence: string;
  /** LLM reasoning for the verdict (in Chinese) */
  reasoning: string;
  /** For PARTIAL/MISS: example of what candidate could have said (in Chinese) */
  suggestion?: string;
}

/** A specific strength found in the candidate's answer */
export interface Strength {
  /** Short label for the strength (e.g., "逻辑清晰") */
  title: string;
  /** Description of the strength (1-2 sentences in Chinese) */
  description: string;
}

/** A multi-dimensional scoring dimension */
export interface ScoringDimension {
  /** Dimension name (e.g., "语言表达", "逻辑结构") */
  name: string;
  /** Score 0-10 */
  score: number;
  /** Brief comment on this dimension */
  comment: string;
}

/**
 * Complete scoring result for a single interview question.
 */
export interface ScoringResult {
  /** Zero-based question number within the interview session */
  questionIndex: number;
  /** Question identifier from questions.json */
  questionId: string;
  /** Display title for the question (from Question.title) */
  questionTitle: string;
  /** Current scoring status for this question */
  status: ScoringStatus;
  /** ASR transcription text (populated when status is 'scored') */
  transcript?: string;
  /** Per-point coverage array (populated when status is 'scored') */
  coverage?: CoveragePoint[];
  /** LLM-generated textual feedback in Chinese (populated when status is 'scored') */
  feedback?: string;
  /** Number of fully covered points (populated when status is 'scored') */
  coveredCount?: number;
  /** Total number of scorePoints for this question (populated when status is 'scored') */
  totalCount?: number;
  /** Error message (populated when status is 'failed') */
  error?: string;
  /** Overall holistic score 0-100 (populated when status is 'scored') */
  overallScore?: number;
  /** Strengths identified in the answer (populated when status is 'scored') */
  strengths?: Strength[];
  /** Weaknesses identified in the answer (populated when status is 'scored') */
  weaknesses?: Strength[];
  /** Multi-dimensional scores (populated when status is 'scored') */
  dimensions?: ScoringDimension[];
}

/** Model answer response from the API */
export interface ModelAnswerResult {
  question_id: string;
  modelAnswer: string;
  cached: boolean;
}

/**
 * Zustand store shape for scoring results state management.
 */
export interface ScoringStore {
  /** Array of scoring results, one entry per question in interview order */
  results: ScoringResult[];
  /** Whether the polling loop is currently active */
  isPolling: boolean;
  /** True if the 60s maximum polling duration has been exceeded */
  pollTimeout: boolean;

  /** Begin polling for scoring results */
  startPolling: (sessionId: string, questionCount: number) => void;
  /** Clear polling interval and stop the polling loop */
  stopPolling: () => void;
  /** Fire scoring trigger for a question with optimistic pending update */
  triggerScoring: (sessionId: string, questionIndex: number, questionId: string, questionTitle: string) => Promise<void>;
  /** Re-score a question with optimistic pending update */
  rescoreCard: (sessionId: string, questionIndex: number, questionId: string) => Promise<void>;
  /** Clear all results and stop polling */
  reset: () => void;
}

/**
 * Request body for POST /api/scoring/evaluate.
 */
export interface EvaluateRequest {
  session_id: string;
  question_index: number;
  question_id: string;
}

/**
 * Request body for POST /api/scoring/rescore.
 * Same shape as EvaluateRequest.
 */
export interface RescoreRequest {
  session_id: string;
  question_index: number;
  question_id: string;
}
