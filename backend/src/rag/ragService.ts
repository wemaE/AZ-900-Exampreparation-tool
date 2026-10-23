import { loadRagDocuments } from './documents.js';
import { chunkMarkdownDocument, RagChunk } from './chunker.js';

export interface RetrievedSource {
  sourceId: string;
  sourceTitle: string;
  sourceType: 'official' | 'user_supplied' | 'exam_logistics' | 'video_manifest';
  authority: 'primary' | 'secondary' | 'logistics_only' | 'reference';
  sourceUrl: string;
  sectionTitle: string;
  score: number;
}

export interface RetrievalResult {
  contextText: string;
  sources: RetrievedSource[];
  isLogisticsQuery: boolean;
  hasGroundedSupport: boolean;
}

class RagService {
  private technicalChunks: RagChunk[] = [];
  private logisticsChunks: RagChunk[] = [];
  private initialized = false;

  public initialize(): void {
    if (this.initialized) return;

    const docs = loadRagDocuments();
    for (const doc of docs) {
      const chunks = chunkMarkdownDocument(doc);
      if (doc.type === 'exam_logistics') {
        this.logisticsChunks.push(...chunks);
      } else {
        this.technicalChunks.push(...chunks);
      }
    }

    this.initialized = true;
    console.log(
      `[RAG] Loaded ${this.technicalChunks.length} technical chunks and ${this.logisticsChunks.length} logistics chunks.`
    );
  }

  public getChunkCount(): number {
    if (!this.initialized) this.initialize();
    return this.technicalChunks.length + this.logisticsChunks.length;
  }

  public retrieve(query: string, explicitTopic?: string): RetrievalResult {
    if (!this.initialized) this.initialize();

    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Check if query is specifically about exam day logistics / proctoring / OnVUE
    const logisticsKeywords = [
      'onvue',
      'proctor',
      'webcam',
      'id',
      'passport',
      'driver',
      'desk',
      'exam day',
      'headphones',
      'room',
      'earbuds',
      'scratch paper',
      'rules'
    ];
    const isLogisticsQuery =
      explicitTopic === 'exam_logistics' ||
      logisticsKeywords.some((k) => normalizedQuery.includes(k) && !normalizedQuery.includes('azure policy'));

    // Separate collection routing
    const targetChunks = isLogisticsQuery ? this.logisticsChunks : this.technicalChunks;

    const scored = targetChunks.map((chunk) => {
      let score = 0;

      // Exact phrase match
      if (chunk.content.toLowerCase().includes(normalizedQuery)) {
        score += 20;
      }

      // Section title match
      if (chunk.sectionTitle.toLowerCase().includes(normalizedQuery)) {
        score += 15;
      }

      // Keyword token overlap
      for (const token of queryTokens) {
        if (chunk.keywords.includes(token)) {
          score += 2;
        }
        if (chunk.sectionTitle.toLowerCase().includes(token)) {
          score += 4;
        }
      }

      // Source authority weighting: prefer official Microsoft Learn
      if (chunk.authority === 'primary') {
        score *= 1.35;
      }

      return { chunk, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const topResults = scored.filter((item) => item.score > 2).slice(0, 3);
    const hasGroundedSupport = topResults.length > 0;

    const contextParts: string[] = [];
    const sources: RetrievedSource[] = [];
    const seenSources = new Set<string>();

    for (const { chunk, score } of topResults) {
      contextParts.push(
        `[Source: ${chunk.sourceTitle} (${chunk.sourceType}) | Section: ${chunk.sectionTitle}]\n${chunk.content}`
      );

      const sourceKey = chunk.sourceTitle;
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        sources.push({
          sourceId: chunk.documentId,
          sourceTitle: chunk.sourceTitle,
          sourceType: chunk.sourceType,
          authority: chunk.authority,
          sourceUrl: chunk.sourceUrl,
          sectionTitle: chunk.sectionTitle,
          score: Math.round(score * 10) / 10
        });
      }
    }

    // Default official fallback link if no specific support found
    if (sources.length === 0) {
      sources.push({
        sourceId: '01_official_az900_skills_outline',
        sourceTitle: 'Microsoft Learn: AZ-900 Study Guide',
        sourceType: 'official',
        authority: 'primary',
        sourceUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900',
        sectionTitle: 'Official Skills Outline',
        score: 1.0
      });
    }

    return {
      contextText: contextParts.join('\n\n---\n\n'),
      sources,
      isLogisticsQuery,
      hasGroundedSupport
    };
  }
}

export const ragService = new RagService();
