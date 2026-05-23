import { useState } from 'react';
import { Button, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface GuidanceToggleProps {
  paragraphs: string[];
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: 720,
    margin: '0 auto',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 0',
    height: 'auto',
    marginBottom: 8,
  },
  panel: {
    background: '#FFFFFF',
    borderRadius: 6,
    padding: 16,
    overflow: 'hidden',
    transition: 'max-height 300ms ease',
  },
  paragraph: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#262626',
    marginBottom: 8,
  },
  lastParagraph: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: '#262626',
    marginBottom: 0,
  },
};

export default function GuidanceToggle({ paragraphs }: GuidanceToggleProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <div style={styles.wrapper}>
      <Button
        type="text"
        icon={expanded ? <UpOutlined /> : <DownOutlined />}
        onClick={handleToggle}
        style={styles.toggleBtn}
      >
        {expanded ? '收起引导语文字' : '查看引导语文字'}
      </Button>
      <div
        style={{
          ...styles.panel,
          maxHeight: expanded ? 500 : 0,
        }}
      >
        {paragraphs.map((para, idx) => (
          <Text
            key={idx}
            style={idx === paragraphs.length - 1 ? styles.lastParagraph : styles.paragraph}
          >
            {para}
          </Text>
        ))}
      </div>
    </div>
  );
}
