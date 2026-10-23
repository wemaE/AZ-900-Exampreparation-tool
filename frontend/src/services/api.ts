import { ChatMessage, HealthStatus, QuizEvaluation, QuizQuestion } from '../types.js';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error('Health check failed');
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  topic?: string,
  action?: 'explain' | 'simplify' | 'example' | 'compare' | 'test_me',
  history?: Array<{ role: string; content: string }>
): Promise<{
  answer: string;
  analogy?: string;
  followUp?: string;
  sources: ChatMessage['sources'];
  mode: 'live' | 'demo';
}> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      topic: topic === 'all' ? undefined : topic,
      action,
      history
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${res.status}`);
  }

  return res.json();
}

export async function fetchQuizQuestion(topic: string, context?: string): Promise<QuizQuestion> {
  const res = await fetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topic === 'all' ? 'cloud_concepts' : topic,
      context
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate quiz question');
  }

  return res.json();
}

export async function submitQuizAnswer(
  quizId: string,
  selectedOptionIndex: number
): Promise<QuizEvaluation> {
  const res = await fetch(`${API_BASE}/quiz/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, selectedOptionIndex })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to evaluate quiz answer');
  }

  return res.json();
}
