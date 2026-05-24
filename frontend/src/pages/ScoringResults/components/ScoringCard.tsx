import { useEffect, useState } from 'react';
import { Card, Typography, Collapse, Button } from 'antd';
import type { ScoringResult } from '../../../types/scoring';
import CoverageDots from './CoverageDots';

const { Title, Text } = Typography;

interface ScoringCardProps {
  result: ScoringResult;
  animationDelay?: number;
  onRescore: () => void;
}

const cardStyle: React.CSSProperties = {
  marginBottom: 24,
  width: '100%',
};

const cardBodyStyle: React.CSSProperties = {
  padding: 24,
};

const coverageFractionContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 16,
  marginBottom: 16,
};

const fractionNumberStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.2,
  color: '#BE1E2D',
};

const fractionLabelStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.2,
  color: '#262626',
};

const sectionDividerStyle: React.CSSProperties = {
  borderTop: '1px solid #E8E8E8',
  margin: '16px 0',
};

const feedbackLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  color: '#8C8C8C',
  display: 'block',
  marginBottom: 8,
};

const feedbackBodyStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#262626',
};

const buttonContainerStyle: React.CSSProperties = {
  marginTop: 16,
};

const transcriptTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#262626',
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
    transition: `opacity 300ms ease-out, transform 300ms ease-out`,
    transitionDelay: `${animationDelay}ms`,
  };
}

export default function ScoringCard({
  result,
  animationDelay = 0,
  onRescore,
}: ScoringCardProps) {
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

  const hasTranscript = result.transcript && result.transcript.length > 0;

  return (
    <Card style={{ ...cardStyle, ...animatedStyle }} bodyStyle={cardBodyStyle}>
      <Title level={4} style={{ margin: 0 }}>
        {result.questionTitle}
      </Title>

      <div style={coverageFractionContainerStyle}>
        <span style={fractionNumberStyle}>{result.coveredCount ?? 0}</span>
        <span style={fractionLabelStyle}>
          {' '}/{' '}{result.totalCount ?? 0} 已覆盖
        </span>
      </div>

      <div style={sectionDividerStyle} />

      <CoverageDots coverage={result.coverage || []} />

      {result.feedback && (
        <>
          <div style={sectionDividerStyle} />
          <div>
            <Text style={feedbackLabelStyle}>文字反馈</Text>
            <Text style={feedbackBodyStyle}>{result.feedback}</Text>
          </div>
        </>
      )}

      {hasTranscript && (
        <>
          <div style={sectionDividerStyle} />
          <Collapse
            bordered={false}
            items={[
              {
                key: 'transcript',
                label: (
                  <Text style={{ fontSize: 13, fontWeight: 400, color: '#8C8C8C' }}>
                    语音识别原文
                  </Text>
                ),
                children: <Text style={transcriptTextStyle}>{result.transcript}</Text>,
              },
            ]}
          />
        </>
      )}

      <div style={sectionDividerStyle} />

      <div style={buttonContainerStyle}>
        <Button type="primary" onClick={onRescore}>
          重新评分
        </Button>
      </div>
    </Card>
  );
}
