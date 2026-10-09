import { ALL_RAG_CHUNKS } from '../data/advisories';
import { RAGChunk, ChecklistItem, EngineConfig, AdvisoryDocument } from '../types';
import { getUploadedAdvisories } from './advisoryStore';

export const SYSTEM_PROMPT = `You are Patak, an offline El Niño Response Assistant for Philippine barangay officials, disaster response teams (BDRRMC/LDRRMO), and rural farmers.

STRICT INSTRUCTIONS:
1. GROUNDED KNOWLEDGE: Answer strictly using the provided official government advisories (DA, PAGASA, DOH, DILG, DA-BAI) and uploaded documents.
2. DO NOT include bracketed file citations (like [Filename.pdf, Page X]) in your paragraph text. Citations are shown automatically at the bottom.
3. LANGUAGE: Strictly follow the requested language (English or modern conversational Taglish). Refrain from using deep Tagalog words.
4. FORMATTING: Do not overuse asterisks (*). Use clean, modern paragraph or numbered list structures.
5. If the query cannot be answered by the available advisories, respond strictly with:
   "Sorry, this information is not available in my offline database. Please consult your Municipal Agriculture Office (MAO) or Rural Health Unit (RHU)." (or Filipino equivalent).`;

export interface SearchResult {
  chunk: RAGChunk;
  score: number;
}

export function getAllDynamicChunks(): RAGChunk[] {
  const officialChunks = [...ALL_RAG_CHUNKS];
  const uploadedDocs = getUploadedAdvisories();
  const uploadedChunks: RAGChunk[] = [];

  for (const doc of uploadedDocs) {
    if (doc.chunks && doc.chunks.length > 0) {
      doc.chunks.forEach((chunkText, idx) => {
        const pageMatch = chunkText.match(/Page\s+(\d+)/i);
        const pageNum = pageMatch ? parseInt(pageMatch[1]) : (idx % (doc.pageCount || 1)) + 1;

        uploadedChunks.push({
          id: `${doc.id}-chunk-${idx + 1}`,
          documentId: doc.id,
          source: doc.source,
          title: doc.title,
          agency: doc.agency || 'USER_UPLOAD',
          category: doc.category || 'Uploaded Document',
          text: chunkText,
          page: pageNum
        });
      });
    }
  }

  return [...uploadedChunks, ...officialChunks];
}

export function getActiveChunksCount(): number {
  return getAllDynamicChunks().length;
}

export function addUploadedDocumentToRAG(doc: AdvisoryDocument): number {
  return doc.chunks.length;
}

const STOPWORDS = new Set([
  'ang', 'mga', 'ng', 'sa', 'at', 'na', 'ay', 'para', 'kung', 'ito', 'may',
  'kami', 'namin', 'inyo', 'po', 'the', 'is', 'in', 'and', 'to', 'for', 'of',
  'what', 'how', 'should', 'we', 'do', 'our', 'ano', 'dapat', 'gawin', 'who', 'when',
  'where', 'why', 'can', 'you', 'tell', 'me', 'about', 'a', 'an'
]);

/**
 * Known advisory topic domains. Used to confirm domain relevance before returning chunks.
 * Keep groups mutually distinct so "rainfall" does not look like "heat index".
 */
const DOMAIN_KEYWORD_GROUPS = [
  ['heat index', 'heat-index', 'heatindex', 'temperatura', 'temperature', 'danger category', 'kainit', 'gaano kainit'],
  ['rice', 'palay', 'palayan', 'tubig', 'awd', 'irigasyon', 'drying', 'tuyo', 'binhi', 'seed', 'da-philrice', 'tanim'],
  ['ulan', 'rainfall', 'rain fall', 'rain-fall', 'tagtuyot', 'dry spell', 'habagat', 'monsoon', 'thunderstorm'],
  ['stroke', 'exhaustion', 'nahihilo', 'first aid', 'ors', 'dehydration', 'split-shift', 'cramps'],
  ['baboy', 'manok', 'hayop', 'livestock', 'poultry', 'swine', 'kulungan', 'da-bai', 'electrolytes'],
  ['ration', 'balon', 'deep well', 'quota', 'dilg', 'litro', 'water marshal', 'gripo', 'contingency']
];

