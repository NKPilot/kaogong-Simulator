export interface Question {
  id: string;
  title: string;
  fullText: string;
  type: 'A' | 'B' | 'C' | '结构化小组';
  year: number;
  source: string;
  scorePoints?: string;
}
