import { create } from 'zustand';
import type { ScoringResult, ScoringStore } from '../types/scoring';
import {
  triggerScoring as triggerScoringApi,
  fetchScoringResults,
  rescoreQuestion as rescoreQuestionApi,
} from '../api/scoringApi';

/** Maximum polling duration in milliseconds (60 seconds) */
const MAX_POLL_DURATION_MS = 60000;

/** Polling interval in milliseconds (2.5 seconds per RESEARCH.md Pattern 3) */
const POLL_INTERVAL_MS = 2500;

export const useScoringStore = create<ScoringStore>((set, get) => ({
  // Initial state
  results: [],
  isPolling: false,
  pollTimeout: false,

  /**
   * Begin polling for scoring results.
   *
   * Fetches results immediately, then every 2.5 seconds.
   * Stops polling when all expected questions reach a terminal state
   * ('scored' or 'failed') or after a 60-second timeout.
   *
   * @param sessionId - The interview session UUID
   * @param questionCount - Expected number of questions in the session
   */
  startPolling: (sessionId: string, questionCount: number) => {
    const state = get();
    // Clear any existing polling first
    if (state.isPolling) {
      state.stopPolling();
    }

    set({ isPolling: true, pollTimeout: false });

    // Maximum duration timeout (60s)
    const timeoutId = setTimeout(() => {
      const s = get();
      if (s.isPolling) {
        set({ isPolling: false, pollTimeout: true });
      }
    }, MAX_POLL_DURATION_MS);

    // Immediate first fetch (no initial delay)
    const poll = async () => {
      try {
        const fetched = await fetchScoringResults(sessionId);
        const current = get().results;

        // Merge: keep local 'pending' entries not yet reflected in backend results
        const merged = [...fetched];
        for (const local of current) {
          if (
            local.status === 'pending' &&
            !fetched.find((f: ScoringResult) => f.questionIndex === local.questionIndex)
          ) {
            merged.push(local);
          }
        }
        set({ results: merged });

        // Check if all expected questions are terminal
        const allTerminal =
          results.length >= questionCount &&
          results.every((r: ScoringResult) => r.status === 'scored' || r.status === 'failed');

        if (allTerminal) {
          clearTimeout(timeoutId);
          set({ isPolling: false });
        }
      } catch {
        // Silently continue polling on network errors;
        // individual card states handle their own error display
      }
    };

    // Fetch immediately
    poll();

    // Start periodic polling
    const intervalId = setInterval(() => {
      const s = get();
      if (!s.isPolling) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        return;
      }
      poll();
    }, POLL_INTERVAL_MS);

    // Store cleanup handles in the module-level closure.
    // The consuming component calls stopPolling() on unmount.
    // We store a cleanup function reference to enable stopPolling.
    const cleanup = () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };

    // Attach cleanup to the store instance so stopPolling can access it.
    // We use a private property pattern via a symbol or a weak map.
    // For simplicity, we store it on the returned object via a hidden key.
    (get as any).__pollingCleanup = cleanup;
  },

  /**
   * Stop the polling loop and clear all timers.
   */
  stopPolling: () => {
    const cleanup = (get as any).__pollingCleanup;
    if (typeof cleanup === 'function') {
      cleanup();
      (get as any).__pollingCleanup = undefined;
    }
    set({ isPolling: false });
  },

  /**
   * Trigger async scoring for a question with optimistic pending update.
   *
   * Updates the result entry to 'pending' status immediately,
   * then fires the backend trigger (fire-and-forget). If the API
   * call fails, updates the result to 'failed' with the error message.
   *
   * @param sessionId - The interview session UUID
   * @param questionIndex - Zero-based question number
   * @param questionId - Question identifier from questions.json
   * @param questionTitle - Display title for the question
   */
  triggerScoring: async (
    sessionId: string,
    questionIndex: number,
    questionId: string,
    questionTitle: string
  ) => {
    const state = get();
    const existingIndex = state.results.findIndex(
      (r) => r.questionIndex === questionIndex
    );

    // Optimistic update: set status to 'pending'
    if (existingIndex >= 0) {
      set({
        results: state.results.map((r, i) =>
          i === existingIndex ? { ...r, status: 'pending' as const } : r
        ),
      });
    } else {
      set({
        results: [
          ...state.results,
          {
            questionIndex,
            questionId,
            questionTitle,
            status: 'pending',
          },
        ],
      });
    }

    // Fire-and-forget: do not await the API call
    triggerScoringApi(sessionId, questionIndex, questionId).catch((err: Error) => {
      // On failure, update the result entry to 'failed'
      set({
        results: get().results.map((r) =>
          r.questionIndex === questionIndex
            ? { ...r, status: 'failed' as const, error: err.message }
            : r
        ),
      });
    });
  },

  /**
   * Re-score a question with optimistic pending update.
   *
   * Sets the card status to 'pending' immediately, then calls the
   * rescore endpoint (fire-and-forget). If the API call fails,
   * reverts the status to 'failed' with the error message.
   *
   * @param sessionId - The interview session UUID
   * @param questionIndex - Zero-based question number
   * @param questionId - Question identifier from questions.json
   */
  rescoreCard: async (
    sessionId: string,
    questionIndex: number,
    questionId: string
  ) => {
    // Optimistic update: set status to 'pending'
    set({
      results: get().results.map((r) =>
        r.questionIndex === questionIndex
          ? { ...r, status: 'pending' as const }
          : r
      ),
    });

    // Fire-and-forget: do not await the API call
    rescoreQuestionApi(sessionId, questionIndex, questionId).catch((err: Error) => {
      // On failure, set status to 'failed'
      set({
        results: get().results.map((r) =>
          r.questionIndex === questionIndex
            ? { ...r, status: 'failed' as const, error: err.message }
            : r
        ),
      });
    });
  },

  /**
   * Reset all scoring state. Stops polling and clears results.
   */
  reset: () => {
    get().stopPolling();
    set({ results: [], pollTimeout: false });
  },
}));
