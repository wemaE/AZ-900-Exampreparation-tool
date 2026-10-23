import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { ragService } from '../src/rag/ragService.js';

beforeAll(() => {
  ragService.initialize();
});

describe('AzureAce Backend API Suite', () => {
  // ---------------------------------------------------------------
  // Health endpoint
  // ---------------------------------------------------------------
  describe('GET /api/health', () => {
    it('should return 200 with service health and RAG chunks count', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(['live', 'demo']).toContain(res.body.mode);
      expect(res.body.ragChunksCount).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------
  // Chat: input validation
  // ---------------------------------------------------------------
  describe('POST /api/chat — input validation', () => {
    it('should return 400 when message is missing or empty', async () => {
      const res = await request(app).post('/api/chat').send({ message: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when message exceeds length limits', async () => {
      const longMsg = 'a'.repeat(1050);
      const res = await request(app).post('/api/chat').send({ message: longMsg });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('limit');
    });
  });

  // ---------------------------------------------------------------
  // Chat: intent classification — conversational short-circuits
  // ---------------------------------------------------------------
  describe('POST /api/chat — greeting / thanks / help intent', () => {
    it('should respond naturally to a greeting without forcing RAG', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'hi' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      // Should NOT produce the generic "You asked about: hi" fallback
      expect(res.body.answer).not.toMatch(/You asked about.*hi/i);
      // Greeting responses do not require RAG sources
      expect(res.body.sources).toBeInstanceOf(Array);
    });

    it('should respond naturally to "hello"', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'hello' });
      expect(res.status).toBe(200);
      expect(res.body.answer.toLowerCase()).toMatch(/azureace|study|az-900|hello/);
    });

    it('should respond naturally to "thanks"', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'thanks' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.answer).not.toMatch(/You asked about/i);
    });

    it('should respond naturally to "thank you"', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'thank you' });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
    });

    it('should describe capabilities in response to a help request', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'help' });
      expect(res.status).toBe(200);
      // Help response should mention study, quiz, or topics
      expect(res.body.answer.toLowerCase()).toMatch(/study|quiz|topic|az-900/);
    });
  });

  // ---------------------------------------------------------------
  // Chat: AZ-900 topic questions
  // ---------------------------------------------------------------
  describe('POST /api/chat — AZ-900 topic questions', () => {
    it('should answer a cloud concept question with grounded sources', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'What is the difference between IaaS and PaaS?' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.sources).toBeInstanceOf(Array);
      expect(res.body.sources.length).toBeGreaterThan(0);
      expect(['live', 'demo']).toContain(res.body.mode);
    });

    it('should answer an Azure pricing question with relevant content', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Tell me more about Azure pricing models' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      // Should contain pricing-related terms, NOT generic "Azure Fundamentals Study Overview" fallback
      expect(res.body.answer.toLowerCase()).toMatch(/pay|pricing|opex|capex|cost|reserved|billing/);
    });

    it('should answer a governance question about Azure Advisor', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'What does Azure Advisor do?' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.answer.toLowerCase()).toMatch(/advisor|recommendation|cost|security|reliability/);
    });

    it('should answer a shared responsibility question', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Explain the Azure Shared Responsibility Model' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.answer.toLowerCase()).toMatch(/responsibility|customer|microsoft|data/);
    });

    it('should segregate OnVUE exam logistics for proctoring questions', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Can I wear headphones during Pearson OnVUE exam?' });

      expect(res.status).toBe(200);
      // Must route to OnVUE knowledge, not generic
      expect(res.body.answer.toLowerCase()).toMatch(/headphone|onvue|proctor|prohibited/);
    });
  });

  // ---------------------------------------------------------------
  // Chat: source citation deduplication
  // ---------------------------------------------------------------
  describe('POST /api/chat — source citations', () => {
    it('should not return duplicate source titles in a single response', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Explain storage redundancy options LRS ZRS GRS' });

      expect(res.status).toBe(200);
      const titles = res.body.sources.map((s: { sourceTitle: string }) => s.sourceTitle);
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });

    it('should include at least one source reference for a technical question', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'What are Availability Zones in Azure?' });

      expect(res.status).toBe(200);
      expect(res.body.sources).toBeInstanceOf(Array);
      expect(res.body.sources.length).toBeGreaterThan(0);
      // Official source must have a valid URL
      const official = res.body.sources.find((s: { sourceType: string }) => s.sourceType === 'official');
      if (official) {
        expect(official.sourceUrl).toMatch(/^https?:\/\//);
      }
    });
  });

  // ---------------------------------------------------------------
  // Chat: conversation history forwarded
  // ---------------------------------------------------------------
  describe('POST /api/chat — conversation history', () => {
    it('should accept and not error on history payload', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          message: 'Can you elaborate on the last point?',
          history: [
            { role: 'user', content: 'What is IaaS?' },
            { role: 'assistant', content: 'IaaS is Infrastructure as a Service...' }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
    });
  });

  // ---------------------------------------------------------------
  // Quiz & evaluation (original tests preserved)
  // ---------------------------------------------------------------
  describe('POST /api/quiz & POST /api/quiz/evaluate', () => {
    it('should generate an original quiz question WITHOUT leaking the correct answer', async () => {
      const res = await request(app)
        .post('/api/quiz')
        .send({ topic: 'cloud_concepts' });

      expect(res.status).toBe(200);
      expect(res.body.quizId).toBeDefined();
      expect(res.body.question).toBeDefined();
      expect(res.body.options).toBeInstanceOf(Array);
      expect(res.body.options.length).toBe(4);
      expect(res.body.disclaimer).toContain('Practice questions, not official exam questions');

      // Crucial requirement: Never leak the answer in the question payload
      expect(res.body.correctOptionIndex).toBeUndefined();
      expect(res.body.explanation).toBeUndefined();
    });

    it('should evaluate a submitted quiz option and return explanation & misconception correction', async () => {
      // 1. Generate quiz
      const quizRes = await request(app)
        .post('/api/quiz')
        .send({ topic: 'cloud_concepts' });
      const quizId = quizRes.body.quizId;

      // 2. Submit answer
      const evalRes = await request(app)
        .post('/api/quiz/evaluate')
        .send({ quizId, selectedOptionIndex: 0 });

      expect(evalRes.status).toBe(200);
      expect(typeof evalRes.body.isCorrect).toBe('boolean');
      expect(typeof evalRes.body.correctOptionIndex).toBe('number');
      expect(evalRes.body.explanation).toBeDefined();
      expect(evalRes.body.misconceptionCorrection).toBeDefined();
    });

    it('should return 404 when evaluating an invalid or expired quizId', async () => {
      const res = await request(app)
        .post('/api/quiz/evaluate')
        .send({ quizId: 'non_existent_id', selectedOptionIndex: 1 });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
