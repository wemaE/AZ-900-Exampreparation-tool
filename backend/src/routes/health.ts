import { Router, Request, Response } from 'express';
import { isLiveMode, config } from '../config.js';
import { ragService } from '../rag/ragService.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: isLiveMode ? 'live' : 'demo',
    geminiConfigured: isLiveMode,
    model: config.geminiModel,
    ragChunksCount: ragService.getChunkCount(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
