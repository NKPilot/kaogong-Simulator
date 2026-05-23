import { Button, Drawer, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuestionDrawerProps {
  questionText: string;
  questionTitle: string;
  visible: boolean;
  onToggle: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  triggerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 'auto',
    padding: '4px 8px',
  },
  dragHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    background: '#D9D9D9',
    margin: '0 auto 12px',
  },
  drawerContent: {
    padding: '0 16px 24px',
  },
  prefixLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#BE1E2D',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#262626',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#262626',
    whiteSpace: 'pre-wrap' as const,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#8C8C8C',
  },
};

export default function QuestionDrawer({
  questionText,
  questionTitle,
  visible,
  onToggle,
}: QuestionDrawerProps) {
  return (
    <>
      <Button
        type="text"
        icon={visible ? <DownOutlined /> : <UpOutlined />}
        onClick={onToggle}
        style={styles.triggerBtn}
        aria-expanded={visible}
      >
        {visible ? '收起题目' : '查看题目'}
      </Button>
      <Drawer
        placement="bottom"
        height="auto"
        open={visible}
        onClose={onToggle}
        closable={false}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      >
        <div style={styles.dragHandle} />
        <div style={styles.drawerContent}>
          <Text style={styles.prefixLabel}>题目：</Text>
          <div style={styles.title}>{questionTitle}</div>
          {questionText ? (
            <Text style={styles.questionText}>{questionText}</Text>
          ) : (
            <Text style={styles.fallbackText}>暂无题目文本</Text>
          )}
        </div>
      </Drawer>
    </>
  );
}
