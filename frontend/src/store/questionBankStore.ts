import { create } from 'zustand';
import type { Question } from '../types/question';
import { loadQuestions } from '../api/questionsApi';

interface QuestionBankStore {
  // Data
  questions: Question[];
  loading: boolean;
  error: string | null;

  // Selection
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  isSelected: (id: string) => boolean;

  // Computed (exposed as methods that compute on access)
  isMaxReached: () => boolean;
  canProceed: () => boolean;

  // Actions
  loadQuestions: () => Promise<void>;
  resetSelection: () => void;
}

export const useQuestionBankStore = create<QuestionBankStore>((set, get) => ({
  // Initial state
  questions: [],
  loading: false,
  error: null,
  selectedIds: [],

  // Selection actions
  toggleSelect: (id: string) => {
    const state = get();
    if (state.selectedIds.includes(id)) {
      // Remove selection
      set({ selectedIds: state.selectedIds.filter(sid => sid !== id) });
    } else {
      // Add selection (only if not at max)
      if (state.selectedIds.length >= 4) return;
      set({ selectedIds: [...state.selectedIds, id] });
    }
  },

  isSelected: (id: string) => {
    return get().selectedIds.includes(id);
  },

  isMaxReached: () => {
    return get().selectedIds.length >= 4;
  },

  canProceed: () => {
    return get().selectedIds.length >= 3;
  },

  // Data loading
  loadQuestions: async () => {
    set({ loading: true, error: null });
    try {
      const questions = await loadQuestions();
      set({ questions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '加载失败，请刷新页面重试',
        loading: false,
      });
    }
  },

  resetSelection: () => {
    set({ selectedIds: [] });
  },
}));
