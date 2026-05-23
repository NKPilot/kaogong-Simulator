import { create } from 'zustand';
import type { InterviewStore } from '../types/interview';

// Constants per D-01 and D-16
const THINKING_TIME = 120;
const ANSWERING_TIME = 180;
const TRANSITION_DELAY = 2500;

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  // Initial state
  sessionId: '',
  currentIndex: 0,
  questionStatus: 'idle',
  timerRemaining: 0,
  timerTotal: 0,
  timerRunning: false,
  recordingBlob: null,
  recordingDuration: 0,
  micPermission: 'prompt',
  rereadUsed: false,

  // Actions
  startInterview: () => {
    set({
      sessionId: crypto.randomUUID(),
      currentIndex: 0,
      questionStatus: 'reading',
      rereadUsed: false,
    });
  },

  nextQuestion: () => {
    const state = get();
    set({
      currentIndex: state.currentIndex + 1,
      questionStatus: 'reading',
      rereadUsed: false,
      recordingBlob: null,
      recordingDuration: 0,
    });
  },

  startTimer: () => {
    set({ timerRunning: true });
  },

  pauseTimer: () => {
    set({ timerRunning: false });
  },

  resetTimer: (seconds: number) => {
    set({
      timerTotal: seconds,
      timerRemaining: seconds,
      timerRunning: true,
    });
  },

  startRecording: async () => {
    set({ recordingBlob: null, recordingDuration: 0 });
  },

  stopRecording: async () => {
    // recordingBlob and final recordingDuration are set by the orchestrator
    // via useInterviewStore.setState() per Zustand direct state patching pattern.
    // This action only stops the recording timer (managed by orchestrator setInterval).
  },

  setMicPermission: (status) => {
    set({ micPermission: status });
  },

  setRereadUsed: () => {
    set({ rereadUsed: true });
  },

  setQuestionStatus: (status) => {
    set({ questionStatus: status });
  },

  completeInterview: () => {
    set({ questionStatus: 'complete' });
  },
}));
