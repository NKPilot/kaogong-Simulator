import type { Question } from '../types/question';
import { fetchQuestions } from './client';

export async function loadQuestions(): Promise<Question[]> {
  const response = await fetchQuestions();
  if (!response.ok) {
    throw new Error(`Failed to load questions: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<Question[]>;
}
