import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useInterviewStore } from '../../store/interviewStore';
import { useQuestionBankStore } from '../../store/questionBankStore';
import { synthesizeSpeech } from '../../api/ttsApi';
import { uploadRecording } from '../../api/recordingApi';
import RedBanner from '../ExamRoom/components/RedBanner';
import ExaminerRow from '../ExamRoom/components/ExaminerRow';
import TimerRing from './components/TimerRing';
import RecordingIndicator from './components/RecordingIndicator';
import ReReadButton from './components/ReReadButton';
import QuestionDrawer from './components/QuestionDrawer';
import ProgressIndicator from './components/ProgressIndicator';
import StatusTextBar from './components/StatusTextBar';
import TransitionPage from './components/TransitionPage';
import MicPermissionError from './components/MicPermissionError';
import '../ExamRoom/components/EntryAnimation.css';

// Constants per D-01, D-16
const THINKING_TIME = 120;
const ANSWERING_TIME = 180;
const TRANSITION_DELAY = 2500;

export default function QuestionInterviewPage() {
  const navigate = useNavigate();

  // Zustand stores
  const store = useInterviewStore();
  const questionBank = useQuestionBankStore();

  // Derived data
  const selectedIds = questionBank.selectedIds;
  const questions = questionBank.questions;
  const totalQuestions = selectedIds.length;
  const currentQuestion = questions.find((q) => q.id === selectedIds[store.currentIndex]);
  const isLastQuestion = store.currentIndex + 1 >= totalQuestions;

  // Timer label
  const timerLabel =
    store.questionStatus === 'answering' ? '答题时间' : '思考时间';

  // Local state
  const [ttsError, setTtsError] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);

  // Audio ref (hidden Audio element)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  // Timer refs
  const timerIntervalRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  // Guard ref to prevent double TTS fetch for same question
  const readingProcessedRef = useRef<number>(-1);

  // --------------- Timer Management ---------------

  const startTimerInterval = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      const state = useInterviewStore.getState();
      if (state.timerRemaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        timerIntervalRef.current = null;
        useInterviewStore.setState({ timerRunning: false });
        return;
      }
      useInterviewStore.setState({ timerRemaining: state.timerRemaining - 1 });
    }, 1000);
  };

  // --------------- MediaRecorder ---------------

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      store.setMicPermission('granted');

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];

      // Capture current question values for upload (closes over these, not store state)
      const captureSessionId = store.sessionId;
      const captureIndex = store.currentIndex;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        recordingChunksRef.current = [];
        useInterviewStore.setState({ recordingBlob: blob });
        uploadRecording(captureSessionId, captureIndex, blob).catch(console.error);
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start(1000);
      recordingStartTimeRef.current = Date.now();

      // Start recording duration interval
      recordingIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        useInterviewStore.setState({ recordingDuration: elapsed });
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        store.setMicPermission('denied');
      }
    }
  };

  // --------------- Handlers ---------------

  const handleTtsEnded = () => {
    store.setQuestionStatus('thinking');
    store.resetTimer(THINKING_TIME);
    startTimerInterval();
  };

  const handleThinkingEnded = () => {
    store.setQuestionStatus('answering');
    store.resetTimer(ANSWERING_TIME);
    startTimerInterval();
    handleStartRecording();
  };

  const handleAnsweringEnded = () => {
    // Stop MediaRecorder (onstop handler will upload and clean up tracks)
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }

    // Clear recording duration interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    store.setQuestionStatus('transition');

    // Start transition timeout
    transitionTimeoutRef.current = window.setTimeout(() => {
      // Close the drawer for the next question (D-13)
      setDrawerVisible(false);

      const state = useInterviewStore.getState();
      if (state.currentIndex + 1 < totalQuestions) {
        store.nextQuestion();
      } else {
        // Last question done
        store.completeInterview();
        navigate('/results');
      }
    }, TRANSITION_DELAY);
  };

  const handleReRead = () => {
    // Stop current TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    store.setRereadUsed();

    // Re-fetch TTS for same question
    if (!currentQuestion) return;
    synthesizeSpeech(currentQuestion.fullText)
      .then((audioData) => {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(() => {});
        }
      })
      .catch(() => {
        // Ignore TTS error during re-read
      });

    store.resetTimer(THINKING_TIME);
  };

  const handleMicRetry = async () => {
    store.setMicPermission('prompt');
    await handleStartRecording();
  };

  const handlePlayOverlay = () => {
    if (!audioRef.current) return;
    audioRef.current.play().catch(() => {});
    setPlayBlocked(false);
  };

  const handleToggleDrawer = () => setDrawerVisible((prev) => !prev);

  // --------------- Create hidden Audio element on mount ---------------

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleEnded = () => {
      handleTtsEnded();
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------- Core effect: drive question reading ---------------

  useEffect(() => {
    // Initialization: if interview hasn't started, start it
    if (store.questionStatus === 'idle') {
      store.startInterview();
      return;
    }

    // Only handle reading phase
    if (store.questionStatus !== 'reading') return;

    // Prevent double-fetching for same question index
    if (readingProcessedRef.current === store.currentIndex) return;
    readingProcessedRef.current = store.currentIndex;

    // Reset per-question state
    setTtsError(false);
    setPlayBlocked(false);

    const question = questions.find((q) => q.id === selectedIds[store.currentIndex]);
    if (!question) return;

    (async () => {
      try {
        const audioData = await synthesizeSpeech(question.fullText);
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        if (audioRef.current) {
          // Revoke previous object URL if any
          if (audioRef.current.src) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          audioRef.current.src = url;

          try {
            await audioRef.current.play();
          } catch (playErr) {
            if (
              playErr instanceof DOMException &&
              playErr.name === 'NotAllowedError'
            ) {
              setPlayBlocked(true);
            }
          }
        }
      } catch {
        // TTS error degraded mode: show fallback text and auto-advance to thinking
        setTtsError(true);
        store.setQuestionStatus('thinking');
        store.resetTimer(THINKING_TIME);
        startTimerInterval();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentIndex, store.questionStatus]);

  // --------------- Timer-zero useEffect ---------------

  useEffect(() => {
    if (
      store.timerRemaining === 0 &&
      store.timerRunning === false &&
      store.questionStatus === 'thinking'
    ) {
      handleThinkingEnded();
    } else if (
      store.timerRemaining === 0 &&
      store.timerRunning === false &&
      store.questionStatus === 'answering'
    ) {
      handleAnsweringEnded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.timerRemaining, store.timerRunning, store.questionStatus]);

  // --------------- Cleanup on unmount ---------------

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // --------------- Render ---------------

  return (
    <div className="exam-room-entry">
      {/* Play overlay when autoplay blocked */}
      {playBlocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            gap: 16,
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handlePlayOverlay}
            style={{ height: 64, width: 240, fontSize: 18 }}
          >
            点击播放题目
          </Button>
        </div>
      )}

      {/* Full-width red banner */}
      <RedBanner />

      {/* Centered content area */}
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Progress indicator */}
        {totalQuestions > 0 && (
          <ProgressIndicator current={store.currentIndex} total={totalQuestions} />
        )}

        {/* Scaled examiner row (per UI-SPEC C-02: ~80% of Phase 2 size) */}
        <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
          <ExaminerRow />
        </div>

        {/* Spacer: xl = 32px */}
        <div style={{ height: 32 }} />

        {/* Timer ring section */}
        <TimerRing
          remaining={store.timerRemaining}
          total={store.timerTotal}
          phaseLabel={timerLabel}
          running={store.timerRunning}
        />

        {/* Recording indicator (visible during answering phase) */}
        {store.questionStatus === 'answering' && (
          <RecordingIndicator
            recordingDuration={store.recordingDuration}
            isRecording={true}
            micDenied={store.micPermission === 'denied'}
          />
        )}

        {/* Mic permission error */}
        <MicPermissionError
          visible={store.micPermission === 'denied'}
          onRetry={handleMicRetry}
        />

        {/* Status text bar */}
        <StatusTextBar
          questionStatus={store.questionStatus}
          currentIndex={store.currentIndex}
          timerRemaining={store.timerRemaining}
          ttsError={ttsError}
        />

        {/* Spacer: md = 16px */}
        <div style={{ height: 16 }} />

        {/* Action buttons row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <ReReadButton
            visible={store.questionStatus === 'thinking'}
            used={store.rereadUsed}
            onReRead={handleReRead}
          />
          <QuestionDrawer
            questionText={currentQuestion?.fullText || ''}
            questionTitle={currentQuestion?.title || ''}
            visible={drawerVisible}
            onToggle={handleToggleDrawer}
          />
        </div>
      </div>

      {/* Transition page overlay */}
      <TransitionPage
        visible={store.questionStatus === 'transition'}
        currentIndex={store.currentIndex}
        total={totalQuestions}
        isLastQuestion={isLastQuestion}
      />
    </div>
  );
}
