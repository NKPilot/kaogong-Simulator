import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, List, Card, Tag, Button, Spin, Alert, Empty, Collapse,
  Checkbox, Space, Popconfirm, message,
} from 'antd';
import {
  HistoryOutlined, CaretRightOutlined, SoundOutlined,
  DeleteOutlined, RedoOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useQuestionBankStore } from '../../store/questionBankStore';
import CoverageDots from '../ScoringResults/components/CoverageDots';
import type { CoveragePoint } from '../../types/scoring';

const { Title, Text } = Typography;
const API_BASE = 'http://localhost:8000';

interface SessionItem {
  session_id: string;
  created_at: string;
  question_count: number;
  scored_count: number;
  total_covered: number;
  total_points: number;
  question_ids: string[];
  results: Array<{
    question_index: number;
    question_id: string;
    question_title?: string;
    status: string;
    transcript?: string;
    feedback?: string;
    coveredCount?: number;
    totalCount?: number;
    coverage?: CoveragePoint[];
    error?: string;
  }>;
  recordings: string[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { questions, loadQuestions } = useQuestionBankStore();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [rescoring, setRescoring] = useState<Set<string>>(new Set());
  const [modelAnswers, setModelAnswers] = useState<Record<string, string>>({});
  const [loadingModel, setLoadingModel] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function fetchHistory() {
    setLoading(true);
    fetch(`${API_BASE}/api/history`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setSessions(d.sessions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchHistory(); loadQuestions(); }, []);

  function playRecording(sessionId: string, filename: string) {
    const key = `${sessionId}/${filename}`;
    if (playing === key) { audioRef.current?.pause(); setPlaying(null); return; }
    audioRef.current?.pause();
    const a = new Audio(`${API_BASE}/api/history/${sessionId}/recording/${filename}`);
    a.onended = () => setPlaying(null);
    a.play().catch(() => {});
    audioRef.current = a;
    setPlaying(key);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sessions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sessions.map((s) => s.session_id)));
    }
  }

  async function deleteSelected() {
    setDeleting(true);
    try {
      const ids = Array.from(selected);
      const resp = await fetch(`${API_BASE}/api/history/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setSelected(new Set());
      fetchHistory();
      message.success(`已删除 ${ids.length} 条记录`);
    } catch (e: any) {
      message.error(e.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  }

  async function deleteSingle(sessionId: string) {
    try {
      const resp = await fetch(`${API_BASE}/api/history/${sessionId}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      fetchHistory();
      message.success('已删除');
    } catch (e: any) {
      message.error(e.message || '删除失败');
    }
  }

  function rescoreQuestion(sessionId: string, questionIndex: number, questionId: string) {
    const key = `${sessionId}:${questionIndex}`;
    setRescoring((prev) => new Set(prev).add(key));
    fetch(`${API_BASE}/api/scoring/rescore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, question_index: questionIndex, question_id: questionId }),
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(() => {
        message.success('已触发重新评分，请稍后查看');
        // Poll for updated results after a delay
        setTimeout(() => fetchHistory(), 8000);
      })
      .catch((e) => message.error(e.message || '重新评分失败'))
      .finally(() => {
        setRescoring((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      });
  }

  function fetchModelAnswerForQuestion(questionId: string) {
    if (modelAnswers[questionId] || loadingModel.has(questionId)) return;
    setLoadingModel((prev) => new Set(prev).add(questionId));
    fetch(`${API_BASE}/api/scoring/model-answer/${encodeURIComponent(questionId)}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        if (d.modelAnswer) {
          setModelAnswers((prev) => ({ ...prev, [questionId]: d.modelAnswer }));
        }
      })
      .catch(() => message.error('获取参考答案失败'))
      .finally(() => {
        setLoadingModel((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
      });
  }

  function redoSession(session: SessionItem) {
    const store = useQuestionBankStore.getState();
    store.resetSelection();
    for (const qid of session.question_ids) {
      if (qid) store.toggleSelect(qid);
    }
    navigate('/exam-room');
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }
  if (error) {
    return <div style={{ padding: 40 }}><Alert message="加载失败" description={error} type="error" showIcon /></div>;
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <style>{`
        .history-checkbox .ant-checkbox-inner {
          border-color: #BFBFBF !important;
          border-width: 2px;
        }
        .history-checkbox:hover .ant-checkbox-inner {
          border-color: #BE1E2D !important;
        }
      `}</style>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}><HistoryOutlined style={{ marginRight: 8 }} />历史记录</Title>
        <Space>
          {sessions.length > 0 && (
            <>
              <Button size="small" onClick={toggleSelectAll}>
                {selected.size === sessions.length ? '取消全选' : '全选'}
              </Button>
              {selected.size > 0 && (
                <Popconfirm
                  title={`确定删除选中的 ${selected.size} 条记录？`}
                  onConfirm={deleteSelected}
                  okText="删除" cancelText="取消"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} loading={deleting}>
                    删除选中 ({selected.size})
                  </Button>
                </Popconfirm>
              )}
            </>
          )}
          <Button onClick={() => navigate('/')}>返回题库</Button>
        </Space>
      </div>

      {sessions.length === 0 ? (
        <Empty description="暂无历史记录" />
      ) : (
        <List
          dataSource={sessions}
          renderItem={(session) => {
            const avgScore = session.total_points > 0
              ? Math.round((session.total_covered / session.total_points) * 100) : 0;
            // Build question title map from store
            const titleMap: Record<string, string> = {};
            for (const q of questions) { titleMap[q.id] = q.title; }
            const questionTitles = session.question_ids
              .map((id) => titleMap[id] || id)
              .filter(Boolean);
            return (
              <Card
                size="small"
                style={{
                  marginBottom: 12,
                  border: '1px solid #D9D9D9',
                  borderRadius: 8,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  opacity: selected.has(session.session_id) ? 0.6 : 1,
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Space>
                        <Checkbox
                          checked={selected.has(session.session_id)}
                          onChange={() => toggleSelect(session.session_id)}
                          className="history-checkbox"
                        />
                        <Text strong>{formatDate(session.created_at)}</Text>
                      </Space>
                      {questionTitles.length > 0 && (
                        <div style={{ marginTop: 4, marginLeft: 28 }}>
                          {questionTitles.map((t, i) => (
                            <Tag key={i} style={{ marginBottom: 2, fontSize: 12 }}>{t}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                    <Space>
                      <Tag color={session.scored_count === session.question_count ? 'green' : 'orange'}>
                        {session.scored_count}/{session.question_count} 已评分
                      </Tag>
                    </Space>
                  </div>
                }
              >
                {session.total_points > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">采分点命中率：</Text>
                    <Text strong style={{ color: '#BE1E2D', fontSize: 16 }}>
                      {session.total_covered}/{session.total_points}（{avgScore}%）
                    </Text>
                  </div>
                )}

                <div style={{ marginBottom: 8 }}>
                  <SoundOutlined style={{ marginRight: 4 }} />
                  <Text type="secondary">录音回放：</Text>
                  {session.recordings.map((rec) => {
                    const key = `${session.session_id}/${rec}`;
                    const isPlaying = playing === key;
                    return (
                      <Button
                        key={rec} size="small"
                        type={isPlaying ? 'primary' : 'default'}
                        icon={isPlaying ? <CaretRightOutlined /> : <SoundOutlined />}
                        onClick={() => playRecording(session.session_id, rec)}
                        style={{ marginLeft: 8, marginBottom: 4 }}
                      >
                        {rec.replace('.webm', '')} {isPlaying ? '播放中' : ''}
                      </Button>
                    );
                  })}
                </div>

                <Space style={{ marginBottom: 8 }}>
                  <Button
                    size="small" icon={<RedoOutlined />}
                    onClick={() => redoSession(session)}
                  >
                    再做一遍
                  </Button>
                  {session.scored_count > 0 && (
                    <Popconfirm
                      title="确定重新评分所有已评分题目？"
                      onConfirm={() => {
                        session.results.forEach((r) => {
                          if (r.status === 'scored' && r.question_id) {
                            rescoreQuestion(session.session_id, r.question_index, r.question_id);
                          }
                        });
                      }}
                      okText="确定" cancelText="取消"
                    >
                      <Button size="small" icon={<ReloadOutlined />}>
                        重新评分
                      </Button>
                    </Popconfirm>
                  )}
                  <Popconfirm
                    title="确定删除此记录？" onConfirm={() => deleteSingle(session.session_id)}
                    okText="删除" cancelText="取消"
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </Space>

                {session.results.length > 0 && (
                  <Collapse size="small" ghost items={[{
                    key: 'scores',
                    label: <Text type="secondary">查看评分详情</Text>,
                    children: session.results.map((r) => (
                      <div key={r.question_index} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{r.question_index + 1}. {titleMap[r.question_id] || `第${r.question_index + 1}题`}</Text>
                          <Space>
                            {r.status === 'scored' ? (
                              <>
                                {((r as any).overallScore ?? 0) > 0 && (
                                  <Tag color="blue">{(r as any).overallScore}分</Tag>
                                )}
                                <Tag color="green">{r.coveredCount}/{r.totalCount} 覆盖</Tag>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<ReloadOutlined />}
                                  loading={rescoring.has(`${session.session_id}:${r.question_index}`)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rescoreQuestion(session.session_id, r.question_index, r.question_id);
                                  }}
                                  style={{ fontSize: 12, color: '#BE1E2D', padding: '0 4px' }}
                                >
                                  重评
                                </Button>
                              </>
                            ) : r.status === 'failed' ? (
                              <>
                                <Tag color="red">评分失败</Tag>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<ReloadOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rescoreQuestion(session.session_id, r.question_index, r.question_id);
                                  }}
                                  style={{ fontSize: 12, color: '#BE1E2D', padding: '0 4px' }}
                                >
                                  重试
                                </Button>
                              </>
                            ) : (
                              <Tag>评分中</Tag>
                            )}
                          </Space>
                        </div>
                        {(r as any).strengths && (r as any).strengths.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {(r as any).strengths.map((s: any, si: number) => (
                              <div key={si} style={{ fontSize: 12, color: '#389E0D' }}>
                                <Text strong style={{ fontSize: 12, color: '#389E0D' }}>+ {s.title}</Text>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{s.description}</Text>
                              </div>
                            ))}
                          </div>
                        )}
                        {(r as any).weaknesses && (r as any).weaknesses.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(r as any).weaknesses.map((w: any, wi: number) => (
                              <div key={wi} style={{
                                background: '#FFF7E6', borderRadius: 6, padding: '6px 10px',
                                border: '1px solid #FFE7BA',
                              }}>
                                <Text strong style={{ fontSize: 12, color: '#D46B08' }}>- {w.title}</Text>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                                  {w.description}
                                </Text>
                                {w.example && (
                                  <div style={{
                                    background: '#FFF', borderRadius: 4, padding: '4px 8px', marginTop: 6,
                                    border: '1px solid #FFE7BA',
                                  }}>
                                    <Text type="secondary" style={{ fontSize: 10 }}>示范: </Text>
                                    <Text style={{ fontSize: 12, color: '#8C8C8C', fontStyle: 'italic' }}>
                                      {w.example}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {(r as any).reasoning && (
                          <Collapse
                            size="small"
                            ghost
                            style={{ marginTop: 6 }}
                            items={[{
                              key: `reasoning-${r.question_index}`,
                              label: (
                                <Text style={{ fontSize: 11, color: '#8C8C8C' }}>AI 推理过程</Text>
                              ),
                              children: (
                                <div style={{
                                  fontSize: 12, lineHeight: 1.7, color: '#595959',
                                  background: '#FAFAFA', padding: 8, borderRadius: 4,
                                  whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto',
                                }}>
                                  {(r as any).reasoning}
                                </div>
                              ),
                            }]}
                          />
                        )}
                        {r.coverage && r.coverage.length > 0 && (
                          <CoverageDots coverage={r.coverage} />
                        )}
                        {r.feedback && (
                          <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                            {r.feedback}
                          </Text>
                        )}
                        {r.status === 'scored' && r.question_id && (
                          <div style={{ marginTop: 8 }}>
                            {modelAnswers[r.question_id] ? (
                              <div style={{
                                background: '#FAFAFA', border: '1px solid #F0F0F0',
                                borderRadius: 6, padding: 10, marginTop: 6,
                                fontSize: 13, lineHeight: 1.6, color: '#595959',
                              }}>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                                  参考回答（AI 生成）
                                </Text>
                                {modelAnswers[r.question_id]}
                              </div>
                            ) : (
                              <Button
                                size="small"
                                type="link"
                                loading={loadingModel.has(r.question_id)}
                                onClick={() => fetchModelAnswerForQuestion(r.question_id)}
                                style={{ fontSize: 12, padding: 0 }}
                              >
                                查看参考答案
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}]} />
                )}
              </Card>
            );
          }}
        />
      )}
    </div>
  );
}
