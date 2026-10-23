import { Router, Request, Response } from 'express';
import { ragService } from '../rag/ragService.js';
import { geminiService } from '../gemini/geminiService.js';

export const chatRouter = Router();

// -----------------------------------------------------------------
// Intent classification — decides whether RAG retrieval is needed.
// Returns 'greeting' | 'thanks' | 'help' | 'az900' | 'off_topic'
// -----------------------------------------------------------------
function classifyIntent(
  message: string
): 'greeting' | 'thanks' | 'help' | 'clarification' | 'az900' {
  const lower = message.toLowerCase().trim().replace(/[!?.,:;]+$/, '');

  const greetingPatterns =
    /^(hi|hello|hey|hiya|howdy|greetings|yo|sup|what'?s up|morning|afternoon|evening|(good\s*)?(morning|afternoon|evening|day)|(hi|hello|hey)\s+there)$/i;
  if (greetingPatterns.test(lower)) return 'greeting';

  const thanksPatterns =
    /^(thanks?|thank you|cheers|appreciated?|great|awesome|perfect|cool|got it|ok|okay|got it,? thanks?)$/i;
  if (thanksPatterns.test(lower)) return 'thanks';

  const helpPatterns =
    /^(help|what can you do|what do you know|how (do i use|does this work)|commands?|options?)$/i;
  if (helpPatterns.test(lower)) return 'help';

  // Follow-up / clarification markers (short questions referencing prior context)
  const clarificationPatterns =
    /^(can you (explain|clarify|elaborate|tell me more|expand)|what do you mean|more (details?|info(rmation)?)|follow[ -]?up)/i;
  if (clarificationPatterns.test(lower) && lower.length < 80) return 'clarification';

  return 'az900';
}

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, topic, action, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: "message" is required and must be a string.'
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({
        error: 'Message length exceeds the 1,000 character limit.'
      });
    }

    const validActions = ['explain', 'simplify', 'example', 'compare', 'test_me'];
    const sanitizedAction = validActions.includes(action) ? action : 'explain';

    const intent = classifyIntent(trimmed);
    const safeHistory = Array.isArray(history) ? history : [];

    // ---------------------------------------------------------------
    // Conversational short-circuit: no RAG needed for greetings/etc.
    // ---------------------------------------------------------------
    if (intent === 'greeting') {
      let salutation = 'Hello!';
      if (/evening/i.test(trimmed)) salutation = 'Good evening!';
      else if (/morning/i.test(trimmed)) salutation = 'Good morning!';
      else if (/afternoon/i.test(trimmed)) salutation = 'Good afternoon!';

      return res.json({
        answer: `${salutation} 👋 I'm **AzureAce**, your AZ-900 Study Buddy.\n\nI can help you understand Microsoft Azure Fundamentals concepts, clarify difficult exam topics, or quiz you with practice questions. What would you like to explore?\n\n*Quick suggestions:*\n- "What is the Shared Responsibility Model?"\n- "Explain IaaS vs PaaS with an everyday analogy."\n- "What is the difference between Azure Policy and Resource Locks?"`,
        sources: [],
        mode: 'demo'
      });
    }

    if (intent === 'thanks') {
      return res.json({
        answer:
          "You're welcome! 😊 Feel free to ask about any AZ-900 topic — Cloud Concepts, Azure Architecture, Management & Governance, or Exam Day logistics. I'm here to help.",
        sources: [],
        mode: 'demo'
      });
    }

    if (intent === 'help') {
      return res.json({
        answer:
          "## What I Can Help You With\n\n**Study Chat (this tab)**\n- Ask any AZ-900 question — I'll explain it with an analogy and cite my sources.\n- Use the **Simplify**, **Give example**, or **Compare** chips under any answer to dig deeper.\n- Click **Test me** to jump to a cheat-proof Practice Quiz on that topic.\n\n**Practice Quiz tab**\n- Select a topic and answer an original practice question.\n- Submit your answer to see the explanation and a misconception correction.\n\n**Topic filters** (above) narrow both chat and quiz to a specific domain.\n\n> 📘 Independent learning tool — not affiliated with or endorsed by Microsoft.",
        sources: [],
        mode: 'demo'
      });
    }

    // For clarification, keep existing history as extra context but still retrieve
    const retrieval = ragService.retrieve(trimmed, topic);

    const result = await geminiService.generateChatResponse(
      trimmed,
      retrieval,
      sanitizedAction,
      safeHistory,
      intent
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
