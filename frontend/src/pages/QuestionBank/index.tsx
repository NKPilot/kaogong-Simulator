import { useEffect } from 'react';
import { Typography, Spin, Alert } from 'antd';
import { useQuestionBankStore } from '../../store/questionBankStore';

const { Title, Text } = Typography;

export default function QuestionBankPage() {
  const { questions, loading, error, loadQuestions } = useQuestionBankStore();

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>题目加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        action={
          <a onClick={() => loadQuestions()}>刷新</a>
        }
      />
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>题库</Title>
      <Text type="secondary" style={{ fontSize: 14, marginBottom: 24, display: 'block' }}>
        请选择 3-4 道题组成本次模拟面试
      </Text>
      {questions.length === 0 ? (
        <Alert message="暂无可用题目" type="warning" />
      ) : (
        <p>已加载 {questions.length} 道题目</p>
      )}
    </div>
  );
}
