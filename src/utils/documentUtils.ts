import { DocumentContext, MAX_DOCUMENT_WORDS } from '../types';

export interface DocumentProcessResult {
  doc: DocumentContext | null;
  warning?: string;
  error?: string;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function processDocumentText(name: string, rawText: string): DocumentProcessResult {
  const words = rawText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  let finalContent = rawText;
  let truncated = false;
  let warning: string | undefined = undefined;

  if (wordCount > MAX_DOCUMENT_WORDS) {
    truncated = true;
    finalContent = words.slice(0, MAX_DOCUMENT_WORDS).join(' ');
    warning = 'Document truncated to fit context.';
  }

  const rawLineCount = finalContent.split('\n').length;
  const charCount = finalContent.length;
  const estimatedTokens = Math.round(charCount / 4);

  return {
    doc: {
      name,
      content: finalContent,
      charCount,
      estimatedTokens,
      truncated,
      rawLineCount,
    },
    warning,
  };
}

export async function processUploadedFile(file: File): Promise<DocumentProcessResult> {
  const fileName = file.name.toLowerCase();
  const isTxt = fileName.endsWith('.txt');
  const isMd = fileName.endsWith('.md') || fileName.endsWith('.markdown');

  if (!isTxt && !isMd) {
    return {
      doc: null,
      error: 'Only .txt and .md files are supported in v1.',
    };
  }

  try {
    const text = await file.text();
    return processDocumentText(file.name, text);
  } catch {
    return {
      doc: null,
      error: 'Failed to read file contents.',
    };
  }
}
