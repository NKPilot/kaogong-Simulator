const API_BASE_URL = 'http://localhost:8000';

export async function fetchQuestions(): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/questions`);
}

export async function fetchQuestion(id: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/questions/${encodeURIComponent(id)}`);
}

export async function healthCheck(): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/health`);
}
