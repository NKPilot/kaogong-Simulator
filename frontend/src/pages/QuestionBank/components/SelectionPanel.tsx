import { Button, Alert, Badge, Tag, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuestionBankStore } from '../../../store/questionBankStore';

const { Text } = Typography;

export default function SelectionPanel() {
  const { selectedIds, questions, canProceed } = useQuestionBankStore();
  const navigate = useNavigate();

  const selectedCount = selectedIds.length;
  const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));

  function getStatusText(): string {
    if (selectedCount === 0) return '请至少选择 3 道题';
    if (selectedCount < 3) return `已选择 ${selectedCount}/4 题`;
    if (selectedCount === 3) return '已选择 3/4 题，可以开始面试';
    return '已选择 4/4 题';
  }

  function getAlertType(): 'warning' | 'success' | 'info' {
    if (selectedCount < 3) return 'warning';
    return 'success';
  }

  function handleStartInterview() {
    if (canProceed()) {
      navigate('/exam-room');
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        background: '#FFFFFF',
        borderRadius: 6,
        border: '1px solid #E8E8E8',
      }}
    >
      {/* Selection count + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge
            count={selectedCount}
            style={{
              backgroundColor: selectedCount >= 3 ? '#BE1E2D' : '#D9D9D9',
              color: selectedCount >= 3 ? '#FFFFFF' : '#8C8C8C',
              fontSize: 14,
              fontWeight: 600,
            }}
            overflowCount={4}
          />
          <Text
            style={{
              fontSize: 14,
              color: selectedCount >= 3 ? '#262626' : '#8C8C8C',
            }}
          >
            {getStatusText()}
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          disabled={!canProceed()}
          onClick={handleStartInterview}
          style={{ minWidth: 140 }}
        >
          开始面试
        </Button>
      </div>

      {/* Alert for < 3 selection */}
      {selectedCount < 3 && selectedCount > 0 && (
        <Alert
          message="请至少选择 3 道题"
          type="warning"
          showIcon
          style={{ marginBottom: 0 }}
        />
      )}

      {/* Selected question chips */}
      {selectedQuestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Space size={[8, 8]} wrap>
            {selectedQuestions.map(q => (
              <Tag
                key={q.id}
                closable
                onClose={() => useQuestionBankStore.getState().toggleSelect(q.id)}
                style={{ fontSize: 13, padding: '2px 8px' }}
              >
                {q.title}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
}
