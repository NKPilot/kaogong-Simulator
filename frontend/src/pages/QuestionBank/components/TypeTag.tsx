import { Tag } from 'antd';

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  A: { color: 'geekblue', label: 'A类' },
  B: { color: 'green', label: 'B类' },
  C: { color: 'orange', label: 'C类' },
  '结构化小组': { color: 'red', label: '结构化小组' },
};

interface TypeTagProps {
  type: string;
}

export default function TypeTag({ type }: TypeTagProps) {
  const config = TYPE_CONFIG[type] ?? { color: 'default', label: type };
  return <Tag color={config.color}>{config.label}</Tag>;
}
