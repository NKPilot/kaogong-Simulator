import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Spin, Alert, Button, Space, Input } from 'antd';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase();
    return questions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.fullText.toLowerCase().includes(q) ||
        String(item.year).includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q),
    );
  }, [questions, searchQuery]);

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
        {/* Top row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <Title
              level={2}
              style={{
                marginBottom: 6,
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
              }}
            >
              题库
            </Title>
            <Text
              style={{
                fontSize: 13,
                color: 'var(--ink-muted)',
                letterSpacing: '0.02em',
              }}
            >
              选择题日，逐题作答
            </Text>
          </div>
          <Space size={4}>
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => navigate('/history')}
              style={{
                color: 'var(--ink-secondary)',
                fontSize: 13,
                padding: '4px 12px',
                borderRadius: 999,
                height: 32,
              }}
            >
              历史记录
            </Button>
            <Button
              type="text"
              icon={<SoundOutlined />}
              onClick={() => setSettingsOpen(true)}
              style={{
                color: 'var(--ink-secondary)',
                fontSize: 13,
                padding: '4px 12px',
                borderRadius: 999,
                height: 32,
              }}
            >
              设备设置
            </Button>
          </Space>
        </div>

        {/* Search bar */}
        <Input.Search
          placeholder="搜索题目内容、年份、关键词..."
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={(value) => setSearchQuery(value)}
          style={{ maxWidth: 480 }}
          size="middle"
        />

        {/* Result count */}
        {searchQuery.trim() && (
          <Text
            type="secondary"
            style={{ fontSize: 12, marginTop: 8, display: 'block' }}
          >
            共找到 {filteredQuestions.length} 道题目
          </Text>
        )}
      </div>

      <DeviceSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Empty state for no questions at all */}
      {questions.length === 0 ? (
        <Alert message="暂无可用题目" type="warning" showIcon />
      ) : (
        <>
          <QuestionTable questions={filteredQuestions} />
          <SelectionPanel />
        </>
      )}
    </div>
  );
}
