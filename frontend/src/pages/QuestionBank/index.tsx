import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Spin, Alert, Button, Space } from 'antd';
import { SoundOutlined, HistoryOutlined } from '@ant-design/icons';
import { useQuestionBankStore } from '../../store/questionBankStore';
import QuestionTable from './components/QuestionTable';
import SelectionPanel from './components/SelectionPanel';
import DeviceSettingsPanel from './components/DeviceSettingsPanel';

const { Title, Text } = Typography;

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const { questions, loading, error, loadQuestions } = useQuestionBankStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4, fontSize: 24, fontWeight: 600 }}>
            题库
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            请选择题日，支持逐题作答
          </Text>
        </div>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={() => navigate('/history')}>
            历史记录
          </Button>
          <Button icon={<SoundOutlined />} onClick={() => setSettingsOpen(true)}>
            设备设置
          </Button>
        </Space>
      </div>

      <DeviceSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
