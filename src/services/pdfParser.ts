import * as pdfjsLib from 'pdfjs-dist';

export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; pages: { pageNumber: number; text: string }[] }> {
  try {
    // Set worker or fallback to disableWorker if needed
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pages: { pageNumber: number; text: string }[] = [];
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({ pageNumber: i, text: pageText });
      fullText += (fullText ? '\n\n' : '') + `[Page ${i}]\n` + pageText;
    }

    return { text: fullText, pages };
  } catch (err) {
    console.warn('PDF.js parsing error, attempting fallback text extraction:', err);
    // Fallback: extract ASCII / UTF-8 strings from stream
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(arrayBuffer);
    const matches = raw.match(/BT[\s\S]*?ET/g) || [];
    let fallbackText = '';
    for (const block of matches) {
      const textMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
      const line = textMatches.map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '')).join(' ');
      if (line) fallbackText += line + '\n';
    }
    if (!fallbackText) {
      fallbackText = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').slice(0, 10000);
    }
    return {
      text: fallbackText,
      pages: [{ pageNumber: 1, text: fallbackText }]
    };
  }
}
