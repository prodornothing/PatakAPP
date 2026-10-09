import { AdvisoryDocument, RAGChunk } from '../types';
import { OFFICIAL_ADVISORIES } from '../data/advisories';
import { extractTextFromPDF } from './pdfParser';

const STORAGE_KEY = 'patak_uploaded_advisories_v2';

// In-memory cache of uploaded documents
let uploadedDocsCache: AdvisoryDocument[] = [];
let isInitialized = false;

// Listeners for reactive updates
type Listener = (docs: AdvisoryDocument[]) => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  const allDocs = getAllAdvisories();
  listeners.forEach(cb => cb(allDocs));
}

export function subscribeToAdvisories(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Load uploaded documents from localStorage
 */
export function getUploadedAdvisories(): AdvisoryDocument[] {
  if (typeof window === 'undefined' || !window.localStorage) return uploadedDocsCache;
  if (!isInitialized) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        uploadedDocsCache = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load uploaded advisories from localStorage:', e);
      uploadedDocsCache = [];
    }
    isInitialized = true;
  }
  return uploadedDocsCache;
}

/**
 * Get all advisories (Official + Uploaded)
 */
export function getAllAdvisories(): AdvisoryDocument[] {
  const uploaded = getUploadedAdvisories();
  return [...uploaded, ...OFFICIAL_ADVISORIES];
}

/**
 * Save an uploaded advisory to localStorage
 */
export function saveUploadedAdvisory(doc: AdvisoryDocument): void {
  const existing = getUploadedAdvisories();
  const updated = [doc, ...existing.filter(d => d.id !== doc.id)];
  uploadedDocsCache = updated;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save advisory to localStorage:', e);
    }
  }
  notifyListeners();
}

/**
 * Update and rename an uploaded advisory (title, filename/source, category, summary)
 */
export function updateUploadedAdvisory(
  id: string,
  updates: {
    title?: string;
    source?: string;
    category?: any;
    summary?: string;
  }
): void {
  const existing = getUploadedAdvisories();
  const updated = existing.map(doc => {
    if (doc.id === id) {
      const newTitle = updates.title?.trim() || doc.title;
      const newSource = updates.source?.trim() || doc.source;
      const newCategory = updates.category || doc.category;
      const newSummary = updates.summary?.trim() || doc.summary;

      const updatedChunks = doc.chunks.map(ch => {
        return ch.replace(new RegExp(`\\[${doc.source},`, 'g'), `[${newSource},`);
      });

      return {
        ...doc,
        title: newTitle,
        source: newSource,
        category: newCategory,
        summary: newSummary,
        chunks: updatedChunks
      };
    }
    return doc;
  });

  uploadedDocsCache = updated;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage:', e);
    }
  }
  notifyListeners();
}

function withPreservedExtension(originalName: string, nextName: string): string {
  const trimmed = nextName.trim();
  if (!trimmed) return originalName;
  const lastDot = originalName.lastIndexOf('.');
  const ext = lastDot >= 0 ? originalName.slice(lastDot) : '';
  if (!ext) return trimmed;
  if (trimmed.toLowerCase().endsWith(ext.toLowerCase())) return trimmed;
  return `${trimmed}${ext}`;
}

/**
 * Rename an uploaded file: display title, actual filename/source, and optional summary.
 */
export function renameUploadedAdvisory(
  id: string,
  updates: string | { title?: string; fileName?: string; summary?: string }
): void {
  if (typeof updates === 'string') {
    updateUploadedAdvisory(id, { title: updates });
    return;
  }

  const existing = getUploadedAdvisories().find(doc => doc.id === id);
  const source = updates.fileName && existing
    ? withPreservedExtension(existing.source, updates.fileName)
    : updates.fileName;

  updateUploadedAdvisory(id, {
    title: updates.title,
    source,
    summary: updates.summary
  });
}

/**
 * Delete an uploaded advisory
 */
export function deleteUploadedAdvisory(id: string): void {
  const existing = getUploadedAdvisories();
  const updated = existing.filter(d => d.id !== id);
  uploadedDocsCache = updated;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage after deletion:', e);
    }
  }
  notifyListeners();
}

/**
 * Convert raw text/pages into structured RAG chunks
 */
