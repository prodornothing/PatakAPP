export interface AdvisoryDocument {
  id: string;
  title: string;
  source: string;
  agency: 'DA' | 'PAGASA' | 'DOH' | 'DA-BAI' | 'DILG' | 'USER_UPLOAD';
  date: string;
  category: 'Agriculture & Rice' | 'Weather & Climate' | 'Public Health' | 'Livestock & Poultry' | 'Community & LGU' | 'Uploaded Document';
  summary: string;
  fullText: string;
  chunks: string[];
  pageCount?: number;
  isUploaded?: boolean;
}

export interface RAGChunk {
  id: string;
  documentId: string;
  source: string;
  title: string;
  agency: string;
  text: string;
  category: string;
  page?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  citation: string;
  isDone: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  contextChunks?: RAGChunk[];
  checklist?: ChecklistItem[];
  suggestedFollowUps?: string[];
  isOffline?: boolean;
  modelUsed?: string;
  rawResponse?: string;
}

export type EngineMode = 'in_browser' | 'local_ollama' | 'fastapi_backend';

export interface EngineConfig {
  mode: EngineMode;
  ollamaUrl: string;
  ollamaModel: string;
  ollamaEmbeddingModel: string;
  fastApiUrl: string;
  wifiDisabled: boolean;
  topK: number;
  language: 'bilingual' | 'filipino' | 'english';
}
