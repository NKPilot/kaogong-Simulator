import { Typography } from 'antd';

const { Text } = Typography;

interface TimerRingProps {
  remaining: number;
  total: number;
  phaseLabel: string;
  running: boolean;
}

const SIZE = 120;
const CENTER = 60;
const RADIUS = 54;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getRingColor(remaining: number, total: number): string {
  if (total <= 0 || remaining <= 0) return '#FF4D4F';
  if (remaining <= 10) return '#FF4D4F';
  if (remaining <= 30) return '#FA8C16';
  return '#BE1E2D';
}

function getTextColor(remaining: number, total: number): string {
  if (total <= 0 || remaining <= 0) return '#FF4D4F';
  if (remaining <= 10) return '#FF4D4F';
  if (remaining <= 30) return '#FA8C16';
  return '#262626';
}

function getPulseClass(remaining: number, total: number): string {
  if (total <= 0 || remaining <= 0) return '';
  if (remaining <= 10) return 'pulse-fast';
  if (remaining <= 30) return 'pulse-slow';
  return '';
}

function getAriaLabel(displayTime: string): string {
  const parts = displayTime.split(':');
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (m > 0) {
    return `剩余 ${m} 分 ${s} 秒`;
  }
  return `剩余 ${s} 秒`;
}

const keyframeCss = `
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
@keyframes pulse-fast {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
  .pulse-slow, .pulse-fast {
    animation: none !important;
  }
}
`;

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#8C8C8C',
    marginBottom: 8,
  },
  ringContainer: {
    position: 'relative',
    width: SIZE,
    height: SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  timeText: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: 700,
    lineHeight: 1,
    userSelect: 'none',
  },
};

export default function TimerRing({ remaining, total, phaseLabel }: TimerRingProps) {
  const effectiveRemaining = total > 0 ? Math.min(Math.max(remaining, 0), total) : 0;
  const ratio = total > 0 ? effectiveRemaining / total : 1;
  const strokeDashoffset = CIRCUMFERENCE * (1 - ratio);

  const ringColor = getRingColor(remaining, total);
  const textColor = getTextColor(remaining, total);
  const pulseClass = getPulseClass(remaining, total);
  const displayTime = total <= 0 || remaining <= 0 ? '0:00' : formatTime(remaining);

  const ringOpacityClass = pulseClass ? ` ${pulseClass}` : '';

  return (
    <div style={styles.wrapper}>
      <style>{keyframeCss}</style>
      <Text style={styles.label}>{phaseLabel}</Text>
      <div
        style={styles.ringContainer}
        className={ringOpacityClass || undefined}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          style={styles.svg}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#F0F0F0"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
          />
        </svg>
        <span
          style={{ ...styles.timeText, color: textColor }}
          aria-live="polite"
          aria-label={getAriaLabel(displayTime)}
        >
          {displayTime}
        </span>
      </div>
    </div>
  );
}
