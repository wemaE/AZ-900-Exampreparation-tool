export type TopicDomain =
  | 'all'
  | 'cloud_concepts'
  | 'architecture_services'
  | 'management_governance'
  | 'exam_logistics';

export interface SourceCitation {
  sourceId: string;
  sourceTitle: string;
  sourceType: 'official' | 'user_supplied' | 'exam_logistics' | 'video_manifest';
  authority: 'primary' | 'secondary' | 'logistics_only' | 'reference';
  sourceUrl: string;
  sectionTitle: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analogy?: string;
  followUp?: string;
  sources?: SourceCitation[];
  mode?: 'live' | 'demo';
  timestamp: string;
}

export interface QuizQuestion {
  quizId: string;
  topic: string;
  question: string;
  options: string[];
  disclaimer: string;
}

export interface QuizEvaluation {
  isCorrect: boolean;
  correctOptionIndex: number;
  correctOptionText: string;
  explanation: string;
  misconceptionCorrection: string;
  source: {
    title: string;
    url: string;
  };
}

export interface HealthStatus {
  status: string;
  mode: 'live' | 'demo';
  geminiConfigured: boolean;
  model: string;
  ragChunksCount: number;
}
