import { Typography } from 'antd';

const { Text } = Typography;

interface RecordingIndicatorProps {
  recordingDuration: number;
  isRecording: boolean;
  micDenied: boolean;
}

function formatTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const BAR_COUNT = 7;
const BAR_BASE_HEIGHTS = [12, 20, 8, 16, 10, 18, 14];
const BAR_ANIMATION_DELAYS = ['0s', '0.1s', '0.2s', '0.3s', '0.4s', '0.5s', '0.6s'];

const keyframeCss = `
@keyframes blink-recording {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes wave {
  from { transform: scaleY(0.5); }
  to { transform: scaleY(1.2); }
}
`;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#FF4D4F',
    flexShrink: 0,
  },
  durationText: {
    fontSize: 14,
    fontWeight: 400,
    color: '#262626',
  },
  waveformContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 24,
  },
};

export default function RecordingIndicator({
  recordingDuration,
  isRecording,
  micDenied,
}: RecordingIndicatorProps) {
  if (!isRecording && !micDenied) {
    return null;
  }

  if (micDenied) {
    return null;
  }

  const displayTime = formatTime(recordingDuration);

  return (
    <div style={styles.wrapper}>
      <style>{keyframeCss}</style>
      <div style={styles.statusRow}>
        <div
          style={styles.dot}
          className="recording-dot"
          aria-label="正在录音"
        />
        <Text style={styles.durationText}>
          录音中 {displayTime}
        </Text>
      </div>
      <div style={styles.waveformContainer} aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              width: 4,
              height: BAR_BASE_HEIGHTS[i],
              borderRadius: '2px 2px 0 0',
              backgroundColor: '#BE1E2D',
              animation: isRecording ? 'wave 0.8s ease-in-out infinite alternate' : 'none',
              animationDelay: BAR_ANIMATION_DELAYS[i],
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
    </div>
  );
}
