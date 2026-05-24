import { useState } from 'react';
import { Checkbox, Typography, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useQuestionBankStore } from '../../../store/questionBankStore';
import type { Question } from '../../../types/question';
import TypeTag from './TypeTag';

const { Text, Paragraph } = Typography;

interface Props {
  questions: Question[];
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = { A: 'A类', B: 'B类', C: 'C类', '结构化小组': '结构化小组' };
  return map[type] ?? type;
}

function getTypeAccent(type: string): string {
  const map: Record<string, string> = {
    A: '#1677FF',
    B: '#389E0D',
    C: '#D46B08',
    '结构化小组': '#CF1322',
  };
  return map[type] ?? '#BE1E2D';
}

function getSelectedBg(_type: string): string {
  return 'rgba(82, 196, 26, 0.06)';
}

function parseTitle(title: string): { datePart: string; sourcePart: string; questionPart: string } {
  const dateMatch = title.match(/^(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)/);
  const datePart = dateMatch ? dateMatch[1].trim() : '';

  const afterDate = dateMatch ? title.substring(dateMatch[0].length) : title;
  const sepIndex = afterDate.indexOf(' · ');
  const rawSource = sepIndex > -1 ? afterDate.substring(0, sepIndex).trim() : afterDate.trim();
  const questionPart = sepIndex > -1 ? afterDate.substring(sepIndex + 3).trim() : '';

  // Strip type suffix like "(A 类)" or "(B 类)" from source
  const sourcePart = rawSource.replace(/\([ABC]\s*类\)/, '').trim();

  return { datePart, sourcePart, questionPart };
}

export default function QuestionTable({ questions }: Props) {
  const { isSelected, toggleSelect } = useQuestionBankStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (questions.length === 0) {
    return (
      <div
        style={{
          background: 'var(--paper-card)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--divider)',
          padding: 48,
          textAlign: 'center',
        }}
      >
        <Text type="secondary">未找到匹配的题目</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--paper-card)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--divider)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid #D9D3C8',
          background: '#FAFAF8',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink-muted)',
        }}
      >
        <div style={{ width: 48, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>题目</div>
        <div style={{ width: 100, flexShrink: 0, textAlign: 'center' }}>类型</div>
        <div style={{ width: 72, flexShrink: 0, textAlign: 'right', paddingRight: 8 }}>年份</div>
        <div style={{ width: 40, flexShrink: 0 }} />
      </div>

      {/* Data rows */}
      {questions.map((question) => {
        const isRowHovered = hoveredId === question.id;
        const isRowSelected = isSelected(question.id);
        const isExpanded = expandedIds.has(question.id);
        const parsed = parseTitle(question.title);
        const primaryText = parsed.sourcePart || question.title;
        const secondaryText = [parsed.datePart, parsed.questionPart].filter(Boolean).join(' · ');

        const accent = getTypeAccent(question.type);

        return (
          <div key={question.id}>
            {/* Data row */}
            <div
              className="qb-row"
              onMouseEnter={() => setHoveredId(question.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid #D9D3C8',
                borderLeft: `4px solid ${accent}`,
                backgroundColor: isRowSelected
                  ? getSelectedBg(question.type)
                  : isRowHovered
                    ? 'var(--row-hover-bg)'
                    : 'transparent',
                cursor: 'pointer',
                minHeight: 56,
              }}
              onClick={() => toggleSelect(question.id)}
            >
              {/* Checkbox — always visible */}
              <div
                style={{
                  width: 48,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Checkbox
                  checked={isRowSelected}
                  onChange={() => toggleSelect(question.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`选择${question.title}`}
                />
              </div>

              {/* Question column */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                  minWidth: 0,
                  paddingRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {primaryText}
                </Text>
                {secondaryText && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-muted)',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {secondaryText}
                  </Text>
                )}
              </div>

              {/* Type column */}
              <div
                style={{
                  width: 100,
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <TypeTag type={question.type} />
              </div>

              {/* Year column */}
              <div
                style={{
                  width: 72,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontSize: 13,
                  color: 'var(--ink-muted)',
                  fontWeight: 400,
                  paddingRight: 8,
                }}
              >
                {question.year}
              </div>

              {/* Expand chevron */}
              <div
                style={{
                  width: 40,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={
                    <RightOutlined
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: 12,
                        color: 'var(--ink-muted)',
                      }}
                    />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(question.id);
                  }}
                  style={{ width: 28, height: 28, padding: 0 }}
                />
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div
                style={{
                  padding: '12px 24px 16px 64px',
                  background: 'var(--paper-hover)',
                  borderBottom: '1px solid #D9D3C8',
                }}
              >
                <div
                  style={{
                    background: 'var(--paper-card)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--divider)',
                    padding: '16px 20px',
                  }}
                >
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: 'block', marginBottom: 8 }}
                  >
                    题目全文
                  </Text>
                  <Paragraph
                    style={{
                      fontSize: 14,
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      marginBottom: question.scorePoints ? 16 : 0,
                      color: 'var(--ink)',
                    }}
                  >
                    {question.fullText}
                  </Paragraph>
                  {question.scorePoints && (
                    <>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                      >
                        评分要点
                      </Text>
                      <Text style={{ fontSize: 13, color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap' }}>
                        {question.scorePoints}
                      </Text>
                    </>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getTypeLabel(question.type)} | {question.year} | 来源：{question.source}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