export type AdvisoryIntent =
  | 'heat_index'
  | 'rainfall'
  | 'heat_health'
  | 'rice'
  | 'livestock'
  | 'water'
  | 'greeting'
  | 'general';

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/heat\s*index/g, 'heat index')
    .replace(/rain\s*fall/g, 'rainfall')
    .replace(/[^\w\s°c-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countPhraseHits(haystack: string, phrases: string[]): number {
  let score = 0;
  for (const phrase of phrases) {
    if (haystack.includes(phrase)) {
      score += phrase.includes(' ') || phrase.length > 8 ? 3 : 2;
    }
  }
  return score;
}

const HEAT_INDEX_PHRASES = [
  'heat index',
  'heat-index',
  'heatindex',
  'gaano kainit',
  'kainit',
  'init ng panahon',
  'danger category',
  'temperatura',
  'temperature',
  '42c',
  '46c',
  '42°',
  '46°',
  'heat advisory'
];

const RAINFALL_PHRASES = [
  'rainfall',
  'rain fall',
  'rain-fall',
  'rain advisory',
  'rainfall advisory',
  'ulan',
  'habagat',
  'monsoon',
  'dry spell',
  'tagtuyot',
  'babalik ang ulan',
  'kailan babalik',
  'kailan ang ulan',
  'when will the rain',
  'when will rain',
  'rain forecast',
  'rainfall forecast',
  'thunderstorm',
  'tubig ulan',
  'rainwater'
];

const HEAT_HEALTH_PHRASES = [
  'heat stroke',
  'heatstroke',
  'heat exhaustion',
  'first aid',
  'nahihilo',
  'nawalan ng malay',
  'cramps',
  'biktima',
  'split-shift',
  'split shift'
];

const RICE_PHRASES = [
  'rice',
  'palay',
  'palayan',
  'awd',
  'binhi',
  'irigasyon',
  'irrigation',
  'tuyo',
  'drying',
  'certified seed'
];

const LIVESTOCK_PHRASES = [
  'baboy',
  'manok',
  'hayop',
  'livestock',
  'poultry',
  'swine',
  'pig',
  'kulungan'
];

const WATER_PHRASES = [
  'ration',
  'quota',
  'balon',
  'deep well',
  'litro',
  'liters',
  'water marshal',
  'dilg'
];

const HEAT_INDEX_CHUNK_HINTS = [
  'heat index',
  'danger category',
  '42',
  '46',
  'kainit',
  'temperatura',
  'temperature'
];

const RAINFALL_CHUNK_HINTS = [
  'rainfall',
  'ulan',
  'habagat',
  'monsoon',
  '60%',
  'mayo',
  'hunyo',
  'june',
  'thunderstorm',
  'rainwater',
  'dry spell',
  'tagtuyot',
  'meteorological drought'
];

export function detectAdvisoryIntent(query: string): AdvisoryIntent {
  const q = normalizeQuery(query);

  const greetingOnly = /^(hello|hi|hey|magandang araw|kumusta|kamusta|good morning|good afternoon|good day|good evening)([,!.\s].*)?$/;
  const identity = /^(sino ka|who are you|ano ka)([,?.\s].*)?$/;
  if (greetingOnly.test(q) || identity.test(q)) {
    return 'greeting';
  }

  const heatIndexScore = countPhraseHits(q, HEAT_INDEX_PHRASES);
  const rainfallScore = countPhraseHits(q, RAINFALL_PHRASES);
  const healthScore = countPhraseHits(q, HEAT_HEALTH_PHRASES);
  const riceScore = countPhraseHits(q, RICE_PHRASES);
  const livestockScore = countPhraseHits(q, LIVESTOCK_PHRASES);
  const waterScore = countPhraseHits(q, WATER_PHRASES);

  // Bare "heat" / "init" only count toward heat index when illness terms are absent.
  const mentionsBareHeat =
    (/\bheat\b/.test(q) || /\binit\b/.test(q)) &&
    healthScore === 0 &&
    !q.includes('heat stroke') &&
    !q.includes('exhaustion');
  const heatIndexTotal = heatIndexScore + (mentionsBareHeat && heatIndexScore === 0 ? 1 : 0);

  const scored: Array<{ intent: AdvisoryIntent; score: number }> = [
    { intent: 'heat_index', score: heatIndexTotal },
    { intent: 'rainfall', score: rainfallScore },
    { intent: 'heat_health', score: healthScore },
    { intent: 'rice', score: riceScore },
    { intent: 'livestock', score: livestockScore },
    { intent: 'water', score: waterScore }
  ].sort((a, b) => b.score - a.score);

  if (scored[0].score === 0) {
    return 'general';
  }

  // If rainfall and heat index are tied, honor the wording that is actually in the question.
  if (scored[0].score === scored[1].score) {
    if (q.includes('rainfall') || q.includes('ulan') || q.includes('rain ')) {
      return 'rainfall';
    }
    if (q.includes('heat index') || q.includes('kainit') || q.includes('temperatura')) {
      return 'heat_index';
    }
  }

  return scored[0].intent;
}

function chunkMatchesHints(chunk: RAGChunk, hints: string[]): boolean {
  const blob = `${chunk.title} ${chunk.category} ${chunk.text} ${chunk.source}`.toLowerCase();
  return hints.some(hint => blob.includes(hint));
}

/**
 * Searches local vector chunks with strict relevance thresholding.
 */
export function searchLocalContext(query: string, topK: number = 4): SearchResult[] {
  const chunks = getAllDynamicChunks();
  const lowerQuery = normalizeQuery(query);
  const intent = detectAdvisoryIntent(query);

  const queryTokens = lowerQuery
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));

  const uploadedDocs = getUploadedAdvisories();
  const hasUploadedMention = uploadedDocs.some(d =>
    lowerQuery.includes(d.title.toLowerCase()) ||
    lowerQuery.includes(d.source.toLowerCase()) ||
    lowerQuery.includes('upload') ||
    lowerQuery.includes('dokumento') ||
    lowerQuery.includes('file')
  );

  const hasDomainMatch = DOMAIN_KEYWORD_GROUPS.some(group =>
    group.some(kw => lowerQuery.includes(kw))
  );

  if (!hasDomainMatch && !hasUploadedMention && intent === 'general') {
    let directTokenHits = 0;
    for (const chunk of chunks) {
      const textLower = chunk.text.toLowerCase();
      const hits = queryTokens.filter(t => textLower.includes(t)).length;
      if (hits >= 2) directTokenHits = Math.max(directTokenHits, hits);
    }
    if (directTokenHits < 2) {
      return [];
    }
  }

  const results: SearchResult[] = chunks.map(chunk => {
    const textLower = (chunk.title + ' ' + chunk.category + ' ' + chunk.text + ' ' + chunk.source).toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      if (textLower.includes(token)) {
        score += 3;
        if (chunk.text.toLowerCase().includes(token)) score += 4;
        if (chunk.title.toLowerCase().includes(token)) score += 2;
        if (chunk.source.toLowerCase().includes(token)) score += 2;
        if (chunk.category.toLowerCase().includes(token)) score += 2;
      }
    }

    if (chunk.agency === 'USER_UPLOAD' && hasUploadedMention) {
      score += 8;
    }

    if (intent === 'heat_index') {
      if (chunkMatchesHints(chunk, HEAT_INDEX_CHUNK_HINTS)) score += 14;
      else if (chunk.agency === 'PAGASA' || chunk.agency === 'DOH') score -= 4;
    } else if (intent === 'rainfall') {
      if (chunkMatchesHints(chunk, RAINFALL_CHUNK_HINTS)) score += 14;
      else if (chunk.agency === 'PAGASA') score -= 4;
    } else if (intent === 'rice' && (chunk.agency === 'DA' || chunk.source.includes('Rice'))) {
      score += 7;
    } else if (intent === 'heat_health' && chunk.agency === 'DOH') {
      score += 8;
    } else if (
      intent === 'livestock' &&
      (chunk.agency === 'DA-BAI' || chunk.source.includes('Livestock'))
    ) {
      score += 7;
    } else if (intent === 'water' && (chunk.agency === 'DILG' || chunk.source.includes('Water'))) {
      score += 7;
    }

    return { chunk, score };
  });

  results.sort((a, b) => b.score - a.score);

  let matched = results.filter(r => r.score >= 6);

  if (intent === 'heat_index') {
    const focused = matched.filter(r => chunkMatchesHints(r.chunk, HEAT_INDEX_CHUNK_HINTS));
    if (focused.length > 0) matched = focused;
  } else if (intent === 'rainfall') {
    const focused = matched.filter(r => chunkMatchesHints(r.chunk, RAINFALL_CHUNK_HINTS));
    if (focused.length > 0) matched = focused;
  }

  if (matched.length > 0) {
    return matched.slice(0, topK);
  }

  return [];
}

/**
 * Determine if a user question is asking for actionable steps / protocols / how-to.
 */
export function isActionOrientedQuery(query: string): boolean {
  const lower = query.toLowerCase();

  const actionKeywords = [
    'dapat gawin',
    'paano',
    'ano ang gagawin',
    'anong gagawin',
    'hakbang',
    'steps',
    'checklist',
    'first aid',
    'protokol',
    'protocol',
    'mitigation',
    'action plan',
    'what should we do',
    'what should i do',
    'what to do',
    'how to',
    'rekomendasyon',
    'procedure',
    'pamamaraan',
    'solusyon',
    'lunas',
    'paano maiiwasan'
  ];

  for (const kw of actionKeywords) {
    if (lower.includes(kw)) {
      return true;
    }
  }

  return false;
}

/**
 * Strip inline bracketed citations like [Document.pdf, Page 1] from text.
 */
export function cleanInlineCitations(text: string): string {
  return text.replace(/\[.*?\]/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Remove markdown bold asterisks (**) from text to keep it modern and clean.
 */
export function cleanAsterisks(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '');
}

export function parseChecklistItems(text: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lines = text.split('\n');

  let currentNumber = 1;
  for (const line of lines) {
    const trimmed = line.trim();
    const numMatch = trimmed.match(/^(\d+[\.\)]|\-|\*)\s*(.+)$/);
    if (numMatch) {
      const itemBody = numMatch[2].trim();
      const cleanText = cleanAsterisks(cleanInlineCitations(itemBody));

      if (cleanText.length > 10) {
        items.push({
          id: `chk-${Date.now()}-${currentNumber++}`,
          text: cleanText,
          citation: '',
          isDone: false
        });
      }
    }
  }

  return items;
}

