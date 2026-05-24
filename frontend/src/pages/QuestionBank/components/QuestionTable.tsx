import { Table, Checkbox, Typography } from 'antd';
import { useQuestionBankStore } from '../../../store/questionBankStore';
import type { Question } from '../../../types/question';
import TypeTag from './TypeTag';

const { Text, Paragraph } = Typography;

export default function QuestionTable() {
  const { questions, selectedIds, isSelected, toggleSelect } = useQuestionBankStore();

  function handleCheckboxClick(record: Question) {
    toggleSelect(record.id);
  }

  const columns = [
    {
      title: '',
      dataIndex: undefined,
      width: 48,
      render: (_: unknown, record: Question) => {
        return (
          <Checkbox
            checked={isSelected(record.id)}
            onChange={() => handleCheckboxClick(record)}
            aria-label={`选择${record.title}`}
          />
        );
      },
    },
    {
      title: '题目',
      dataIndex: 'title',
      ellipsis: false,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => <TypeTag type={type} />,
    },
    {
      title: '年份',
      dataIndex: 'year',
      width: 80,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={questions}
      rowKey="id"
      pagination={false}
      size="middle"
      showHeader={true}
      expandable={{
        expandedRowRender: (record: Question) => (
          <div style={{ padding: '8px 0 8px 48px' }}>
            <Text strong style={{ fontSize: 13, color: '#8C8C8C' }}>
              题目全文
            </Text>
            <Paragraph
              style={{ marginTop: 8, marginBottom: 8, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
            >
              {record.fullText}
            </Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.type === 'A' ? 'A类' : record.type === 'B' ? 'B类' : record.type === 'C' ? 'C类' : record.type} | {record.year} | 来源：{record.source}
            </Text>
          </div>
        ),
        rowExpandable: () => true,
      }}
    />
  );
}
