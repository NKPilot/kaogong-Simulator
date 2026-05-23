import { Typography } from 'antd';

const { Title } = Typography;

const styles: Record<string, React.CSSProperties> = {
  banner: {
    background: '#BE1E2D',
    height: 64,
    width: '100%',
    position: 'relative',
    left: 0,
    right: 0,
    marginLeft: -32,
    marginRight: -32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    letterSpacing: 4,
  },
};

export default function RedBanner() {
  return (
    <div style={styles.banner}>
      <Title level={1} style={styles.text}>
        2025公务员模拟面试
      </Title>
    </div>
  );
}
