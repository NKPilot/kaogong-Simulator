import { Typography } from 'antd';
import type { QuestionStatus } from '../../types/interview';

const { Text } = Typography;

interface StatusTextBarProps {
  questionStatus: QuestionStatus;
  currentIndex: number;
  timerRemaining: number;
  ttsError?: boolean;
  ttsLoading?: boolean;
}

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#262626',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StatusTextBar({
  questionStatus,
  currentIndex,
  timerRemaining,
  ttsError = false,
  ttsLoading = false,
}: StatusTextBarProps) {
  let text = '';

  switch (questionStatus) {
    case 'reading':
      if (ttsError) {
        text = '题目朗读失败，可查看下方题目文字';
      } else if (ttsLoading) {
        text = `正在准备第 ${currentIndex + 1} 题朗读...`;
      } else {
        text = `正在朗读第 ${currentIndex + 1} 题...`;
      }
      break;
    case 'thinking':
      text = `思考时间剩余 ${formatTime(timerRemaining)}`;
      break;
    case 'answering':
      text = `答题时间剩余 ${formatTime(timerRemaining)}`;
      break;
    case 'idle':
    case 'transition':
    case 'complete':
      text = '';
      break;
  }

  if (!text) return null;

  return (
    <div style={containerStyle}>
      <Text style={statusTextStyle}>{text}</Text>
    </div>
  );
}
