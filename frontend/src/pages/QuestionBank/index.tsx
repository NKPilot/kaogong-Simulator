import { useEffect } from 'react';
import { Typography, Spin, Alert, Button } from 'antd';
import { useQuestionBankStore } from '../../store/questionBankStore';
import QuestionTable from './components/QuestionTable';
import SelectionPanel from './components/SelectionPanel';

const { Title, Text } = Typography;

export default function QuestionBankPage() {
  const { questions, loading, error, loadQuestions } = useQuestionBankStore();

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Loading state
  if (loading && questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: '#8C8C8C' }}>题目加载中...</p>
      </div>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => loadQuestions()}>
              刷新
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4, fontSize: 24, fontWeight: 600 }}>
          题库
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          请选择 3-4 道题组成本次模拟面试
        </Text>
      </div>

      {/* Empty state */}
      {questions.length === 0 ? (
        <Alert
          message="暂无可用题目"
          type="warning"
          showIcon
        />
      ) : (
        <>
          {/* Question table */}
          <QuestionTable />

          {/* Selection panel */}
          <SelectionPanel />
        </>
      )}
    </div>
  );
}
