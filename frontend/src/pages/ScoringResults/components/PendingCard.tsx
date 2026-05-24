import { useEffect, useState } from 'react';
import { Card, Skeleton, Spin, Typography } from 'antd';

const { Title, Text } = Typography;

interface PendingCardProps {
  questionTitle: string;
  animationDelay?: number;
}

const cardStyle: React.CSSProperties = {
  marginBottom: 24,
  width: '100%',
};

const cardBodyStyle: React.CSSProperties = {
  padding: 24,
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 16,
  marginBottom: 16,
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: '#8C8C8C',
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
    transform: visible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 300ms ease-out, transform 300ms ease-out',
    transitionDelay: `${animationDelay}ms`,
  };
}

export default function PendingCard({
  questionTitle,
  animationDelay = 0,
}: PendingCardProps) {
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

      <div style={loadingContainerStyle}>
        <Spin size="small" />
        <Text style={loadingTextStyle}>评分中...</Text>
      </div>

      <Skeleton active paragraph={{ rows: 3 }} />
    </Card>
  );
}