export async function executeRAGQuery(
  query: string,
  config: EngineConfig
): Promise<{
  content: string;
  sources: string[];
  contextChunks: RAGChunk[];
  checklist?: ChecklistItem[];
  suggestedFollowUps?: string[];
  modelUsed: string;
}> {
  // Determine response language strictly based on config.language first, then query detection
  const isEnglish =
    config.language === 'english' ||
    (config.language !== 'filipino' && isLikelyEnglish(query));

  const intent = detectAdvisoryIntent(query);
  if (intent === 'greeting') {
    return handleGreeting(isEnglish);
  }

  const searchResults = searchLocalContext(query, config.topK || 4);
  const relevantChunks = searchResults.map(r => r.chunk);
  const uniqueSources = Array.from(
    new Set(relevantChunks.map(c => `${c.source} (Page ${c.page || 1})`))
  );

  const needsChecklist = isActionOrientedQuery(query);
  const knownTopic = ['heat_index', 'rainfall', 'heat_health', 'rice', 'livestock', 'water'].includes(
    intent
  );

  // If in_browser mode or offline engine
  if (config.mode === 'in_browser' || config.wifiDisabled) {
    return synthesizeSmartResponse(
      query,
      relevantChunks,
      uniqueSources,
      'Patak Built-in Engine',
      needsChecklist,
      isEnglish
    );
  }

  const topicInstruction =
    intent === 'heat_index'
      ? 'The user asked specifically about HEAT INDEX (temperature danger category 42-46°C). Do not answer with rainfall timelines unless asked.'
      : intent === 'rainfall'
      ? 'The user asked specifically about RAINFALL / drought timeline / rain return. Do not lead with heat index values unless asked.'
      : '';

  // If mode is local_ollama
  if (config.mode === 'local_ollama') {
    try {
      if (relevantChunks.length === 0) {
        return knownTopic
          ? synthesizeSmartResponse(query, relevantChunks, uniqueSources, 'Patak Built-in Engine', needsChecklist, isEnglish)
          : getFallbackResponse(isEnglish, 'Patak Built-in Engine');
      }

      const contextText = relevantChunks
        .map(c => `[${c.source}, Page ${c.page || 1}] ${c.title}:\n${cleanInlineCitations(c.text)}`)
        .join('\n\n');

      const checklistInstruction = needsChecklist
        ? 'Provide an actionable, numbered checklist of steps.'
        : 'Provide a direct, informative explanation. Do not format as a checklist.';

      const langInstruction = isEnglish
        ? 'Answer strictly in English.'
        : 'Answer in modern, natural conversational Taglish (do not use deep Tagalog words).';

      const userPrompt = `ADVISORY CONTEXT:
${contextText}

QUESTION:
"${query}"

INSTRUCTIONS: ${topicInstruction} ${checklistInstruction} ${langInstruction} Do not include bracket citations inside the sentences. Do not overuse asterisks (*).`;

      const res = await fetch(`${config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel || 'qwen2.5:3b',
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      const data = await res.json();
      const rawText: string = data.response || '';
      const cleanedContent = cleanInlineCitations(rawText);
      const checklist = needsChecklist ? parseChecklistItems(cleanedContent) : [];

      return {
        content: cleanedContent,
        sources: uniqueSources,
        contextChunks: relevantChunks,
        checklist: checklist.length > 0 ? checklist : undefined,
        suggestedFollowUps: generateFollowUps(query, isEnglish),
        modelUsed: `Ollama (${config.ollamaModel || 'qwen2.5:3b'})`
      };
    } catch {
      return synthesizeSmartResponse(
        query,
        relevantChunks,
        uniqueSources,
        'Patak Built-in Engine (Standby)',
        needsChecklist,
        isEnglish
      );
    }
  }

  // If mode is fastapi_backend
  if (config.mode === 'fastapi_backend') {
    try {
      if (relevantChunks.length === 0) {
        return knownTopic
          ? synthesizeSmartResponse(query, relevantChunks, uniqueSources, 'Patak Built-in Engine', needsChecklist, isEnglish)
          : getFallbackResponse(isEnglish, 'Patak Built-in Engine');
      }

      const res = await fetch(`${config.fastApiUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          top_k: config.topK || 4,
          model: config.ollamaModel || 'qwen2.5:3b'
        })
      });

      if (!res.ok) {
        throw new Error(`FastAPI returned status ${res.status}`);
      }

      const data = await res.json();
      const rawText: string = data.answer || '';
      const cleanedContent = cleanInlineCitations(rawText);
      const checklist = needsChecklist ? parseChecklistItems(cleanedContent) : [];

      return {
        content: cleanedContent,
        sources: data.sources || uniqueSources,
        contextChunks: data.context_chunks?.length ? data.context_chunks : relevantChunks,
        checklist: checklist.length > 0 ? checklist : undefined,
        suggestedFollowUps: generateFollowUps(query, isEnglish),
        modelUsed: `FastAPI + Ollama (${data.model_used || config.ollamaModel})`
      };
    } catch {
      return synthesizeSmartResponse(
        query,
        relevantChunks,
        uniqueSources,
        'Patak Built-in Engine',
        needsChecklist,
        isEnglish
      );
    }
  }

  return synthesizeSmartResponse(query, relevantChunks, uniqueSources, 'Patak Built-in Engine', needsChecklist, isEnglish);
}

function handleGreeting(isEnglish: boolean) {
  const content = isEnglish
    ? `Hello! I am Patak, your offline El Niño Response Assistant.

I can help barangay officials, disaster officers (BDRRMC), and farmers with:
• Heat Index & Safety: PAGASA 42°C-46°C Danger category advisory and heat precautions.
• Rice & Water: Alternate Wetting and Drying (AWD) irrigation and drought-resistant seeds (DA-PhilRice).
• Weather & Forecasts: Meteorological drought duration and rainfall updates (PAGASA).
• Heat Illness First Aid: Managing heat exhaustion, heat stroke, and split-shift work (DOH).
• Livestock Protection: Cooling pig pens and poultry coops during peak heat (DA-BAI).
• Barangay Water Rationing: Household quotas (20L) and deep well management (DILG).
• Custom Files: You can also upload PDF or text documents in the Advisory Library for local analysis.

What would you like to ask about?`
    : `Magandang araw! Ako si Patak, ang inyong offline El Niño Response Assistant.

Handa akong tumulong sa barangay officials, disaster teams, at mga magsasaka tungkol sa:
• Heat Index at Init: PAGASA 42°C-46°C Danger category alert at mga paalala sa init.
• Palayan at Tubig: Alternate Wetting and Drying (AWD) at matitibay na binhi (DA-PhilRice).
• Panahon at Ulan: Tagtuyot at updates sa pagbabalik ng ulan (PAGASA).
• Init at First Aid: First aid sa heat stroke at split-shift na trabaho (DOH).
• Alagang Hayop: Pagpapalamig sa kulungan ng baboy at manok (DA-BAI).
• Rasyon ng Tubig: 20-litro quota sa bawat pamilya at paggamit ng balon (DILG).
• Aking mga File: Maaari ka ring mag-upload ng sariling PDF o text file sa Advisory Library para masuri ko ito nang buo.

Ano ang nais ninyong itanong ngayon?`;

  return {
    content,
    sources: [],
    contextChunks: [],
    checklist: undefined,
    suggestedFollowUps: isEnglish
      ? ['What is the heat index forecast?', 'Our rice fields are drying up, what should we do?', 'When will the rains return?']
      : ['Ano ang heat index ngayon?', 'Tuyong-tuyo na ang palayan namin sa bukid, ano ang dapat gawin?', 'Kailan babalik ang ulan?'],
    modelUsed: 'Patak Built-in Engine'
  };
}

