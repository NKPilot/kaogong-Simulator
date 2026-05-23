import { API_BASE_URL } from './client';

export interface GuidanceResponse {
  title: string;
  paragraphs: string[];
}

export async function fetchGuidance(questionCount: number): Promise<GuidanceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/interview/guidance?question_count=${questionCount}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch guidance: ${response.status} ${response.statusText}`
    );
  }
  return response.json() as Promise<GuidanceResponse>;
}
