const TYPE_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  A: { bg: 'var(--type-a-bg)', text: 'var(--type-a-text)', border: 'var(--type-a-border)', label: 'A类' },
  B: { bg: 'var(--type-b-bg)', text: 'var(--type-b-text)', border: 'var(--type-b-border)', label: 'B类' },
  C: { bg: 'var(--type-c-bg)', text: 'var(--type-c-text)', border: 'var(--type-c-border)', label: 'C类' },
  '结构化小组': { bg: 'var(--type-struct-bg)', text: 'var(--type-struct-text)', border: 'var(--type-struct-border)', label: '结构化小组' },
};

interface TypeTagProps {
  type: string;
}

export default function TypeTag({ type }: TypeTagProps) {
  const config = TYPE_CONFIG[type] ?? { bg: '#F5F5F5', text: '#666', border: '#E8E8E8', label: type };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 12px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 999,
        lineHeight: '20px',
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
