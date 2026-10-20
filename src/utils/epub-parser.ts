import JSZip from 'jszip';
import { cleanHtmlForSpeech, estimateAudioDuration, splitTextIntoSentences } from './audiobook-logic';

export interface AudiobookChapter {
  id: string;
  index: number;
  title: string;
  rawText: string;
  cleanedText: string;
  sentences: string[];
  wordCount: number;
  durationSeconds: number; // estimated at 1.0x
  audioUrl?: string; // If pre-generated or cached
}

export interface AudiobookMetadata {
  title: string;
  author: string;
  description?: string;
  language?: string;
  publisher?: string;
  coverUrl?: string;
  totalWords: number;
  totalDurationSeconds: number;
  chapterCount: number;
  fileName?: string;
  fileSize?: number;
}

export interface ParsedEpubBook {
  metadata: AudiobookMetadata;
  chapters: AudiobookChapter[];
}

/**
 * Parses an EPUB ArrayBuffer or File into structured Audiobook chapters and metadata.
 */
export async function parseEpubFile(fileBuffer: ArrayBuffer, fileName = 'Unknown Book.epub'): Promise<ParsedEpubBook> {
  const zip = await JSZip.loadAsync(fileBuffer);

  // 1. Find META-INF/container.xml to locate the OPF package file
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    // Fallback: check if this is a plain text file or HTML file wrapped in zip
    return parseFallbackBook(zip, fileName);
  }

  const containerXml = await containerFile.async('text');
  const opfPathMatch = containerXml.match(/full-path=["']([^"']+)["']/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

  const opfFile = zip.file(opfPath) || zip.file(decodeURIComponent(opfPath));
  if (!opfFile) {
    throw new Error(`Cannot find package file ${opfPath} in EPUB archive.`);
  }

  // Base directory for resolving relative paths in OPF
  const opfBaseDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfContent = await opfFile.async('text');
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfContent, 'application/xml');

  // Extract metadata
  const titleEl = opfDoc.querySelector('metadata > title, metadata > dc\\:title');
  const authorEl = opfDoc.querySelector('metadata > creator, metadata > dc\\:creator');
  const descEl = opfDoc.querySelector('metadata > description, metadata > dc\\:description');
  const langEl = opfDoc.querySelector('metadata > language, metadata > dc\\:language');
  const pubEl = opfDoc.querySelector('metadata > publisher, metadata > dc\\:publisher');

  const title = titleEl?.textContent?.trim() || fileName.replace(/\.[^/.]+$/, '');
  const author = authorEl?.textContent?.trim() || 'Unknown Author';
  const description = descEl?.textContent?.trim() || '';
  const language = langEl?.textContent?.trim() || 'en';
  const publisher = pubEl?.textContent?.trim() || '';

  // Extract Manifest (id -> href, media-type)
  const manifestItems = new Map<string, { href: string; mediaType: string; properties?: string }>();
  const itemElements = opfDoc.querySelectorAll('manifest > item');
  itemElements.forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type') || '';
    const properties = item.getAttribute('properties') || '';
    if (id && href) {
      manifestItems.set(id, { href, mediaType, properties });
    }
  });

  // Extract Cover Image
  let coverUrl: string | undefined;
  let coverItemHref: string | undefined;

  // Method A: manifest item with properties="cover-image"
  for (const [, item] of manifestItems) {
    if (item.properties && item.properties.includes('cover-image')) {
      coverItemHref = item.href;
      break;
    }
  }

  // Method B: meta name="cover" content="item_id"
  if (!coverItemHref) {
    const coverMeta = opfDoc.querySelector('metadata > meta[name="cover"]');
    const coverId = coverMeta?.getAttribute('content');
    if (coverId && manifestItems.has(coverId)) {
      coverItemHref = manifestItems.get(coverId)?.href;
    }
  }

  // Method C: look for item with id containing 'cover' and image media-type
  if (!coverItemHref) {
    for (const [id, item] of manifestItems) {
      if ((id.toLowerCase().includes('cover') || item.href.toLowerCase().includes('cover')) && item.mediaType.startsWith('image/')) {
        coverItemHref = item.href;
        break;
      }
    }
  }

  if (coverItemHref) {
    try {
      const fullCoverPath = resolveRelativePath(opfBaseDir, coverItemHref);
      const coverFile = zip.file(fullCoverPath) || zip.file(decodeURIComponent(fullCoverPath));
      if (coverFile) {
        const coverBlob = await coverFile.async('blob');
        coverUrl = URL.createObjectURL(coverBlob);
      }
    } catch {
      // Ignore cover extraction error
    }
  }

  // Extract Table of Contents / Spine order
  const spineItems = opfDoc.querySelectorAll('spine > itemref');
  const chapters: AudiobookChapter[] = [];
  let chapterIndex = 1;

  for (let i = 0; i < spineItems.length; i++) {
    const itemref = spineItems[i];
    const idref = itemref.getAttribute('idref');
    if (!idref) continue;

    const manifestItem = manifestItems.get(idref);
    if (!manifestItem) continue;

    const chapterPath = resolveRelativePath(opfBaseDir, manifestItem.href);
    const chapterFile = zip.file(chapterPath) || zip.file(decodeURIComponent(chapterPath));
    if (!chapterFile) continue;

    try {
      const htmlContent = await chapterFile.async('text');
      const cleaned = cleanHtmlForSpeech(htmlContent);

      // Skip empty or nearly empty intro cover pages (less than 20 chars)
      if (cleaned.length < 30) continue;

      // Extract chapter title from h1-h3 or fallback
      const chapterDoc = parser.parseFromString(htmlContent, 'text/html');
      let chapterTitle = chapterDoc.querySelector('h1, h2, h3, title')?.textContent?.trim();

      if (!chapterTitle || chapterTitle.length > 80 || chapterTitle.toLowerCase().includes('untitled')) {
        // Try to pick first short line or use Chapter X
        const firstLine = cleaned.split('\n')[0]?.trim();
        if (firstLine && firstLine.length < 60 && !firstLine.includes('.')) {
          chapterTitle = firstLine;
        } else {
          chapterTitle = `Chapter ${chapterIndex}`;
        }
      }

      const sentences = splitTextIntoSentences(cleaned);
      const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
      const durationSeconds = estimateAudioDuration(wordCount, 1.0, 150);

      chapters.push({
        id: `ch-${chapterIndex}`,
        index: chapterIndex,
        title: chapterTitle,
        rawText: htmlContent,
        cleanedText: cleaned,
        sentences,
        wordCount,
        durationSeconds,
      });

      chapterIndex++;
    } catch {
      // Continue next chapter
    }
  }

  // If no spine chapters had enough content, attempt fallback to any HTML files in zip
  if (chapters.length === 0) {
    return parseFallbackBook(zip, fileName, title, author);
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);
  const totalDurationSeconds = chapters.reduce((acc, c) => acc + c.durationSeconds, 0);

  return {
    metadata: {
      title,
      author,
      description,
      language,
      publisher,
      coverUrl,
      totalWords,
      totalDurationSeconds,
      chapterCount: chapters.length,
      fileName,
      fileSize: fileBuffer.byteLength,
    },
    chapters,
  };
}

