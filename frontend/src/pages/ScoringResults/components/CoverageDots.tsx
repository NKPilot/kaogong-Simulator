import { Typography } from 'antd';
import type { CoveragePoint } from '../../../types/scoring';

const { Text } = Typography;

const dotColors: Record<string, string> = {
  COVER: '#52C41A',
  PARTIAL: '#FA8C16',
  MISS: '#FF4D4F',
};

const labelText: Record<string, string> = {
  COVER: '已覆盖',
  PARTIAL: '部分覆盖',
  MISS: '未覆盖',
};

const containerStyle: React.CSSProperties = {
  marginTop: 12,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
};

function getDotStyle(color: string): React.CSSProperties {
  return {
    width: 12,
    height: 12,
    borderRadius: '50%',
    display: 'inline-block',
    backgroundColor: color,
    flexShrink: 0,
    transition: 'transform 200ms ease-out',
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  color: '#8C8C8C',
  marginRight: 4,
  flexShrink: 0,
};

const pointTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: '#262626',
};

interface CoverageDotsProps {
  coverage: CoveragePoint[];
}

export default function CoverageDots({ coverage }: CoverageDotsProps) {
  return (
    <div style={containerStyle}>
      {coverage.map((point) => (
        <div key={point.id} style={rowStyle}>
          <span style={getDotStyle(dotColors[point.verdict])} />
          <Text style={labelStyle}>{labelText[point.verdict]}</Text>
          <Text style={pointTextStyle}>{point.section} — {point.text}</Text>
        </div>
      ))}
    </div>
  );
}
