import { Typography } from 'antd';
import {
  CheckCircleFilled, MinusCircleFilled, CloseCircleFilled,
} from '@ant-design/icons';
import type { CoveragePoint } from '../../../types/scoring';

const { Text } = Typography;

const dotConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  COVER: { color: '#52C41A', label: '已覆盖', icon: <CheckCircleFilled style={{ color: '#52C41A' }} /> },
  PARTIAL: { color: '#FA8C16', label: '部分覆盖', icon: <MinusCircleFilled style={{ color: '#FA8C16' }} /> },
  MISS: { color: '#FF4D4F', label: '未覆盖', icon: <CloseCircleFilled style={{ color: '#FF4D4F' }} /> },
};

function getVerdictBadge(verdict: string) {
  const cfg = dotConfig[verdict] || dotConfig.MISS;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 500, color: cfg.color,
      background: `${cfg.color}15`, padding: '1px 8px', borderRadius: 4,
      flexShrink: 0,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const containerStyle: React.CSSProperties = {
  marginTop: 12,
};

const pointRowStyle: React.CSSProperties = {
  marginBottom: 16,
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  marginBottom: 4,
};

const pointTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: '#262626',
  lineHeight: 1.5,
  flex: 1,
};

const reasoningStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#8C8C8C',
  lineHeight: 1.5,
  marginLeft: 4,
  marginTop: 4,
  paddingLeft: 8,
  borderLeft: '2px solid #E8E8E8',
};

const suggestionStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#BE1E2D',
  lineHeight: 1.5,
  background: '#FFF2F0',
  padding: '8px 12px',
  borderRadius: 6,
  marginTop: 8,
};

interface CoverageDotsProps {
  coverage: CoveragePoint[];
}

export default function CoverageDots({ coverage }: CoverageDotsProps) {
  return (
    <div style={containerStyle}>
      {coverage.map((point) => {
        const cfg = dotConfig[point.verdict] || dotConfig.MISS;
        return (
          <div key={point.id} style={pointRowStyle}>
            <div style={headerRowStyle}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: cfg.color, flexShrink: 0, marginTop: 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#fff', fontWeight: 700,
              }}>
                {point.id}
              </span>
              {getVerdictBadge(point.verdict)}
              <Text style={pointTextStyle}>{point.text}</Text>
            </div>

            {point.reasoning && (
              <div style={reasoningStyle}>
                {point.evidence && (
                  <Text style={{ fontSize: 12, color: '#BFBFBF', display: 'block', marginBottom: 2 }}>
                    原文: "{point.evidence}"
                  </Text>
                )}
                <Text>{point.reasoning}</Text>
              </div>
            )}

            {point.suggestion && point.verdict !== 'COVER' && (
              <div style={suggestionStyle}>
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#BE1E2D' }}>示范: </Text>
                <Text>{point.suggestion}</Text>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
