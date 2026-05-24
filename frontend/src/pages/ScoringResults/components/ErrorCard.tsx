import { useEffect, useState } from 'react';
import { Card, Button, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ErrorCardProps {
  questionTitle: string;
  errorMessage?: string;
  animationDelay?: number;
  onRetry: () => void;
}

const cardStyle: React.CSSProperties = {
  marginBottom: 24,
  width: '100%',
};

const cardBodyStyle: React.CSSProperties = {
  padding: 24,
};

const errorContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 24,
  marginBottom: 16,
};

const errorHeadingStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#FF4D4F',
  marginTop: 12,
};

const errorDetailStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  color: '#8C8C8C',
  marginTop: 8,
  textAlign: 'center' as const,
  maxWidth: 480,
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: 16,
};

function getAnimatedStyle(
  visible: boolean,
  animationDelay: number,
  prefersReducedMotion: boolean,
): React.CSSProperties {
  if (prefersReducedMotion) {
    return {};
  }
  return {
    opacity: visible ? 1 : 0,
    transition: 'opacity 200ms ease-out',
    transitionDelay: `${animationDelay}ms`,
  };
}

export default function ErrorCard({
  questionTitle,
  errorMessage,
  animationDelay = 0,
  onRetry,
}: ErrorCardProps) {
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const animatedStyle = getAnimatedStyle(visible, animationDelay, prefersReducedMotion);

  return (
    <Card style={{ ...cardStyle, ...animatedStyle }} bodyStyle={cardBodyStyle}>
      <Title level={4} style={{ margin: 0 }}>
        {questionTitle}
      </Title>

      <div style={errorContentStyle}>
        <CloseCircleOutlined style={{ fontSize: 24, color: '#FF4D4F' }} />
        <Text style={errorHeadingStyle}>评分失败</Text>
        {errorMessage && <Text style={errorDetailStyle}>{errorMessage}</Text>}
      </div>

      <div style={buttonContainerStyle}>
        <Button
          style={{ borderColor: '#FF4D4F', color: '#FF4D4F' }}
          onClick={onRetry}
        >
          点击重试
        </Button>
      </div>
    </Card>
  );
}
