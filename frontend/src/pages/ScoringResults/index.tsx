import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Result, Typography } from 'antd';
import { useScoringStore } from '../../store/scoringStore';
import { useInterviewStore } from '../../store/interviewStore';
import { useQuestionBankStore } from '../../store/questionBankStore';
import ScoringCard from './components/ScoringCard';
import PendingCard from './components/PendingCard';
import ErrorCard from './components/ErrorCard';

const { Text, Title } = Typography;

export default function ScoringResultsPage() {
  const navigate = useNavigate();

  // Zustand stores
  const scoringStore = useScoringStore();
  const interviewStore = useInterviewStore();
  const questionBankStore = useQuestionBankStore();

  // Derived data
  const { sessionId } = interviewStore;
  const { selectedIds, questions } = questionBankStore;
  const { results, isPolling, pollTimeout, startPolling, stopPolling, triggerScoring, rescoreCard } =
    scoringStore;

  const questionCount = selectedIds.length;

  // Build questionTitleMap: question.id -> question.title
  const questionTitleMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      map[q.id] = q.title;
    }
    return map;
  }, [questions]);

  // Polling on mount
  useEffect(() => {
    if (sessionId) {
      startPolling(sessionId, questionCount);
    }
    return () => {
      stopPolling();
    };
    // Only run on mount/unmount — questionCount and sessionId are stable after interview starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build card configs
  const cardConfigs = selectedIds.map((qid, index) => {
    const result = results.find((r) => r.questionIndex === index);
    const title = questionTitleMap[qid] || `第 ${index + 1} 题`;
    return { index, questionId: qid, title, result };
  });

  // Handler functions
  const handleRescore = (questionIndex: number, questionId: string) => {
    rescoreCard(sessionId, questionIndex, questionId);
  };

  const handleRetry = (questionIndex: number, questionId: string) => {
    rescoreCard(sessionId, questionIndex, questionId);
  };

  const handleTriggerScoring = (
    questionIndex: number,
    questionId: string,
    questionTitle: string,
  ) => {
    triggerScoring(sessionId, questionIndex, questionId, questionTitle);
  };

  // Case A — Empty state: no interview session AND no results
  const isEmpty = !sessionId && results.length === 0;

  if (isEmpty) {
    return (
      <Result
        status="info"
        title="暂无评分数据"
        subTitle="请先完成一次模拟面试"
        extra={
          <Button onClick={() => navigate('/')}>返回题库</Button>
        }
      />
    );
  }

  // Case B — Card waterfall
  return (
    <div>
      {/* Poll timeout warning banner */}
      {pollTimeout && (
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Text type="warning">
            评分轮询超时，部分结果可能未就绪。请稍后
          </Text>
          <Typography.Link
            onClick={() => window.location.reload()}
            style={{ marginLeft: 4 }}
          >
            刷新
          </Typography.Link>
        </div>
      )}

      {/* Card waterfall */}
      {cardConfigs.map(({ index, questionId, title, result }, arrayIndex) => {
        const animationDelay = arrayIndex * 100;

        if (result === undefined) {
          // Not triggered yet
          return (
            <Card
              key={`not-started-${index}`}
              style={{ marginBottom: 24, width: '100%', opacity: 1 }}
              bodyStyle={{ padding: 24 }}
            >
              <Title level={4} style={{ margin: 0 }}>
                {title}
              </Title>
              <Text style={{ fontSize: 14, color: '#8C8C8C', display: 'block', marginTop: 12 }}>
                等待评分...
              </Text>
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 12 }}
                onClick={() => handleTriggerScoring(index, questionId, title)}
              >
                手动评分
              </Button>
            </Card>
          );
        }

        switch (result.status) {
          case 'scored':
            return (
              <ScoringCard
                key={`scored-${index}`}
                result={result}
                animationDelay={animationDelay}
                onRescore={() => handleRescore(index, questionId)}
              />
            );
          case 'pending':
            return (
              <PendingCard
                key={`pending-${index}`}
                questionTitle={title}
                animationDelay={animationDelay}
              />
            );
          case 'failed':
            return (
              <ErrorCard
                key={`failed-${index}`}
                questionTitle={title}
                errorMessage={result.error}
                animationDelay={animationDelay}
                onRetry={() => handleRetry(index, questionId)}
              />
            );
          case 'not_started':
            return (
              <Card
                key={`not-started-${index}`}
                style={{ marginBottom: 24, width: '100%', opacity: 1 }}
                bodyStyle={{ padding: 24 }}
              >
                <Title level={4} style={{ margin: 0 }}>
                  {title}
                </Title>
                <Text style={{ fontSize: 14, color: '#8C8C8C', display: 'block', marginTop: 12 }}>
                  等待评分...
                </Text>
                <Button
                  type="primary"
                  size="small"
                  style={{ marginTop: 12 }}
                  onClick={() => handleTriggerScoring(index, questionId, title)}
                >
                  手动评分
                </Button>
              </Card>
            );
          default:
            return null;
        }
      })}

      {/* "返回题库" button at page bottom */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <Button
          type="default"
          style={{ borderColor: '#BE1E2D', color: '#BE1E2D' }}
          onClick={() => navigate('/')}
        >
          返回题库
        </Button>
      </div>
    </div>
  );
}
