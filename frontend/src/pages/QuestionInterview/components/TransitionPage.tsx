import { Steps, Typography } from 'antd';

const { Text } = Typography;

interface TransitionPageProps {
  currentIndex: number;
  total: number;
  isLastQuestion: boolean;
  visible: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  zIndex: 100,
  animation: 'transitionFadeIn 300ms ease-out forwards',
};

const headingStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#262626',
  marginBottom: 16,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 400,
  color: '#8C8C8C',
  marginTop: 16,
};

const stylesId = 'transition-page-styles';

export default function TransitionPage({
  currentIndex,
  total,
  isLastQuestion,
  visible,
}: TransitionPageProps) {
  if (!visible) return null;

  const heading = isLastQuestion ? '所有题目作答完毕' : `第 ${currentIndex + 1} 题完成`;
  const subtitle = isLastQuestion ? '即将进入评分环节...' : '下一题即将开始...';

  const items = Array.from({ length: total }, (_, i) => ({
    status: i <= currentIndex ? 'finish' : 'wait' as const,
  }));

  return (
    <>
      <style id={stylesId}>{`
        @keyframes transitionFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion) {
          .transition-page-overlay {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className="transition-page-overlay"
        style={overlayStyle}
      >
        <Text style={headingStyle}>{heading}</Text>
        <Steps
          type="default"
          size="small"
          direction="horizontal"
          current={currentIndex + 1}
          items={items}
        />
        <Text style={subtitleStyle}>{subtitle}</Text>
      </div>
    </>
  );
}
