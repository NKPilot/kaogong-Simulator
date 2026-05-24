import { Button, Alert, Badge, Tag, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuestionBankStore } from '../../../store/questionBankStore';

const { Text } = Typography;

export default function SelectionPanel() {
  const { selectedIds, questions, canProceed } = useQuestionBankStore();
  const navigate = useNavigate();

  const selectedCount = selectedIds.length;
  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));

  function getStatusText(): string {
    if (selectedCount === 0) return '请选择题日';
    return `已选择 ${selectedCount} 道题，可以开始面试`;
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: '20px 24px',
        background: 'var(--paper-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--divider)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge
            count={selectedCount}
            style={{
              backgroundColor: selectedCount >= 1 ? '#BE1E2D' : '#D9D3C8',
              color: selectedCount >= 1 ? '#FFF' : '#999',
              fontSize: 13,
              fontWeight: 600,
              minWidth: 22,
              height: 22,
              lineHeight: '22px',
            }}
          />
          <Text
            style={{
              fontSize: 14,
              color: selectedCount >= 1 ? 'var(--ink)' : 'var(--ink-muted)',
            }}
          >
            {getStatusText()}
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          disabled={!canProceed()}
          onClick={() => canProceed() && navigate('/exam-room')}
          style={{ minWidth: 140 }}
        >
          开始面试
        </Button>
      </div>

      {selectedCount === 0 && (
        <Alert
          message="请至少选择 1 道题"
          type="warning"
          showIcon
          style={{ marginTop: 12, marginBottom: 0 }}
        />
      )}

      {selectedQuestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Space size={[8, 8]} wrap>
            {selectedQuestions.map((q) => (
              <Tag
                key={q.id}
                closable
                onClose={() => useQuestionBankStore.getState().toggleSelect(q.id)}
                style={{
                  fontSize: 12,
                  padding: '2px 10px',
                  borderRadius: 4,
                  background: 'var(--vermillion-light)',
                  border: '1px solid var(--vermillion-glow)',
                  color: 'var(--vermillion)',
                }}
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
