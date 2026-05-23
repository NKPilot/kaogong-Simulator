import { Button, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface MicPermissionErrorProps {
  visible: boolean;
  onRetry: () => void;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
};

const iconStyle: React.CSSProperties = {
  fontSize: 24,
  color: '#FA8C16',
};

const textStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#262626',
  textAlign: 'center',
};

export default function MicPermissionError({ visible, onRetry }: MicPermissionErrorProps) {
  if (!visible) return null;

  return (
    <div style={containerStyle}>
      <WarningOutlined style={iconStyle} />
      <Text style={textStyle}>麦克风权限被拒，请开启麦克风权限后重试</Text>
      <Button type="primary" onClick={onRetry}>
        重试
      </Button>
    </div>
  );
}
