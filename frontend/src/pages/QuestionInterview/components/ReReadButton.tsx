import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ReReadButtonProps {
  visible: boolean;
  used: boolean;
  onReRead: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  disabledButton: {
    color: '#8C8C8C',
    borderColor: '#D9D9D9',
  },
};

export default function ReReadButton({ visible, used, onReRead }: ReReadButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <div style={styles.container}>
      <Button
        type="default"
        size="middle"
        icon={<ReloadOutlined />}
        disabled={used}
        onClick={used ? undefined : onReRead}
        style={used ? styles.disabledButton : undefined}
        aria-label="请求重新朗读本题"
      >
        {used ? '已请求重读' : '请求重读题目 (剩余 1 次)'}
      </Button>
    </div>
  );
}