/**
 * Fallback parser for non-standard zip or raw text content
 */
async function parseFallbackBook(zip: JSZip, fileName: string, fallbackTitle?: string, fallbackAuthor?: string): Promise<ParsedEpubBook> {
  const chapters: AudiobookChapter[] = [];
  let idx = 1;

  const htmlFiles = Object.keys(zip.files).filter(name =>
    (name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm')) && !name.includes('toc')
  );

  for (const name of htmlFiles) {
    const file = zip.file(name);
    if (!file) continue;
    const text = await file.async('text');
    const cleaned = cleanHtmlForSpeech(text);
    if (cleaned.length > 50) {
      const sentences = splitTextIntoSentences(cleaned);
      const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
      chapters.push({
        id: `ch-${idx}`,
        index: idx,
        title: `Chapter ${idx}`,
        rawText: text,
        cleanedText: cleaned,
        sentences,
        wordCount,
        durationSeconds: estimateAudioDuration(wordCount),
      });
      idx++;
    }
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);
  const totalDurationSeconds = chapters.reduce((acc, c) => acc + c.durationSeconds, 0);

  return {
    metadata: {
      title: fallbackTitle || fileName.replace(/\.[^/.]+$/, ''),
      author: fallbackAuthor || 'Author',
      totalWords,
      totalDurationSeconds,
      chapterCount: chapters.length,
      fileName,
    },
    chapters,
  };
}

/**
 * Resolves relative file path inside EPUB
 */
function resolveRelativePath(baseDir: string, relativePath: string): string {
  // If already absolute or starts with slash
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.slice(1);
  }
  const parts = (baseDir + relativePath).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}
