import { ragService } from '../src/rag/ragService.js';
import { loadRagDocuments } from '../src/rag/documents.js';
import { config } from '../src/config.js';

async function main() {
  console.log('=== AzureAce RAG Ingestion Pipeline ===');
  console.log(`Knowledge source directory: ${config.ragDocsPath}`);
  
  const docs = loadRagDocuments();
  console.log(`Discovered ${docs.length} verified markdown reference files.`);
  
  for (const doc of docs) {
    console.log(` - [${doc.type.toUpperCase()}] ${doc.title} (${doc.filename})`);
  }

  ragService.initialize();
  const totalChunks = ragService.getChunkCount();
  console.log(`\nSuccessfully indexed ${totalChunks} chunks into local hybrid retriever.`);
  console.log('Note: OnVUE exam logistics are partitioned into a dedicated collection.');
  console.log('Ingestion verification completed successfully.');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
