import { useEffect, useState } from 'react';
import { Card, Typography, Collapse, Button, Tabs, Spin, Progress } from 'antd';
import {
  TrophyOutlined, StarOutlined, BookOutlined, BulbOutlined,
  WarningOutlined, RiseOutlined, AimOutlined,
} from '@ant-design/icons';
import type { ScoringResult, ModelAnswerResult } from '../../../types/scoring';
import { fetchModelAnswer } from '../../../api/scoringApi';
import CoverageDots from './CoverageDots';
import DimensionRadar from './DimensionRadar';

const { Title, Text, Paragraph } = Typography;

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

const scoreContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  marginTop: 16,
  marginBottom: 8,
};

const scoreCircleStyle: React.CSSProperties = {
  width: 80,
  height: 80,
};

const fractionStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 14,
  color: '#8C8C8C',
  marginTop: 4,
};

const sectionDividerStyle: React.CSSProperties = {
  borderTop: '1px solid #E8E8E8',
  margin: '16px 0',
};

const strengthsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
};

const transcriptTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#262626',
};

const modelAnswerStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.8,
  color: '#262626',
  whiteSpace: 'pre-wrap',
  background: '#FAFAFA',
  padding: 16,
  borderRadius: 8,
  border: '1px solid #F0F0F0',
};

function getGradeInfo(score: number): { grade: string; color: string; label: string } {
  if (score >= 90) return { grade: 'A+', color: '#52C41A', label: '优秀' };
  if (score >= 85) return { grade: 'A', color: '#52C41A', label: '优秀' };
  if (score >= 80) return { grade: 'B+', color: '#1890FF', label: '良好' };
  if (score >= 75) return { grade: 'B', color: '#1890FF', label: '良好' };
  if (score >= 70) return { grade: 'C+', color: '#FA8C16', label: '一般' };
  if (score >= 60) return { grade: 'C', color: '#FA8C16', label: '一般' };
  return { grade: 'D', color: '#FF4D4F', label: '需提升' };
}

