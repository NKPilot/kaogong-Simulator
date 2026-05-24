import type { ScoringDimension } from '../../../types/scoring';

interface DimensionRadarProps {
  dimensions: ScoringDimension[];
  size?: number;
}

const DIM_COLORS = [
  '#1890FF', '#52C41A', '#FA8C16', '#BE1E2D', '#722ED1', '#13C2C2',
];

function polarToCartesian(
  cx: number, cy: number, r: number, angleRad: number,
): { x: number; y: number } {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

export default function DimensionRadar({ dimensions, size = 280 }: DimensionRadarProps) {
  if (!dimensions || dimensions.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) - 50; // leave room for labels
  const levels = 5; // concentric rings
  const angleStep = (2 * Math.PI) / dimensions.length;
  const startAngle = -Math.PI / 2; // start from top

  // Build polygon points for data
  const dataPoints = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const r = (d.score / 10) * maxR;
    return polarToCartesian(cx, cy, r, angle);
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Generate level rings and axis lines
  const rings: { points: string }[] = [];
  for (let level = 1; level <= levels; level++) {
    const r = (level / levels) * maxR;
    const pts = dimensions.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const p = polarToCartesian(cx, cy, r, angle);
      return `${p.x},${p.y}`;
    });
    rings.push({ points: pts.join(' ') });
  }

  // Axis lines
  const axisLines = dimensions.map((_, i) => {
    const angle = startAngle + i * angleStep;
    const outer = polarToCartesian(cx, cy, maxR, angle);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // Label positions (slightly outside the outer ring)
  const labels = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = maxR + 24;
    const p = polarToCartesian(cx, cy, labelR, angle);
    // Adjust text-anchor based on position
    let textAnchor = 'middle';
    if (p.x < cx - 20) textAnchor = 'end';
    else if (p.x > cx + 20) textAnchor = 'start';
    return { ...p, text: d.name, score: d.score, textAnchor };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Level rings */}
        {rings.map((ring, i) => (
          <polygon
            key={`ring-${i}`}
            points={ring.points}
            fill="none"
            stroke={i === levels - 1 ? '#D9D9D9' : '#F0F0F0'}
            strokeWidth={i === levels - 1 ? 1.5 : 0.5}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke="#F0F0F0" strokeWidth={0.5}
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(190, 30, 45, 0.15)"
          stroke="#BE1E2D"
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y} r={4}
            fill={DIM_COLORS[i % DIM_COLORS.length]}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {labels.map((l, i) => (
          <g key={`label-${i}`}>
            <text
              x={l.x} y={l.y}
              textAnchor={l.textAnchor}
              dominantBaseline="middle"
              style={{ fontSize: 12, fill: '#262626', fontWeight: 500 }}
            >
              {l.text}
            </text>
            <text
              x={l.x} y={l.y + 16}
              textAnchor={l.textAnchor}
              dominantBaseline="middle"
              style={{ fontSize: 13, fill: DIM_COLORS[i % DIM_COLORS.length], fontWeight: 700 }}
            >
              {l.score}/10
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
