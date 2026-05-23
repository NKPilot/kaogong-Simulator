import { useMemo } from 'react';

const EXAMINER_COUNT = 5;
const EXAMINER_PATH = '/examiners';

interface ExaminerImage {
  src: string;
  label: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 960,
    margin: '24px auto 0',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'default',
    transition: 'transform 200ms ease',
  },
  image: {
    width: 160,
    height: 200,
    objectFit: 'cover',
    borderRadius: 8,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 400,
    color: '#262626',
    textAlign: 'center' as const,
  },
  placeholder: {
    width: 160,
    height: 200,
    borderRadius: 8,
    background: '#E8E8E8',
  },
};

export default function ExaminerRow() {
  const examiners: ExaminerImage[] = useMemo(() => {
    const indices = Array.from({ length: EXAMINER_COUNT }, (_, i) => i + 1);
    const shuffled = shuffleArray(indices);
    return shuffled.map((index, i) => ({
      src: `${EXAMINER_PATH}/examiner-${index}.svg`,
      label: i === 2 ? '主考官' : '考官',
    }));
  }, []);

  const hasImages = examiners.length > 0;

  if (!hasImages) {
    return (
      <div style={styles.container}>
        {Array.from({ length: EXAMINER_COUNT }, (_, i) => (
          <div key={i} style={styles.imageWrapper}>
            <div style={styles.placeholder} />
            <span style={styles.label}>{i === 2 ? '主考官' : '考官'}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {examiners.map((examiner, i) => (
        <div
          key={examiner.src}
          className="examiner-item"
          style={styles.imageWrapper}
        >
          <img
            src={examiner.src}
            alt={examiner.label}
            style={styles.image}
          />
          <span style={styles.label}>{examiner.label}</span>
        </div>
      ))}
    </div>
  );
}
