import { Button, Spin, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TTSControlsProps {
  playing: boolean;
  paused: boolean;
  ended: boolean;
  error: boolean;
  loading: boolean;
  onPlayPause: () => void;
  onReplay: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#262626',
  },
  errorText: {
    fontSize: 14,
    color: '#8C8C8C',
    textAlign: 'center',
    marginTop: 16,
  },
};

export default function TTSControls({
  playing,
  paused,
  ended,
  error,
  loading,
  onPlayPause,
  onReplay,
}: TTSControlsProps) {
  if (error) {
    return (
      <div style={styles.container}>
        <Text style={styles.errorText}>语音播放失败，请查看下方文字</Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <Spin />
      </div>
    );
  }

  const getStatusText = (): string => {
    if (playing) return '正在播放引导语...';
    if (paused) return '已暂停';
    if (ended) return '播放完毕';
    return '';
  };

  const showReplay = !loading && !error;

  return (
    <div style={styles.container}>
      <Button
        type="text"
        icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={onPlayPause}
      />
      {showReplay && (
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={onReplay}
        />
      )}
      <Text style={styles.statusText}>{getStatusText()}</Text>
    </div>
  );
}