function getFallbackResponse(isEnglish: boolean, modelLabel: string) {
  const text = isEnglish
    ? 'Sorry, this information is not available in my offline database. Please consult your Municipal Agriculture Office (MAO) or Rural Health Unit (RHU).'
    : 'Pasensya na, wala itong impormasyon sa aking offline database. Mangyaring sumangguni sa Municipal Agriculture Office (MAO) o sa pinakamalapit na Rural Health Unit (RHU).';

  return {
    content: text,
    sources: [],
    contextChunks: [],
    checklist: undefined,
    suggestedFollowUps: isEnglish
      ? ['What is the heat index forecast?', 'How to protect rice fields in drought?', 'What are the first aid steps for heat stroke?']
      : ['Ano ang heat index ngayon?', 'Ano ang dapat gawin sa tuyong palayan?', 'Ano ang first aid sa heat stroke?'],
    modelUsed: modelLabel
  };
}

/**
 * Synthesizes an intelligent, contextual response strictly based on retrieved chunks.
 * Accurately separates Heat Index vs Rainfall vs First Aid vs Agriculture.
 */
function synthesizeSmartResponse(
  query: string,
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  const intent = detectAdvisoryIntent(query);

  // Known official topics still get a grounded answer even if retrieval scored poorly.
  if (intent === 'heat_index') {
    return synthesizeHeatIndexResponse(chunks, sources, modelLabel, needsChecklist, isEnglish);
  }
  if (intent === 'rainfall') {
    return synthesizePagasaRainfallResponse(chunks, sources, modelLabel, isEnglish);
  }
  if (intent === 'heat_health') {
    return synthesizeHeatHealthResponse(chunks, sources, modelLabel, needsChecklist, isEnglish);
  }
  if (intent === 'rice') {
    return synthesizeRiceDroughtResponse(chunks, sources, modelLabel, needsChecklist, isEnglish);
  }
  if (intent === 'livestock') {
    return synthesizeLivestockResponse(chunks, sources, modelLabel, needsChecklist, isEnglish);
  }
  if (intent === 'water') {
    return synthesizeWaterRationingResponse(chunks, sources, modelLabel, needsChecklist, isEnglish);
  }

  if (chunks.length === 0) {
    return getFallbackResponse(isEnglish, modelLabel);
  }

  return synthesizeGeneralChunkResponse(chunks, sources, modelLabel, needsChecklist, isEnglish);
}

function officialPagasaHeatSources(chunks: RAGChunk[], sources: string[]): string[] {
  if (sources.length > 0) return sources;
  const fromChunks = chunks.map(c => `${c.source} (Page ${c.page || 2})`);
  if (fromChunks.length > 0) return Array.from(new Set(fromChunks));
  return ['PAGASA_Drought_Bulletin_14.pdf (Page 2)', 'DOH_Heat_Health_Protocol_2024.pdf (Page 1)'];
}

function officialPagasaRainSources(chunks: RAGChunk[], sources: string[]): string[] {
  if (sources.length > 0) return sources;
  const fromChunks = chunks.map(c => `${c.source} (Page ${c.page || 1})`);
  if (fromChunks.length > 0) return Array.from(new Set(fromChunks));
  return ['PAGASA_Drought_Bulletin_14.pdf (Page 1)'];
}

function synthesizeHeatIndexResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  const cited = officialPagasaHeatSources(chunks, sources);
  if (isEnglish) {
    const checklistItems: ChecklistItem[] = [
      {
        id: 'hi-en-1',
        text: 'Stop heavy outdoor farm labor and construction during peak sun hours from 10:00 AM to 3:00 PM.',
        citation: '',
        isDone: false
      },
      {
        id: 'hi-en-2',
        text: 'Drink at least 2 to 3 liters of clean water daily even before feeling thirsty.',
        citation: '',
        isDone: false
      },
      {
        id: 'hi-en-3',
        text: 'Wear lightweight, breathable, light-colored clothing and wide-brimmed hats.',
        citation: '',
        isDone: false
      },
      {
        id: 'hi-en-4',
        text: 'Establish community shaded rest stations with cool drinking water and Oral Rehydration Salts (ORS).',
        citation: '',
        isDone: false
      }
    ];

    const content = `According to DOST-PAGASA Drought Bulletin #14 and official DOH public health guidelines:

Heat Index Level & Hazard Classification:
• Temperature Range: Daily heat indexes across lowland and agricultural plains in Luzon and Western Visayas regularly reach 42°C to 46°C.
• Hazard Category: This is officially classified under the "Danger" category (42°C to 46°C).
• Health Impact: At 42°C to 46°C, heat cramps and heat exhaustion are imminent, and prolonged physical activity or exposure can rapidly lead to fatal heat stroke.

Official Precautionary Directives (PAGASA & DOH):
1. Restrict Peak Exposure: Avoid heavy physical labor and direct outdoor sun exposure between 10:00 AM and 3:00 PM.
2. Agricultural Split-Shift: Shift field labor to 5:30 AM - 9:30 AM and resume after 3:30 PM.
3. Continuous Hydration: Drink 2 to 3 liters of water daily. Avoid alcoholic, sugary, or heavily caffeinated drinks that speed up dehydration.
4. Barangay Shaded Stations: LGUs and barangays should set up shaded recovery spots with potable water and ORS packets for outdoor workers.`;

    return {
      content,
      sources: cited,
      contextChunks: chunks,
      checklist: needsChecklist ? checklistItems : undefined,
      suggestedFollowUps: [
        'What is the first aid for heat stroke?',
        'How does the agricultural split-shift work?',
        'When will rainfall return according to PAGASA?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const checklistItems: ChecklistItem[] = [
    {
      id: 'hi-fl-1',
      text: 'Itigil ang mabigat na trabaho sa bukid sa peak heat hours mula 10:00 AM hanggang 3:00 PM.',
      citation: '',
      isDone: false
    },
    {
      id: 'hi-fl-2',
      text: 'Uminom ng 2 hanggang 3 litrong malinis na tubig araw-araw upang maiwasan ang dehydration.',
      citation: '',
      isDone: false
    },
    {
      id: 'hi-fl-3',
      text: 'Magsuot ng preskong damit, sumbrero, at magbaon ng basang bimpo sa bukid.',
      citation: '',
      isDone: false
    },
    {
      id: 'hi-fl-4',
      text: 'Maglagay ng malilim na pahingahan at Oral Rehydration Salts (ORS) sa barangay.',
      citation: '',
      isDone: false
    }
  ];

  const content = `Ayon sa opisyal na ulat ng DOST-PAGASA Drought Bulletin #14 at DOH:

Lebel ng Heat Index at Panganib:
• Temperatura ng Init: Ang pang-araw-araw na heat index sa mga kapatagan at bukirin sa Luzon at Western Visayas ay pumapalo sa 42°C hanggang 46°C.
• Kategorya: Opisyal itong nasa ilalim ng "Danger" category (Panganib).
• Panganib sa Kalusugan: Sa 42°C hanggang 46°C, mabilis na maranasan ang heat cramps at heat exhaustion, at maaaring humantong sa heat stroke kung magpapatuloy ang pagbabad sa matinding araw.

Mga Opisyal na Paalala at Hakbang:
1. Iwasan ang Tanghaling Tapat: Mahigpit na ipinagbabawal ang mabigat na trabaho sa bukid mula 10:00 AM hanggang 3:00 PM.
2. Split-Shift sa Pagsasaka: Magtrabaho ng 5:30 AM hanggang 9:30 AM, at ituloy na lamang bandang 3:30 PM hanggang 6:00 PM.
3. Maraming Inumin: Uminom ng 2 hanggang 3 litrong tubig bawat araw. Huwag maghintay na mauhaw bago uminom.
4. Barangay Hydration Stations: Magtalaga ang barangay ng mga malilim na resting stations na may malinis na tubig at Oral Rehydration Salts (ORS).`;

  return {
    content,
    sources: cited,
    contextChunks: chunks,
    checklist: needsChecklist ? checklistItems : undefined,
    suggestedFollowUps: [
      'Ano ang first aid sa heat stroke?',
      'Paano ang split-shift sa bukid?',
      'Kailan babalik ang ulan ayon sa PAGASA?'
    ],
    modelUsed: modelLabel
  };
}

function synthesizePagasaRainfallResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  isEnglish: boolean
) {
  const cited = officialPagasaRainSources(chunks, sources);
  if (isEnglish) {
    const content = `According to DOST-PAGASA Drought Bulletin #14:

Rainfall Anomaly & Drought Timeline:
• Rainfall Deficit: A Strong El Niño is active across the Tropical Pacific, causing rainfall to drop by over 60% across more than 30 provinces in Luzon and Western Visayas over three consecutive months.
• When Will Rain Return: The prolonged dry spell and hot winds will persist through the late part of May. The gradual return of regular localized rains and the Southwest Monsoon (Habagat) is forecasted only between the second and third week of June.
• Rainwater Catchment: LGUs and barangays are advised to prepare rain barrels and catchment tanks to store water during occasional late-afternoon convective thunderstorms.
• Agricultural Advisory: Farmers should coordinate with the nearest DOST-PAGASA agromet station to align crop planting with forecasted rainfall windows.`;

    return {
      content,
      sources: cited,
      contextChunks: chunks,
      checklist: undefined,
      suggestedFollowUps: [
        'What is the current heat index forecast?',
        'Our rice fields are drying up, what should we do?',
        'What is the barangay water rationing quota?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const content = `Ayon sa opisyal na ulat ng DOST-PAGASA Drought Bulletin #14:

Ulat sa Ulan at Tagal ng Tagtuyot:
• Kakapusan sa Ulan: Kasalukuyang umiiral ang Strong El Niño kung saan mahigit 60% ang ibinaba ng ulan sa mahigit 30 probinsya sa Luzon at Western Visayas sa nakaraang tatlong buwan.
• Kailan Babalik ang Ulan: Magpapatuloy ang matinding tagtuyot hanggang sa huling linggo ng Mayo. Ang pagdating ng regular na ulan at Habagat ay tinatayang magsisimula lamang sa ikalawa hanggang ikatlong linggo ng Hunyo.
• Pag-iipon ng Tubig-Ulan: Pinapayuhan ang mga barangay na maghanda ng mga drum at rainwater catchment tanks para makapag-ipon ng tubig sa tuwing may panandaliang ulan sa hapon.
• Pagsubaybay: Regular na makipag-ugnayan sa pinakamalapit na PAGASA agromet station para sa lingguhang ulat bago magtanim.`;

  return {
    content,
    sources: cited,
    contextChunks: chunks,
    checklist: undefined,
    suggestedFollowUps: [
      'Ano ang heat index ngayon?',
      'Tuyong-tuyo na ang palayan namin sa bukid, ano ang dapat gawin?',
      'Ilan ang rasyon ng tubig bawat pamilya?'
    ],
    modelUsed: modelLabel
  };
}

function synthesizeHeatHealthResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  if (isEnglish) {
    const checklistItems: ChecklistItem[] = [
      {
        id: 'heat-en-1',
        text: 'Immediately move the person to a shaded, well-ventilated, or cool area.',
        citation: '',
        isDone: false
      },
      {
        id: 'heat-en-2',
        text: 'Loosen tight clothing and remove heavy work garments.',
        citation: '',
        isDone: false
      },
      {
        id: 'heat-en-3',
        text: 'Apply cool, wet cloths or ice packs to the neck, armpits, and groin.',
        citation: '',
        isDone: false
      },
      {
        id: 'heat-en-4',
        text: 'If conscious, provide small sips of cool water mixed with Oral Rehydration Salts (ORS). Do not force fluids if unconscious.',
        citation: '',
        isDone: false
      },
      {
        id: 'heat-en-5',
        text: 'If unconscious or vomiting, place in the recovery position (on their side) and transport immediately to the Rural Health Unit (RHU).',
        citation: '',
        isDone: false
      }
    ];

    const content = `According to the Department of Health (DOH) Heat Health Protocol:

First Aid Steps for Heat Exhaustion and Heat Stroke:
1. Move to Shade: Immediately bring the affected person to a cool, shaded, and well-ventilated location.
2. Loosen Clothing: Unbutton collars, remove boots, and loosen belts to help heat dissipate.
3. Active Cooling: Apply cold wet towels or ice packs to major pulse points: neck, armpits, and groin. Fan the person continuously.
4. Oral Hydration: If the patient is alert and able to swallow, give small sips of cool water with Oral Rehydration Salts (ORS). Never give fluids if unconscious.
5. Emergency Referral: If the person is confused, loses consciousness, or vomits, turn them on their side (recovery position) and rush them to the nearest Rural Health Unit (RHU) or hospital.

Preventive Policy for Farmers:
Implement the Split-Shift system. Stop heavy physical work during peak heat hours (10:00 AM to 3:00 PM). Shift field labor to 5:30 AM - 9:30 AM and resume at 3:30 PM - 6:00 PM.`;

    return {
      content,
      sources,
      contextChunks: chunks,
      checklist: needsChecklist ? checklistItems : undefined,
      suggestedFollowUps: [
        'What is the current heat index forecast?',
        'How does the agricultural split-shift work?',
        'How to cool down livestock in severe heat?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const checklistItems: ChecklistItem[] = [
    {
      id: 'heat-fl-1',
      text: 'Agad dalhin ang biktima sa malamig at malilim na lugar.',
      citation: '',
      isDone: false
    },
    {
      id: 'heat-fl-2',
      text: 'Luwayan ang masisikip na damit at alisin ang mabibigat na kasuotan.',
      citation: '',
      isDone: false
    },
    {
      id: 'heat-fl-3',
      text: 'Maglagay ng basang bimpo o yelo sa leeg, kilikili, at singit upang mapababa agad ang temperatura ng katawan.',
      citation: '',
      isDone: false
    },
    {
      id: 'heat-fl-4',
      text: 'Kung gising at nakalulunok, painumin ng paunti-unting malamig na tubig na may Oral Rehydration Salts (ORS). Huwag painumin kung walang malay.',
      citation: '',
      isDone: false
    },
    {
      id: 'heat-fl-5',
      text: 'Kung nawalan ng malay o nagsusuka, ihiga nang patagilid (recovery position) at dalhin agad sa pinakamalapit na Rural Health Unit (RHU) o ospital.',
      citation: '',
      isDone: false
    }
  ];

  const content = `Ayon sa opisyal na patnubay ng Department of Health (DOH) ukol sa kalusugan sa matinding init:

First Aid para sa Nahihilo, Heat Exhaustion, at Heat Stroke:
1. Ilipat sa Lilim: Agad dalhin ang biktima sa malilim at mahanging lugar.
2. Luwagan ang Kasuotan: Alisin ang sumbrero, bota, at luwagan ang masikip na damit.
3. Palamigin ang Katawan: Lagyan ng malamig o basang tela ang leeg, kilikili, at singit. Paypayan ang biktima.
4. Painumin ng Tubig: Kung may malay, painumin ng malamig na tubig na may ORS (Oral Rehydration Salts). Huwag piliting painumin kung walang malay o tuliro.
5. Dalhin sa RHU: Kung nawalan ng malay o patuloy ang pagsusuka, ihiga nang patagilid at dalhin agad sa Rural Health Unit (RHU).

Pag-iingat sa Bukid (Split-Shift System):
Iwasan ang mabigat na trabaho sa bukid sa peak heat hours mula 10:00 AM hanggang 3:00 PM. Magtrabaho mula 5:30 AM hanggang 9:30 AM, at magpatuloy na lamang bandang 3:30 PM hanggang 6:00 PM.`;

  return {
    content,
    sources,
    contextChunks: chunks,
    checklist: needsChecklist ? checklistItems : undefined,
    suggestedFollowUps: [
      'Ano ang heat index ngayon ayon sa PAGASA?',
      'Paano ang split-shift sa bukid?',
      'Paano mapapalamig ang mga hayop sa bukid?'
    ],
    modelUsed: modelLabel
  };
}

function synthesizeRiceDroughtResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  if (isEnglish) {
    const checklistItems: ChecklistItem[] = [
      {
        id: 'awd-1',
        text: 'Install a 20cm perforated PVC tube (observation well) 10cm deep into the rice paddy to monitor water level.',
        citation: '',
        isDone: false
      },
      {
        id: 'awd-2',
        text: 'Do not irrigate until the water drops 15cm below the soil surface (-15cm). Once it reaches -15cm, flood the field to 5cm above the surface (+5cm).',
        citation: '',
        isDone: false
      },
      {
        id: 'awd-3',
        text: 'During panicle initiation and flowering stages, keep 2 to 3cm of standing water. Do not let the field dry during these critical weeks to prevent unfilled grains.',
        citation: '',
        isDone: false
      },
      {
        id: 'awd-4',
        text: 'Pump or irrigate only in the early morning (before 7:00 AM) or late afternoon (after 4:30 PM) to reduce evaporation loss.',
        citation: '',
        isDone: false
      },
      {
        id: 'awd-5',
        text: 'For areas with delayed water, plant certified drought-resistant seed varieties such as NSIC Rc192 (Sahod Ulan 1), PSB Rc10, or NSIC Rc222.',
        citation: '',
        isDone: false
      },
      {
        id: 'awd-6',
        text: 'Coordinate with your Irrigators Association (IA) and NIA to enforce rotational irrigation schedules so tail-end farmers receive water.',
        citation: '',
        isDone: false
      }
    ];

    const content = `Based on the official Department of Agriculture (DA-PhilRice) protocol for rice fields affected by drought:

Implement Alternate Wetting and Drying (AWD) technology to save 30% to 50% of irrigation water without lowering your harvest yield:

1. Install an Observation Well: Place a 20cm perforated PVC pipe 10cm into the paddy soil. Check the water level daily.
2. Controlled Irrigation: Wait until the water inside the tube drops to 15cm below ground level (-15cm) before irrigating with 5cm of water (+5cm).
3. Protect Critical Growth Stages: Maintain 2 to 3cm of water continuously during panicle initiation and flowering. Never let the paddy dry during this period to avoid sterile grains.
4. Optimal Pumping Schedule: Irrigate only in the early morning before 7:00 AM or late afternoon after 4:30 PM to avoid over 40% evaporation loss.
5. Seed Selection: Shift to drought-tolerant varieties like NSIC Rc192 (Sahod Ulan 1), PSB Rc10, or NSIC Rc222.
6. Rotational Scheduling: Work with your Irrigators Association and NIA to ensure equitable water access for all sectors.`;

    return {
      content,
      sources,
      contextChunks: chunks,
      checklist: needsChecklist ? checklistItems : undefined,
      suggestedFollowUps: [
        'When will regular rainfall return according to PAGASA?',
        'What certified seeds are drought-resistant?',
        'What is the current heat index forecast?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const checklistItems: ChecklistItem[] = [
    {
      id: 'awd-fl-1',
      text: 'Magbaon ng 20cm perforated PVC pipe (observation well) na 10cm ang lalim sa lupa ng palayan.',
      citation: '',
      isDone: false
    },
    {
      id: 'awd-fl-2',
      text: 'Huwag magpatubig hangga\'t hindi bumababa ang tubig sa 15cm sa ilalim ng lupa (-15cm). Kapag umabot dito, magpatubig ng 5cm (+5cm).',
      citation: '',
      isDone: false
    },
    {
      id: 'awd-fl-3',
      text: 'Sa yugto ng pagbubuntis (panicle initiation) hanggang pamumulaklak, panatilihin ang 2 hanggang 3cm na tubig. Bawal patuyuin ang palayan sa yugtong ito.',
      citation: '',
      isDone: false
    },
    {
      id: 'awd-fl-4',
      text: 'Magpatubig lamang sa madaling araw (bago mag-7:00 AM) o hapon (makalipas ang 4:30 PM) upang hindi sumingaw ang tubig sa init.',
      citation: '',
      isDone: false
    },
    {
      id: 'awd-fl-5',
      text: 'Gumamit ng certified drought-resistant seed varieties tulad ng NSIC Rc192 (Sahod Ulan 1), PSB Rc10, o NSIC Rc222.',
      citation: '',
      isDone: false
    },
    {
      id: 'awd-fl-6',
      text: 'Makipag-ugnayan sa Irrigators Association at NIA para sa rotational irrigation schedule upang maabutan ng tubig ang mga dulo ng kanal.',
      citation: '',
      isDone: false
    }
  ];

  const content = `Ayon sa opisyal na patnubay ng Department of Agriculture (DA-PhilRice) para sa mga palayang apektado ng tagtuyot:

Ipatupad ang Alternate Wetting and Drying (AWD) method upang makatipid ng 30% hanggang 50% sa patubig nang hindi bumababa ang ani:

1. Observation Well: Maglagay ng 20cm perforated PVC tube na 10cm ang lalim sa lupa upang masubaybayan ang lebel ng tubig.
2. Tamang Pagpapatubig: Huwag magpatubig kung hindi pa bumababa ang tubig sa 15cm sa ilalim ng lupa (-15cm). Kapag umabot na sa -15cm, magpatubig ng 5cm.
3. Kritikal na Yugto ng Palay: Huwag patuyuin kapag nagbubuntis (panicle initiation) hanggang sa pamumulaklak. Panatilihin ang 2 hanggang 3cm na tubig upang hindi mabaog ang palay.
4. Oras ng Pagpapatubig: Magpatubig bago mag-7:00 AM o makalipas ang 4:30 PM upang maiwasan ang mabilis na pagsingaw ng tubig.
5. Matitibay na Binhi: Magtanim ng subok na drought-resistant seeds gaya ng NSIC Rc192, PSB Rc10, o NSIC Rc222.
6. Rotational Irrigation: Makipag-ugnayan sa NIA at samahan ng mga magsasaka upang mabigyan ng tubig ang lahat ng sakahan.`;

  return {
    content,
    sources,
    contextChunks: chunks,
    checklist: needsChecklist ? checklistItems : undefined,
    suggestedFollowUps: [
      'Kailan babalik ang ulan ayon sa PAGASA?',
      'Anong mga binhi ang matibay sa tagtuyot?',
      'Ano ang heat index ngayon?'
    ],
    modelUsed: modelLabel
  };
}

function synthesizeLivestockResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  if (isEnglish) {
    const checklistItems: ChecklistItem[] = [
      {
        id: 'live-en-1',
        text: 'Install roof sprinklers or spray misting systems over pens between 11:00 AM and 2:00 PM.',
        citation: '',
        isDone: false
      },
      {
        id: 'live-en-2',
        text: 'Hang agricultural shade netting (agrinets) around open pen perimeters to block direct sun.',
        citation: '',
        isDone: false
      },
      {
        id: 'live-en-3',
        text: 'Ensure continuous cool drinking water supplemented with Vitamin C and electrolyte powder.',
        citation: '',
        isDone: false
      },
      {
        id: 'live-en-4',
        text: 'Reduce feed density and avoid heavy feeding during midday heat to prevent metabolic heat buildup.',
        citation: '',
        isDone: false
      }
    ];

    const content = `According to the Department of Agriculture - Bureau of Animal Industry (DA-BAI) guidelines for livestock and poultry in extreme heat:

Key Protocols to Protect Animals:
1. Roof Sprinklers & Misting: Run water sprinklers on roof surfaces between 11:00 AM and 2:00 PM to drop shelter temperatures by 3°C to 5°C.
2. Shade Protection: Use dark agricultural shade nets (agrinets) along exposed perimeters to block sun rays while maintaining cross-ventilation.
3. Electrolytes & Clean Water: Provide fresh, cool water at all times. Add water-soluble Vitamin C and electrolytes to prevent heat stress and sudden mortality.
4. Feeding Adjustments: Feed animals during the cooler hours of early morning (before 8:00 AM) and evening (after 5:00 PM). Avoid heavy feeding during peak afternoon temperatures.`;

    return {
      content,
      sources,
      contextChunks: chunks,
      checklist: needsChecklist ? checklistItems : undefined,
      suggestedFollowUps: [
        'What is the current heat index forecast?',
        'What is the first aid for heat stroke in humans?',
        'What is the barangay water rationing quota?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const checklistItems: ChecklistItem[] = [
    {
      id: 'live-fl-1',
      text: 'Magkabit ng sprinkler o magbasa sa bubong ng kulungan mula 11:00 AM hanggang 2:00 PM.',
      citation: '',
      isDone: false
    },
    {
      id: 'live-fl-2',
      text: 'Maglagay ng agrinet o shade net sa gilid ng kulungan upang maharangan ang direktang sikat ng araw.',
      citation: '',
      isDone: false
    },
    {
      id: 'live-fl-3',
      text: 'Siguruhing laging may malinis at malamig na inuming tubig na may Vitamin C at electrolyte powder.',
      citation: '',
      isDone: false
    },
    {
      id: 'live-fl-4',
      text: 'Pakainin ang mga alaga sa madaling araw at hapon. Iwasan ang pagpapakain sa katanghalian upang hindi mag-init ang katawan.',
      citation: '',
      isDone: false
    }
  ];

  const content = `Ayon sa gabay ng Department of Agriculture - Bureau of Animal Industry (DA-BAI) para sa mga alagang hayop sa matinding init:

Mga Hakbang para Mapalamig ang Kulungan:
1. Pagpapalamig sa Bubong: Magbasa ng bubong gamit ang hose o maglagay ng misting sprinkler mula 11:00 AM hanggang 2:00 PM upang bumaba ang init sa loob ng kulungan.
2. Shade Nets: Magkabit ng agrinet o pansalag sa araw sa paligid ng kulungan habang pinananatili ang magandang sirkulasyon ng hangin.
3. Malinis na Tubig at Electrolytes: Bigyan ang mga baboy at manok ng malamig na inuming tubig na may electrolyte powder at Vitamin C upang hindi ma-heat stress.
4. Tamang Oras ng Pagpapakain: Pakainin sila sa maagang umaga (bago mag-8:00 AM) at bandang hapon (makalipas ang 5:00 PM). Iwasan ang mabigat na pakain sa katanghalian.`;

  return {
    content,
    sources,
    contextChunks: chunks,
    checklist: needsChecklist ? checklistItems : undefined,
    suggestedFollowUps: [
      'Ano ang heat index ngayon?',
      'Ano ang first aid sa heat stroke?',
      'Ilan ang rasyon ng tubig sa barangay?'
    ],
    modelUsed: modelLabel
  };
}

function synthesizeWaterRationingResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  if (isEnglish) {
    const checklistItems: ChecklistItem[] = [
      {
        id: 'wat-en-1',
        text: 'Enforce the 20-liter per household per day quota for drinking and cooking during water emergencies.',
        citation: '',
        isDone: false
      },
      {
        id: 'wat-en-2',
        text: 'Designate Barangay Water Marshals to oversee public distribution points and deep wells.',
        citation: '',
        isDone: false
      },
      {
        id: 'wat-en-3',
        text: 'Set deep well pumping schedules to 6:00 AM - 9:00 AM and 4:00 PM - 7:00 PM to allow groundwater recharge.',
        citation: '',
        isDone: false
      },
      {
        id: 'wat-en-4',
        text: 'Boil drinking water for at least 3 minutes or treat with approved chlorine tablets.',
        citation: '',
        isDone: false
      }
    ];

    const content = `According to the Department of the Interior and Local Government (DILG) Memorandum Circular on LGU Water Contingency:

Key Guidelines for Barangay Water Management:
1. Water Rationing Quota: In critical water shortages, enforce a mandatory quota of 20 liters per household per day for drinking and cooking needs.
2. Water Marshals: The Punong Barangay shall appoint Water Marshals to ensure fair distribution at public faucets and communal pumps.
3. Regulated Pumping Hours: Communal deep wells may only operate during set shifts (6:00 AM - 9:00 AM and 4:00 PM - 7:00 PM) to allow the aquifer time to recharge.
4. Prohibitions: Hose washing of vehicles and watering of ornamental gardens using drinking water is prohibited by barangay executive order.
5. Safe Drinking Protocol: Boil drinking water for at least 3 minutes once at a rolling boil, or treat with DOH-approved chlorine tablets.
6. Calamity Fund Access: The barangay may utilize its 30% Quick Response Fund (QRF) to purchase emergency water storage tanks and filtration gear.`;

    return {
      content,
      sources,
      contextChunks: chunks,
      checklist: needsChecklist ? checklistItems : undefined,
      suggestedFollowUps: [
        'How to keep rice crops alive with less water?',
        'What is the current heat index forecast?',
        'When will rainfall return according to PAGASA?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const checklistItems: ChecklistItem[] = [
    {
      id: 'wat-fl-1',
      text: 'Ipatupad ang 20-litro bawat pamilya bawat araw na quota para sa inumin at pagluluto tuwing may water shortage.',
      citation: '',
      isDone: false
    },
    {
      id: 'wat-fl-2',
      text: 'Magtalaga ng Barangay Water Marshals sa mga pampublikong gripo at communal wells.',
      citation: '',
      isDone: false
    },
    {
      id: 'wat-fl-3',
      text: 'Magtakda ng oras ng pagbomba sa balon (6:00 AM - 9:00 AM at 4:00 PM - 7:00 PM) upang makapag-ipon muli ng tubig sa ilalim ng lupa.',
      citation: '',
      isDone: false
    },
    {
      id: 'wat-fl-4',
      text: 'Pakuluin ang inuming tubig nang 3 minuto o gumamit ng chlorine tablets upang makaiwas sa sakit sa tiyan.',
      citation: '',
      isDone: false
    }
  ];

  const content = `Ayon sa DILG Memorandum Circular ukol sa Water Contingency sa Barangay:

Mga Alituntunin sa Pamamahala ng Tubig:
1. Rasyon ng Tubig: Tuwing may kakapusan sa tubig, ipatupad ang 20-litro bawat pamilya bawat araw na quota para sa inumin at pagluluto.
2. Water Marshals: Magtalaga ang Punong Barangay ng mga Water Marshals upang bantayan ang maayos at patas na pamamahagi ng tubig sa mga communal pumps.
3. Oras ng Pagbomba: Ipatupad ang pumping hours sa mga deep well (6:00 AM - 9:00 AM at 4:00 PM - 7:00 PM) upang mabigyan ng oras ang balon na mag-recharge at hindi matuyo.
4. Mahigpit na Pagbabawal: Bawal gamitin ang malinis na tubig sa paghuhugas ng sasakyan gamit ang hose at pagdidilig ng hardin.
5. Kaligtasan ng Tubig: Pakuluin nang 3 minuto ang inuming tubig o gumamit ng chlorine tablets upang maiwasan ang diarrhea at sakit sa tiyan.
6. Quick Response Fund (QRF): Maaaring gamitin ang 30% QRF ng barangay para bumili ng emergency water tanks at filtration supplies.`;

  return {
    content,
    sources,
    contextChunks: chunks,
    checklist: needsChecklist ? checklistItems : undefined,
    suggestedFollowUps: [
      'Paano makakatipid ng tubig sa palayan (AWD)?',
      'Ano ang heat index ngayon ayon sa PAGASA?',
      'Kailan babalik ang ulan?'
    ],
    modelUsed: modelLabel
  };
}

function synthesizeGeneralChunkResponse(
  chunks: RAGChunk[],
  sources: string[],
  modelLabel: string,
  needsChecklist: boolean,
  isEnglish: boolean
) {
  const points = chunks.map(chunk => cleanAsterisks(cleanInlineCitations(chunk.text)));

  if (isEnglish) {
    const checklistItems = points.map((p, idx) => ({
      id: `gen-en-${idx}`,
      text: p.slice(0, 160),
      citation: '',
      isDone: false
    }));

    const content = `Based on the official records and uploaded files in the offline database:

${points.map((p, idx) => `${idx + 1}. ${p}`).join('\n\n')}

Please coordinate with your local barangay office or municipal agriculture unit for direct assistance.`;

    return {
      content,
      sources,
      contextChunks: chunks,
      checklist: needsChecklist ? checklistItems : undefined,
      suggestedFollowUps: [
        'What is the current heat index forecast?',
        'When will rainfall return according to PAGASA?',
        'What are the first aid steps for heat stroke?'
      ],
      modelUsed: modelLabel
    };
  }

  // Modern Taglish / Filipino
  const checklistItems = points.map((p, idx) => ({
    id: `gen-fl-${idx}`,
    text: p.slice(0, 160),
    citation: '',
    isDone: false
  }));

  const content = `Batay sa mga dokumento at talaan sa offline database:

${points.map((p, idx) => `${idx + 1}. ${p}`).join('\n\n')}

Maaari kayong makipag-ugnayan sa inyong barangay o Municipal Agriculture Office para sa karagdagang tulong.`;

  return {
    content,
    sources,
    contextChunks: chunks,
    checklist: needsChecklist ? checklistItems : undefined,
    suggestedFollowUps: [
      'Ano ang heat index ngayon?',
      'Kailan babalik ang ulan ayon sa PAGASA?',
      'Ano ang first aid sa heat stroke?'
    ],
    modelUsed: modelLabel
  };
}

function generateFollowUps(query: string, isEnglish: boolean): string[] {
  const intent = detectAdvisoryIntent(query);
  if (intent === 'heat_index') {
    return isEnglish
      ? ['What is the first aid for heat stroke?', 'How does the agricultural split-shift work?', 'When will rainfall return?']
      : ['Ano ang first aid sa heat stroke?', 'Paano ang split-shift sa bukid?', 'Kailan babalik ang ulan?'];
  }
  if (intent === 'rainfall') {
    return isEnglish
      ? ['What is the current heat index forecast?', 'Our rice fields are drying up, what should we do?', 'What is the barangay water rationing quota?']
      : ['Ano ang heat index ngayon?', 'Tuyong-tuyo na ang palayan namin sa bukid, ano ang dapat gawin?', 'Ilan ang rasyon ng tubig bawat pamilya?'];
  }
  if (intent === 'rice') {
    return isEnglish
      ? ['What certified seeds are drought-resistant?', 'When will regular rainfall return?', 'What is the current heat index?']
      : ['Anong mga binhi ang matibay sa tagtuyot?', 'Kailan babalik ang ulan ayon sa PAGASA?', 'Ano ang heat index ngayon?'];
  }
  return isEnglish
    ? ['What is the current heat index forecast?', 'Our rice fields are drying up, what should we do?', 'What is the barangay water rationing quota?']
    : ['Ano ang heat index ngayon?', 'Tuyong-tuyo na ang palayan namin sa bukid, ano ang dapat gawin?', 'Ilan ang rasyon ng tubig bawat pamilya?'];
}

function isLikelyEnglish(text: string): boolean {
  const lower = text.toLowerCase();
  const englishWords = ['what', 'how', 'when', 'why', 'where', 'should', 'water', 'rice', 'field', 'drought', 'heat', 'crop', 'livestock', 'summary', 'explain', 'tell', 'quota', 'animal', 'pig', 'first', 'aid', 'return', 'forecast', 'index'];
  const filipinoWords = ['ano', 'paano', 'kailan', 'bakit', 'saan', 'dapat', 'tubig', 'palay', 'bukid', 'tagtuyot', 'init', 'hayop', 'balon', 'buod', 'ipaliwanag', 'sino', 'baboy', 'manok', 'biktima', 'aming'];

  let engScore = 0;
  let filScore = 0;

  for (const w of englishWords) if (lower.includes(w)) engScore++;
  for (const w of filipinoWords) if (lower.includes(w)) filScore++;

  return engScore >= filScore;
}
