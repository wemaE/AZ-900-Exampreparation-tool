import { DocumentRecord } from './documents.js';

export interface RagChunk {
  id: string;
  documentId: string;
  sourceTitle: string;
  sourceType: 'official' | 'user_supplied' | 'exam_logistics' | 'video_manifest';
  authority: 'primary' | 'secondary' | 'logistics_only' | 'reference';
  sourceUrl: string;
  topicDomain: string;
  sectionTitle: string;
  content: string;
  keywords: string[];
}

export function chunkMarkdownDocument(doc: DocumentRecord): RagChunk[] {
  const chunks: RagChunk[] = [];
  const lines = doc.content.split('\n');

  let currentHeading = doc.title;
  let currentLines: string[] = [];
  let chunkIdx = 0;

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text.length > 50) {
      const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const uniqueKeywords = Array.from(new Set(words));

      chunks.push({
        id: `${doc.id}_chk_${chunkIdx++}`,
        documentId: doc.id,
        sourceTitle: doc.title,
        sourceType: doc.type,
        authority: doc.authority,
        sourceUrl: doc.url,
        topicDomain: doc.topicDomain,
        sectionTitle: currentHeading,
        content: text,
        keywords: uniqueKeywords
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      flush();
      currentHeading = line.replace(/^#+\s*/, '').trim();
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return chunks;
}
