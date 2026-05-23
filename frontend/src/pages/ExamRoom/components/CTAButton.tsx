import { Button } from 'antd';

interface CTAButtonProps {
  onClick: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 32,
  },
};

export default function CTAButton({ onClick }: CTAButtonProps) {
  return (
    <div style={styles.wrapper}>
      <Button type="primary" size="large" onClick={onClick} style={{ minWidth: 200 }}>
        开始答题
      </Button>
    </div>
  );
}