export function chunkTextIntoRAG(
  docId: string,
  sourceName: string,
  docTitle: string,
  pages: { pageNumber: number; text: string }[]
): { chunks: string[]; ragChunks: RAGChunk[] } {
  const chunks: string[] = [];
  const ragChunks: RAGChunk[] = [];
  let chunkIndex = 1;

  for (const page of pages) {
    const pageNum = page.pageNumber;
    // Split page text into paragraphs or sentences
    const paragraphs = page.text
      .split(/\n\s*\n|\r\n\r\n/)
      .map(p => p.trim())
      .filter(p => p.length > 15);

    if (paragraphs.length === 0 && page.text.trim().length > 15) {
      paragraphs.push(page.text.trim());
    }

    let buffer = '';
    for (const paragraph of paragraphs) {
      if ((buffer + ' ' + paragraph).length < 500) {
        buffer += (buffer ? ' ' : '') + paragraph;
      } else {
        if (buffer) {
          const chunkStr = `${buffer} [${sourceName}, Page ${pageNum}]`;
          chunks.push(chunkStr);
          ragChunks.push({
            id: `${docId}-chunk-${chunkIndex++}`,
            documentId: docId,
            source: sourceName,
            title: docTitle,
            agency: 'USER_UPLOAD',
            category: 'Uploaded Document',
            text: buffer,
            page: pageNum
          });
        }
        buffer = paragraph;
      }
    }

    if (buffer) {
      const chunkStr = `${buffer} [${sourceName}, Page ${pageNum}]`;
      chunks.push(chunkStr);
      ragChunks.push({
        id: `${docId}-chunk-${chunkIndex++}`,
        documentId: docId,
        source: sourceName,
        title: docTitle,
        agency: 'USER_UPLOAD',
        category: 'Uploaded Document',
        text: buffer,
        page: pageNum
      });
    }
  }

  // Fallback if no chunks were created
  if (chunks.length === 0 && pages.length > 0) {
    const firstText = pages[0].text.slice(0, 500) || 'Walang nalamang teksto.';
    const chunkStr = `${firstText} [${sourceName}, Page 1]`;
    chunks.push(chunkStr);
    ragChunks.push({
      id: `${docId}-chunk-1`,
      documentId: docId,
      source: sourceName,
      title: docTitle,
      agency: 'USER_UPLOAD',
      category: 'Uploaded Document',
      text: firstText,
      page: 1
    });
  }

  return { chunks, ragChunks };
}

/**
 * Process and save an uploaded file (PDF, TXT, MD, etc.)
 */
export async function processUploadedFile(file: File): Promise<{
  doc: AdvisoryDocument;
  ragChunks: RAGChunk[];
}> {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  let pages: { pageNumber: number; text: string }[] = [];
  let fullText = '';

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = await extractTextFromPDF(arrayBuffer);
    pages = pdfData.pages;
    fullText = pdfData.text;
  } else {
    // Plain text or markdown
    fullText = await file.text();
    const rawParagraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
    const approxPages = Math.max(1, Math.ceil(rawParagraphs.length / 4));
    
    for (let pIdx = 1; pIdx <= approxPages; pIdx++) {
      const start = (pIdx - 1) * 4;
      const end = start + 4;
      const pageText = rawParagraphs.slice(start, end).join('\n\n');
      if (pageText.trim()) {
        pages.push({ pageNumber: pIdx, text: pageText });
      }
    }
    if (pages.length === 0) {
      pages.push({ pageNumber: 1, text: fullText });
    }
  }

  const cleanTitle = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const docId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { chunks, ragChunks } = chunkTextIntoRAG(docId, file.name, cleanTitle, pages);

  const previewSnippet = (fullText || '').replace(/\s+/g, ' ').slice(0, 180);
  const summary = `Na-upload na file (${file.name}, ${pages.length} pahina). Naka-index sa ${chunks.length} chunks para sa offline AI: "${previewSnippet}..."`;

  const newDoc: AdvisoryDocument = {
    id: docId,
    title: cleanTitle,
    source: file.name,
    agency: 'USER_UPLOAD',
    date: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    category: 'Uploaded Document',
    pageCount: pages.length,
    summary,
    fullText,
    chunks,
    isUploaded: true
  };

  saveUploadedAdvisory(newDoc);
  return { doc: newDoc, ragChunks };
}
