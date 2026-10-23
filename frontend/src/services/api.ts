import { ChatMessage, HealthStatus, QuizEvaluation, QuizQuestion } from '../types.js';

// In production, VITE_API_BASE_URL points to the deployed Render backend (e.g. https://azureace-backend.onrender.com)
// Automatically append /api if the base URL does not already include it
const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

async function parseJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  let data: any = null;
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data && typeof data === 'object' && data.error
      ? data.error
      : `${fallbackError} (${res.status})`;
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error(`${fallbackError}: Received an empty or non-JSON response from server.`);
  }

  return data as T;
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : String(err);
    if (rawError.toLowerCase().includes('failed to fetch') || rawError.toLowerCase().includes('networkerror')) {
      throw new Error(
        `Unable to reach AzureAce backend at ${API_BASE}. If using Render free tier, the backend may be waking up (please wait ~30s and click Retry) or needs to be deployed.`
      );
    }
    throw err;
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await safeFetch(`${API_BASE}/health`);
  return parseJsonResponse<HealthStatus>(res, 'Health check failed');
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
  const res = await safeFetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      topic: topic === 'all' ? undefined : topic,
      action,
      history
    })
  });

  return parseJsonResponse(res, 'Chat request failed');
}

export async function fetchQuizQuestion(topic: string, context?: string): Promise<QuizQuestion> {
  const res = await safeFetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topic === 'all' ? 'cloud_concepts' : topic,
      context
    })
  });

  return parseJsonResponse<QuizQuestion>(res, 'Failed to generate quiz question');
}

export async function submitQuizAnswer(
  quizId: string,
  selectedOptionIndex: number
): Promise<QuizEvaluation> {
  const res = await safeFetch(`${API_BASE}/quiz/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, selectedOptionIndex })
  });

  return parseJsonResponse<QuizEvaluation>(res, 'Failed to evaluate quiz answer');
}
