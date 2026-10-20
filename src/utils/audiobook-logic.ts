/**
 * Pure logic utilities for Audiobook creation, text processing, duration estimation, and speech chunking.
 */

/**
 * Strips HTML tags, decodes common entities, removes footnotes/headers,
 * and formats text cleanly for both reading and natural voice narration.
 */
export function cleanHtmlForSpeech(html: string): string {
  if (!html) return '';

  let text = html;

  // Remove script and style elements and their content
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

  // Replace line breaking elements with double newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, '\n\n');
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');

  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  const entityMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': ' — ',
    '&ndash;': ' – ',
    '&hellip;': '...',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&agrave;': 'à',
    '&ccedil;': 'ç',
  };

  text = text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    if (entityMap[entity]) return entityMap[entity];
    // numeric entities &#160; or &#x00a0;
    if (entity.startsWith('&#x') || entity.startsWith('&#X')) {
      const code = parseInt(entity.slice(3, -1), 16);
      return !isNaN(code) ? String.fromCharCode(code) : ' ';
    }
    if (entity.startsWith('&#')) {
      const code = parseInt(entity.slice(2, -1), 10);
      return !isNaN(code) ? String.fromCharCode(code) : ' ';
    }
    return ' ';
  });

  // Remove footnote markers like [1], [2], [note 1]
  text = text.replace(/\[\s*\d+\s*\]/g, '');
  text = text.replace(/\[note\s*\d+\]/gi, '');

  // Normalize excessive whitespaces while preserving paragraph breaks
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.replace(/[ \t]+/g, ' ').trim())
    .filter(p => p.length > 0);

  return paragraphs.join('\n\n');
}

/**
 * Splits text into readable and highlightable sentences,
 * protecting common abbreviations like "Mr.", "Dr.", "e.g.", "etc."
 */
export function splitTextIntoSentences(text: string): string[] {
  if (!text || text.trim().length === 0) return [];

  // Protect known abbreviations by temporarily replacing their period with a placeholder
  const protectedAbbreviations = [
    'Mr\\.', 'Mrs\\.', 'Ms\\.', 'Dr\\.', 'Prof\\.', 'Sr\\.', 'Jr\\.',
    'Gen\\.', 'Col\\.', 'Capt\\.', 'Lt\\.', 'Rev\\.', 'St\\.',
    'e\\.g\\.', 'i\\.e\\.', 'etc\\.', 'vs\\.', 'vol\\.', 'no\\.', 'dept\\.',
    'Jan\\.', 'Feb\\.', 'Mar\\.', 'Apr\\.', 'Aug\\.', 'Sept\\.', 'Oct\\.', 'Nov\\.', 'Dec\\.'
  ];

  let masked = text;
  const placeholder = '__PERIOD__';

  protectedAbbreviations.forEach(abbr => {
    const reg = new RegExp(`\\b${abbr}`, 'gi');
    masked = masked.replace(reg, match => match.replace(/\./g, placeholder));
  });

  // Protect ellipses
  masked = masked.replace(/\.{3}/g, '__ELLIPSIS__');

  // Split on sentence boundaries: period, exclamation mark, question mark followed by whitespace or quote
  const rawParts = masked.split(/(?<=[.?!])(?=\s+[A-Z0-9"“'‘])/);

  const sentences: string[] = [];

  for (const part of rawParts) {
    const restored = part
      .replace(new RegExp(placeholder, 'g'), '.')
      .replace(/__ELLIPSIS__/g, '...')
      .trim();

    if (restored.length > 0) {
      sentences.push(restored);
    }
  }

  return sentences.length > 0 ? sentences : [text.trim()];
}

/**
 * Estimates audio duration in seconds from word count and narration speed.
 * Average audiobook narration speed is ~150 words per minute (WPM).
 */
export function estimateAudioDuration(textOrWordCount: string | number, playbackRate = 1.0, wpm = 150): number {
  let wordCount: number;
  if (typeof textOrWordCount === 'number') {
    wordCount = textOrWordCount;
  } else {
    wordCount = textOrWordCount ? textOrWordCount.trim().split(/\s+/).filter(Boolean).length : 0;
  }

  if (wordCount <= 0) return 0;
  const minutes = wordCount / (wpm * playbackRate);
  return Math.max(1, Math.round(minutes * 60));
}

/**
 * Formats seconds into "MM:SS" or "H:MM:SS"
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Chunk a chapter into TTS-friendly chunks (e.g. 800 - 1500 chars)
 * respecting sentence boundaries.
 */
export function splitIntoSpeechChunks(text: string, maxChunkLength = 1200): string[] {
  if (!text || text.length <= maxChunkLength) return [text.trim()];

  const sentences = splitTextIntoSentences(text);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
