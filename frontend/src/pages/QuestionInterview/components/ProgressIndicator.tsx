import { Steps, Typography } from 'antd';

const { Text } = Typography;

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const progressTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#8C8C8C',
  marginTop: 4,
};

export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  if (total === 0) return null;

  const items = Array.from({ length: total }, (_, i) => {
    let status: 'wait' | 'process' | 'finish';
    if (i < current) {
      status = 'finish';
    } else if (i === current) {
      status = 'process';
    } else {
      status = 'wait';
    }
    return { status };
  });

  return (
    <div style={containerStyle}>
      <Steps
        type="default"
        size="small"
        direction="horizontal"
        current={current}
        items={items}
      />
      <Text style={progressTextStyle}>
        第 {current + 1}/{total} 题
      </Text>
    </div>
  );
}
