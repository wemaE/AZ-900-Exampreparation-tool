import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { ragService } from '../src/rag/ragService.js';

beforeAll(() => {
  ragService.initialize();
});

describe('AzureAce Backend API Suite', () => {
  describe('GET /api/health', () => {
    it('should return 200 with service health and RAG chunks count', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(['live', 'demo']).toContain(res.body.mode);
      expect(res.body.ragChunksCount).toBeGreaterThan(0);
    });
  });

  describe('POST /api/chat', () => {
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

    it('should segregate OnVUE exam logistics for proctoring questions', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Can I wear headphones during Pearson OnVUE exam?' });

      expect(res.status).toBe(200);
      expect(res.body.sources.some((s: { sourceTitle: string }) => s.sourceTitle.includes('OnVUE'))).toBe(true);
    });
  });

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
