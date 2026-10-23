import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export interface DocumentMetadata {
  id: string;
  filename: string;
  title: string;
  type: 'official' | 'user_supplied' | 'exam_logistics' | 'video_manifest';
  authority: 'primary' | 'secondary' | 'logistics_only' | 'reference';
  url: string;
  topicDomain: 'cloud_concepts' | 'architecture_services' | 'management_governance' | 'exam_logistics' | 'general';
}

export interface DocumentRecord extends DocumentMetadata {
  content: string;
}

export const DOCUMENT_METADATA_MAP: Record<string, DocumentMetadata> = {
  '01_official_az900_skills_outline.md': {
    id: '01_official_az900_skills_outline',
    filename: '01_official_az900_skills_outline.md',
    title: 'AZ-900 Official Skills Outline — Scope Map',
    type: 'official',
    authority: 'primary',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900',
    topicDomain: 'general'
  },
  '02_user_supplied_azure_fundamentals_qa.md': {
    id: '02_user_supplied_azure_fundamentals_qa',
    filename: '02_user_supplied_azure_fundamentals_qa.md',
    title: 'User-Supplied PDF: Azure Fundamentals Study Guide',
    type: 'user_supplied',
    authority: 'secondary',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
    topicDomain: 'architecture_services'
  },
  '03_management_tools_and_cloud_concepts.md': {
    id: '03_management_tools_and_cloud_concepts',
    filename: '03_management_tools_and_cloud_concepts.md',
    title: 'User-Supplied PDF: Management Tools, Cloud Models & Scaling',
    type: 'user_supplied',
    authority: 'secondary',
    url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview',
    topicDomain: 'management_governance'
  },
  '04_onvue_exam_day_logistics.md': {
    id: '04_onvue_exam_day_logistics',
    filename: '04_onvue_exam_day_logistics.md',
    title: 'Online-Proctored Exam Logistics (Pearson OnVUE)',
    type: 'exam_logistics',
    authority: 'logistics_only',
    url: 'https://home.pearsonvue.com/microsoft/onvue',
    topicDomain: 'exam_logistics'
  },
  '05_youtube_resource_manifest.md': {
    id: '05_youtube_resource_manifest',
    filename: '05_youtube_resource_manifest.md',
    title: 'User-Supplied YouTube Resources Manifest',
    type: 'video_manifest',
    authority: 'reference',
    url: 'https://youtu.be/a-yuXz_uV30',
    topicDomain: 'general'
  }
};

export function loadRagDocuments(): DocumentRecord[] {
  const docs: DocumentRecord[] = [];
  const dir = config.ragDocsPath;

  if (!fs.existsSync(dir)) {
    console.warn(`[RAG] Directory not found at: ${dir}`);
    return docs;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.md') && DOCUMENT_METADATA_MAP[file]) {
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      docs.push({
        ...DOCUMENT_METADATA_MAP[file],
        content
      });
    }
  }

  return docs;
}
