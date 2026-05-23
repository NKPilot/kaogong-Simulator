export type QuestionStatus = 'idle' | 'reading' | 'thinking' | 'answering' | 'transition' | 'complete';

export type MicPermission = 'prompt' | 'granted' | 'denied';

export interface InterviewStore {
  // Session
  sessionId: string;
  currentIndex: number;
  questionStatus: QuestionStatus;

  // Timer
  timerRemaining: number;
  timerTotal: number;
  timerRunning: boolean;

  // Recording
  recordingBlob: Blob | null;
  recordingDuration: number;
  micPermission: MicPermission;

  // Re-read
  rereadUsed: boolean;

  // Actions
  startInterview: () => void;
  nextQuestion: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: (seconds: number) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setMicPermission: (status: MicPermission) => void;
  setRereadUsed: () => void;
  setQuestionStatus: (status: QuestionStatus) => void;
  completeInterview: () => void;
}