export default function ScoringCard({
  result,
  animationDelay = 0,
  onRescore,
}: ScoringCardProps) {
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState('review');
  const [modelAnswer, setModelAnswer] = useState<ModelAnswerResult | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

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

  const animatedStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 300ms ease-out, transform 300ms ease-out`,
        transitionDelay: `${animationDelay}ms`,
      };

  const hasTranscript = result.transcript && result.transcript.length > 0;
  const overallScore = result.overallScore ?? 0;
  const coveragePct = result.totalCount
    ? Math.round(((result.coveredCount ?? 0) / result.totalCount) * 100)
    : 0;
  const grade = getGradeInfo(overallScore || coveragePct);

  const loadModelAnswer = async () => {
    if (modelAnswer || loadingModel) return;
    setLoadingModel(true);
    try {
      const data = await fetchModelAnswer(result.questionId);
      setModelAnswer(data);
    } catch {
      // silently fail — model answer is optional
    } finally {
      setLoadingModel(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'model') {
      loadModelAnswer();
    }
  };

  const tabItems = [
    {
      key: 'review',
      label: (
        <span><StarOutlined /> 评分详情</span>
      ),
      children: (
        <div>
          {/* Overall Score + Grade */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Progress
              type="circle"
              percent={overallScore || coveragePct}
              size={80}
              strokeColor={grade.color}
              format={(pct) => (
                <span style={{ fontSize: 20, fontWeight: 700, color: '#262626' }}>
                  {pct}
                </span>
              )}
            />
            <div style={{ marginTop: 8 }}>
              <Text style={{
                fontSize: 18, fontWeight: 600, color: grade.color,
                background: `${grade.color}12`, padding: '2px 12px', borderRadius: 4,
              }}>
                {grade.grade} · {grade.label}
              </Text>
            </div>
            <div style={fractionStyle}>
              采分点: {result.coveredCount ?? 0}/{result.totalCount ?? 0} 覆盖
            </div>
          </div>

          <div style={sectionDividerStyle} />

          {/* Multi-Dimensional Radar */}
          {result.dimensions && result.dimensions.length > 0 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>
                  <RiseOutlined style={{ marginRight: 6, color: '#722ED1' }} />
                  多维度评估
                </Text>
              </div>
              <DimensionRadar dimensions={result.dimensions} size={280} />
              {/* Dimension detail bars */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.dimensions.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, width: 64, textAlign: 'right', color: '#8C8C8C', flexShrink: 0 }}>
                      {d.name}
                    </Text>
                    <div style={{
                      flex: 1, height: 8, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(d.score / 10) * 100}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, #BE1E2D, #FA8C16, #52C41A)`,
                        backgroundSize: `300% 100%`,
                        backgroundPosition: `${(d.score / 10) * 100}% 0`,
                        borderRadius: 4,
                        transition: 'width 500ms ease-out',
                      }} />
                    </div>
                    <Text strong style={{ fontSize: 12, width: 24, color: '#262626' }}>{d.score}</Text>
                  </div>
                ))}
              </div>
              <div style={sectionDividerStyle} />
            </>
          )}

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>
                  <TrophyOutlined style={{ marginRight: 6, color: '#52C41A' }} />
                  优点
                </Text>
                <div style={strengthsContainerStyle}>
                  {result.strengths.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        flex: '1 1 100%',
                        background: '#F6FFED',
                        border: '1px solid #B7EB8F',
                        borderRadius: 6,
                        padding: '8px 12px',
                      }}
                    >
                      <Text strong style={{ fontSize: 13, color: '#389E0D' }}>{s.title}</Text>
                      <br />
                      <Text style={{ fontSize: 13, color: '#262626' }}>{s.description}</Text>
                    </div>
                  ))}
                </div>
              </div>
              <div style={sectionDividerStyle} />
            </>
          )}

          {/* Weaknesses */}
          {result.weaknesses && result.weaknesses.length > 0 && (
            <>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>
                  <WarningOutlined style={{ marginRight: 6, color: '#FA8C16' }} />
                  不足与改进建议
                </Text>
                <div style={strengthsContainerStyle}>
                  {result.weaknesses.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        flex: '1 1 100%',
                        background: '#FFF7E6',
                        border: '1px solid #FFD591',
                        borderRadius: 6,
                        padding: '8px 12px',
                      }}
                    >
                      <Text strong style={{ fontSize: 13, color: '#D46B08' }}>{w.title}</Text>
                      <br />
                      <Text style={{ fontSize: 13, color: '#262626', lineHeight: 1.6 }}>{w.description}</Text>
                      {w.example && (
                        <div style={{
                          background: '#FFF', border: '1px solid #FFD591',
                          borderRadius: 4, padding: '6px 10px', marginTop: 8,
                        }}>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                            示范:
                          </Text>
                          <Text style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, fontStyle: 'italic' }}>
                            {w.example}
                          </Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div style={sectionDividerStyle} />
            </>
          )}

          {/* Per-point Coverage */}
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
            <AimOutlined style={{ marginRight: 6, color: '#1890FF' }} />
            采分点分析
          </Text>
          <CoverageDots coverage={result.coverage || []} />

          {/* Overall Feedback */}
          {result.feedback && (
            <>
              <div style={sectionDividerStyle} />
              <div>
                <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                  综合评价
                </Text>
                <Text style={{ fontSize: 14, lineHeight: 1.6, color: '#262626' }}>
                  {result.feedback}
                </Text>
              </div>
            </>
          )}

          {/* Transcript */}
          {hasTranscript && (
            <>
              <div style={sectionDividerStyle} />
              <Collapse
                bordered={false}
                items={[{
                  key: 'transcript',
                  label: (
                    <Text style={{ fontSize: 13, fontWeight: 400, color: '#8C8C8C' }}>
                      语音识别原文
                    </Text>
                  ),
                  children: <Text style={transcriptTextStyle}>{result.transcript}</Text>,
                }]}
              />
            </>
          )}

          <div style={sectionDividerStyle} />
          <Button type="primary" onClick={onRescore}>重新评分</Button>
        </div>
      ),
    },
    {
      key: 'model',
      label: (
        <span><BookOutlined /> 参考回答</span>
      ),
      children: (
        <div>
          {loadingModel ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin tip="正在生成参考回答..." />
            </div>
          ) : modelAnswer?.modelAnswer ? (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                以下是由 AI 生成的参考回答，涵盖所有采分点，可作为答题参考。
              </Text>
              <div style={modelAnswerStyle}>
                <Paragraph>{modelAnswer.modelAnswer}</Paragraph>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#8C8C8C' }}>
              参考回答生成失败，请稍后重试
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card style={{ ...cardStyle, ...animatedStyle }} bodyStyle={cardBodyStyle}>
      <Title level={4} style={{ margin: 0 }}>
        {result.questionTitle}
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginTop: 8 }}
      />
    </Card>
  );
}
