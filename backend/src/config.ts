import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend or root directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  ragDocsPath: path.resolve(process.cwd(), '../rag')
};

export const isLiveMode = Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 0 && config.geminiApiKey !== 'your_gemini_api_key_here');
