import { API_BASE_URL } from './client';

export async function uploadRecording(
  sessionId: string,
  questionIndex: number,
  audioBlob: Blob
): Promise<void> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('question_index', String(questionIndex));
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${API_BASE_URL}/api/recording/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorMsg = `Recording upload failed: ${response.status} ${response.statusText}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
