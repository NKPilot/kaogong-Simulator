import { Typography } from 'antd';

const { Title, Text } = Typography;

export default function ExamRoomPage() {
  return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <Title level={3}>面试考场</Title>
      <Text type="secondary" style={{ fontSize: 16 }}>
        面试考场 (即将开放)
      </Text>
    </div>
  );
}
