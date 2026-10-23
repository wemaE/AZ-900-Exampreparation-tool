import { Router, Request, Response } from 'express';
import { ragService } from '../rag/ragService.js';
import { geminiService } from '../gemini/geminiService.js';

export const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, topic, action, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: "message" is required and must be a string.'
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({
        error: 'Message cannot be empty.'
      });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({
        error: 'Message length exceeds the 1,000 character limit.'
      });
    }

    const validActions = ['explain', 'simplify', 'example', 'compare', 'test_me'];
    const sanitizedAction = validActions.includes(action) ? action : 'explain';

    // RAG Retrieval step
    const retrieval = ragService.retrieve(trimmed, topic);

    // AI Generation step (Live Gemini or Grounded Demo Engine)
    const result = await geminiService.generateChatResponse(
      trimmed,
      retrieval,
      sanitizedAction,
      Array.isArray(history) ? history : undefined
    );

    return res.json({
      answer: result.answer,
      analogy: result.analogy,
      followUp: result.followUp,
      sources: result.sources,
      mode: result.mode
    });
  } catch (err: unknown) {
    console.error('[Chat API Error]:', err instanceof Error ? err.message : err);
    return res.status(500).json({
      error: 'An internal error occurred while processing your study query. Please retry.'
    });
  }
});
