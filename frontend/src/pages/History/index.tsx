import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, List, Card, Tag, Button, Spin, Alert, Empty, Collapse,
} from 'antd';
import {
  HistoryOutlined, CaretRightOutlined, SoundOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const API_BASE = 'http://localhost:8000';

interface SessionItem {
  session_id: string;
  created_at: string;
  question_count: number;
  scored_count: number;
  total_covered: number;
  total_points: number;
  results: Array<{
    question_index: number;
    question_id: string;
    question_title?: string;
    status: string;
    transcript?: string;
    feedback?: string;
    coveredCount?: number;
    totalCount?: number;
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
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setSessions(d.sessions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function playRecording(sessionId: string, filename: string) {
    if (playing === `${sessionId}/${filename}`) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const url = `${API_BASE}/api/history/${sessionId}/recording/${filename}`;
    const a = new Audio(url);
    a.onended = () => setPlaying(null);
    a.play().catch(() => {});
    audioRef.current = a;
    setPlaying(`${sessionId}/${filename}`);
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <Alert message="加载失败" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          历史记录
        </Title>
        <Button onClick={() => navigate('/')}>返回题库</Button>
      </div>

      {sessions.length === 0 ? (
        <Empty description="暂无历史记录，先去完成一次模拟面试吧" />
      ) : (
        <List
          dataSource={sessions}
          renderItem={(session) => {
            const avgScore = session.total_points > 0
              ? Math.round((session.total_covered / session.total_points) * 100)
              : 0;
            return (
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{formatDate(session.created_at)}</Text>
                    <Tag color={session.scored_count === session.question_count ? 'green' : 'orange'}>
                      {session.scored_count}/{session.question_count} 已评分
                    </Tag>
                  </div>
                }
              >
                {/* Score summary */}
                {session.total_points > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">采分点命中率：</Text>
                    <Text strong style={{ color: '#BE1E2D', fontSize: 16 }}>
                      {session.total_covered}/{session.total_points}（{avgScore}%）
                    </Text>
                  </div>
                )}

                {/* Recordings */}
                <div style={{ marginBottom: 8 }}>
                  <SoundOutlined style={{ marginRight: 4 }} />
                  <Text type="secondary">录音回放：</Text>
                  {session.recordings.map((rec) => {
                    const key = `${session.session_id}/${rec}`;
                    const isPlaying = playing === key;
                    return (
                      <Button
                        key={rec}
                        size="small"
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

                {/* Score details */}
                {session.results.length > 0 && (
                  <Collapse
                    size="small"
                    ghost
                    items={[
                      {
                        key: 'scores',
                        label: <Text type="secondary">查看评分详情</Text>,
                        children: session.results.map((r) => (
                          <div
                            key={r.question_index}
                            style={{
                              padding: '8px 0',
                              borderBottom: '1px solid #f0f0f0',
                            }}
                          >
                            <Text strong>第{r.question_index + 1}题</Text>
                            {r.status === 'scored' ? (
                              <Tag color="green" style={{ marginLeft: 8 }}>
                                {r.coveredCount}/{r.totalCount} 覆盖
                              </Tag>
                            ) : r.status === 'failed' ? (
                              <Tag color="red" style={{ marginLeft: 8 }}>评分失败</Tag>
                            ) : (
                              <Tag style={{ marginLeft: 8 }}>评分中</Tag>
                            )}
                            {r.feedback && (
                              <Text
                                type="secondary"
                                style={{ display: 'block', fontSize: 13, marginTop: 4 }}
                              >
                                {r.feedback}
                              </Text>
                            )}
                          </div>
                        )),
                      },
                    ]}
                  />
                )}
              </Card>
            );
          }}
        />
      )}
    </div>
  );
}
