import { Router, Request, Response } from 'express';
import { geminiService, QuizQuestionData } from '../gemini/geminiService.js';

export const quizRouter = Router();

interface StoredQuizSession {
  quizId: string;
  topic: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  misconceptionCorrection: string;
  createdAt: number;
}

// In-memory quiz sessions map (auto-cleaned after 1 hour)
const quizStore = new Map<string, StoredQuizSession>();

function cleanupOldSessions() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, session] of quizStore.entries()) {
    if (session.createdAt < oneHourAgo) {
      quizStore.delete(id);
    }
  }
}

// POST /api/quiz - Generates practice question without leaking correct answer
quizRouter.post('/', async (req: Request, res: Response) => {
  try {
    cleanupOldSessions();
    const { topic, context } = req.body;

    const validTopics = ['cloud_concepts', 'architecture_services', 'management_governance', 'exam_logistics'];
    const sanitizedTopic = validTopics.includes(topic) ? topic : 'cloud_concepts';

    const quizData: QuizQuestionData = await geminiService.generateQuizQuestion(sanitizedTopic, context);

    // Save evaluation data securely on server
    quizStore.set(quizData.quizId, {
      quizId: quizData.quizId,
      topic: quizData.topic,
      options: quizData.options,
      correctOptionIndex: quizData.correctOptionIndex,
      explanation: quizData.explanation,
      misconceptionCorrection: quizData.misconceptionCorrection,
      createdAt: Date.now()
    });

    // Return payload WITHOUT correctOptionIndex or explanation
    return res.json({
      quizId: quizData.quizId,
      topic: quizData.topic,
      question: quizData.question,
      options: quizData.options,
      disclaimer: quizData.disclaimer
    });
  } catch (err: unknown) {
    console.error('[Quiz Generation Error]:', err instanceof Error ? err.message : err);
    return res.status(500).json({
      error: 'Failed to generate practice quiz question. Please retry.'
    });
  }
});

// POST /api/quiz/evaluate - Evaluates user's answer and reveals explanations
quizRouter.post('/evaluate', (req: Request, res: Response) => {
  try {
    const { quizId, selectedOptionIndex } = req.body;

    if (!quizId || typeof quizId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: "quizId" is required.'
      });
    }

    if (typeof selectedOptionIndex !== 'number') {
      return res.status(400).json({
        error: 'Invalid request: "selectedOptionIndex" must be a number.'
      });
    }

    const session = quizStore.get(quizId);
    if (!session) {
      return res.status(404).json({
        error: 'Quiz session expired or not found. Please request a new question.'
      });
    }

    const isCorrect = selectedOptionIndex === session.correctOptionIndex;
    const correctOptionText = session.options[session.correctOptionIndex] || '';

    return res.json({
      isCorrect,
      correctOptionIndex: session.correctOptionIndex,
      correctOptionText,
      explanation: session.explanation,
      misconceptionCorrection: session.misconceptionCorrection,
      source: {
        title: 'Microsoft Learn: AZ-900 Certification Topics',
        url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900'
      }
    });
  } catch (err: unknown) {
    console.error('[Quiz Evaluation Error]:', err instanceof Error ? err.message : err);
    return res.status(500).json({
      error: 'Failed to evaluate quiz answer.'
    });
  }
});
