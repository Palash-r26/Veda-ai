/**
 * Lightweight RAG utilities — no external vector DB or LangChain needed.
 *
 * Strategy:
 *  1. chunkText()  — split uploaded source into overlapping paragraphs
 *  2. scoreChunk() — keyword-frequency scoring against a query
 *  3. selectRelevantChunks() — return top-N chunks most relevant to a query
 *
 * This gives "good enough" retrieval for short educational documents
 * without the overhead of embeddings or a vector store.
 */

const CHUNK_SIZE = 600;      // characters per chunk
const CHUNK_OVERLAP = 100;   // overlap between chunks to preserve context

/**
 * Split a block of text into overlapping chunks.
 * Falls back gracefully on very short texts.
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  if (!text || text.trim().length === 0) return chunks;

  // First, try splitting by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  let buffer = '';
  for (const para of paragraphs) {
    if ((buffer + '\n\n' + para).length <= chunkSize) {
      buffer = buffer ? buffer + '\n\n' + para : para;
    } else {
      if (buffer) chunks.push(buffer.trim());
      // Para itself exceeds chunk size — split by sentences
      if (para.length > chunkSize) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let sentBuf = '';
        for (const s of sentences) {
          if ((sentBuf + ' ' + s).length <= chunkSize) {
            sentBuf = sentBuf ? sentBuf + ' ' + s : s;
          } else {
            if (sentBuf) chunks.push(sentBuf.trim());
            sentBuf = s;
          }
        }
        if (sentBuf) buffer = sentBuf;
        else buffer = '';
      } else {
        buffer = para;
      }
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());

  // Add overlap: each chunk includes the last `overlap` chars of the previous chunk
  if (overlap > 0 && chunks.length > 1) {
    return chunks.map((chunk, i) => {
      if (i === 0) return chunk;
      const prev = chunks[i - 1];
      const tail = prev.slice(-overlap);
      return tail + ' ' + chunk;
    });
  }

  return chunks;
}

/**
 * Score a single chunk against a query using term frequency of shared words.
 * Simple but fast — no embedding model needed.
 */
function scoreChunk(chunk: string, queryTerms: string[]): number {
  const lc = chunk.toLowerCase();
  return queryTerms.reduce((score, term) => {
    const re = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lc.match(re);
    return score + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Select the most relevant chunks for a given context query.
 *
 * @param chunks     - All chunks from the source document
 * @param query      - Natural language query (e.g. question type names + instructions)
 * @param maxChunks  - Max number of chunks to return
 * @returns Ordered array of the top-N most relevant chunks
 */
export function selectRelevantChunks(
  chunks: string[],
  query: string,
  maxChunks = 4
): string[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= maxChunks) return chunks;

  // Tokenize query into meaningful terms (drop stopwords)
  const stopwords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to',
    'for', 'of', 'and', 'or', 'but', 'with', 'by', 'from', 'as', 'this',
    'that', 'it', 'be', 'do', 'have', 'has', 'had', 'not', 'all', 'any',
  ]);
  const queryTerms = query
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2 && !stopwords.has(t));

  const scored = chunks.map((chunk, idx) => ({
    chunk,
    idx,
    score: scoreChunk(chunk, queryTerms),
  }));

  // Sort by score desc, preserve original order for ties
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);

  // Return top-N in their ORIGINAL document order (preserves narrative flow)
  const topIndices = new Set(scored.slice(0, maxChunks).map(s => s.idx));
  return chunks.filter((_, i) => topIndices.has(i));
}

/**
 * Build a compact RAG context string from selected chunks.
 * Inserts separators for clarity in the prompt.
 */
export function buildRagContext(chunks: string[]): string {
  if (!chunks || chunks.length === 0) return '';
  return chunks
    .map((c, i) => `[Excerpt ${i + 1}]\n${c}`)
    .join('\n\n');
}
