import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';

const { Header, Content } = Layout;

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
          background: '#BE1E2D',
          height: 48,
          padding: '0 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <span
          style={{
            color: '#FFF',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          江苏公务员面试模拟器
        </span>
      </Header>
      <Content
        style={{
          padding: '40px 32px',
          maxWidth: 960,
          margin: '0 auto',
          width: '100%',
          background: '#F3EFE8',
          flex: 1,
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
}
