import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { fetchGuidance } from '../../api/guidanceApi';
import { synthesizeSpeech } from '../../api/ttsApi';
import { useQuestionBankStore } from '../../store/questionBankStore';
import RedBanner from './components/RedBanner';
import ExaminerRow from './components/ExaminerRow';
import GuidanceToggle from './components/GuidanceToggle';
import TTSControls from './components/TTSControls';
import CTAButton from './components/CTAButton';
import './components/EntryAnimation.css';

const { Text } = Typography;

export default function ExamRoomPage() {
  const navigate = useNavigate();

  // Zustand store data
  const selectedIds = useQuestionBankStore((s) => s.selectedIds);
  const questions = useQuestionBankStore((s) => s.questions);

  // Guidance state
  const [guidanceText, setGuidanceText] = useState<{ title: string; paragraphs: string[] } | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(true);
  const [guidanceError, setGuidanceError] = useState(false);

  // TTS / audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [ttsError, setTtsError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);

  // Compute selected question count
  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));
  const questionCount = selectedQuestions.length;

  // Create hidden audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handlePlay = () => {
      setAudioPlaying(true);
      setAudioPaused(false);
      setAudioEnded(false);
      setPlayBlocked(false);
    };
    const handlePause = () => {
      setAudioPlaying(false);
      setAudioPaused(true);
    };
    const handleEnded = () => {
      setAudioPlaying(false);
      setAudioPaused(false);
      setAudioEnded(true);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Fetch guidance and TTS on mount
  useEffect(() => {
    let cancelled = false;

    async function loadGuidanceAndAudio() {
      try {
        // Step 1: Fetch guidance text
        const guidance = await fetchGuidance(questionCount || 3);
        if (cancelled) return;
        setGuidanceText(guidance);
        setGuidanceLoading(false);

        // Step 2: TTS with exact same text
        const fullText = guidance.paragraphs.join('');
        setAudioLoading(true);
        try {
          const audioData = await synthesizeSpeech(fullText);
          if (cancelled) return;
          const blob = new Blob([audioData], { type: 'audio/mpeg' });
          setAudioBlob(blob);
          setAudioLoading(false);

          const url = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.src = url;

            // Step 3: Attempt auto-play
            try {
              await audioRef.current.play();
            } catch (playErr) {
              if (
                playErr instanceof DOMException &&
                playErr.name === 'NotAllowedError'
              ) {
                setPlayBlocked(true);
              } else {
                setTtsError(true);
              }
            }
          }
        } catch {
          if (!cancelled) {
            setTtsError(true);
            setAudioLoading(false);
          }
        }
      } catch {
        if (!cancelled) {
          setGuidanceError(true);
          setGuidanceLoading(false);
        }
      }
    }

    loadGuidanceAndAudio();

    return () => {
      cancelled = true;
    };
  }, [questionCount]);

  // Handler: play/pause toggle
  const handlePlayPause = () => {
    if (!audioRef.current || ttsError) return;

    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // ignore play errors from user-initiated play
      });
    }
  };

  // Handler: replay
  const handleReplay = () => {
    if (!audioRef.current || ttsError) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // ignore play errors
    });
  };

  // Handler: play overlay click (unblock autoplay)
  const handlePlayOverlay = () => {
    if (!audioRef.current) return;

    audioRef.current.play().catch(() => {
      // Fallback if still blocked
    });
  };

  // Handler: CTA button click
  const handleStartExam = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    navigate('/exam-room/question/1');
  };

  return (
    <div className="exam-room-entry" style={{ marginLeft: -32, marginRight: -32 }}>
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
            点击播放引导语
          </Button>
        </div>
      )}

      {/* Full-width red banner */}
      <RedBanner />

      {/* Centered content area */}
      <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: 0 }}>
        <ExaminerRow />

        {/* Spacer: 2xl = 48px */}
        <div style={{ height: 48 }} />

        {/* Guidance loading state */}
        {guidanceLoading && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
            <Text style={{ marginLeft: 12, fontSize: 14, color: '#8C8C8C' }}>
              正在加载引导语...
            </Text>
          </div>
        )}

        {/* Guidance error state */}
        {guidanceError && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Text style={{ fontSize: 14, color: '#8C8C8C' }}>
              引导语加载失败，请检查网络连接后重试
            </Text>
          </div>
        )}

        {/* Ready state: guidance loaded */}
        {guidanceText && !guidanceError && (
          <>
            <GuidanceToggle paragraphs={guidanceText.paragraphs} />
            <TTSControls
              playing={audioPlaying}
              paused={audioPaused}
              ended={audioEnded}
              error={ttsError}
              loading={audioLoading}
              onPlayPause={handlePlayPause}
              onReplay={handleReplay}
            />
            <CTAButton onClick={handleStartExam} />
          </>
        )}
      </div>

      {/* Hidden audio element (managed via ref, no DOM rendering needed) */}
    </div>
  );
}
