import { app } from './app.js';
import { config, isLiveMode } from './config.js';
import { ragService } from './rag/ragService.js';

// Pre-initialize RAG on server boot
ragService.initialize();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 AzureAce Backend running on port ${config.port}`);
  console.log(`📡 Mode: ${isLiveMode ? 'LIVE (Gemini AI)' : 'DEMO MODE (Grounded Mock Engine)'}`);
  console.log(`📚 Indexed RAG Chunks: ${ragService.getChunkCount()}`);
  console.log(`🌐 Allowed Frontend: ${config.frontendUrl}`);
  console.log(`===============================================`);
});
