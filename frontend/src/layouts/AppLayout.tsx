import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Title
          level={2}
          style={{
            color: '#FFFFFF',
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          江苏公务员面试模拟器
        </Title>
      </Header>
      <Content style={{ padding: '32px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
