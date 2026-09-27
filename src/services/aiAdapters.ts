import { Message, DocumentContext, EmailContext, SearchResultItem } from '../types';
import { formatSearchSnippetsForContext } from './tavily';

export interface ModelRequestOptions {
  apiKey: string;
  modelName: string;
  messages: Message[];
  documentContext?: DocumentContext | null;
  emailContext?: EmailContext | null;
  searchResults?: SearchResultItem[];
}

export interface ModelResponseResult {
  text: string;
  latencyMs: number;
  trimmedHistory?: boolean;
}

/**
 * Build ground instructions (documents, search results, email context)
 */
export function buildGroundingInstruction(
  doc?: DocumentContext | null,
  searchResults?: SearchResultItem[],
  emailContext?: EmailContext | null
): string {
  const parts: string[] = [];

  if (doc && doc.content.trim()) {
    parts.push(
      `Use the following document to answer questions:\n--- START DOCUMENT (${doc.name}) ---\n${doc.content}\n--- END DOCUMENT ---`
    );
  }

  if (searchResults && searchResults.length > 0) {
    parts.push(formatSearchSnippetsForContext(searchResults));
  }

  if (emailContext && emailContext.rawEmail.trim()) {
    parts.push(
      `Email Thread Context:\n--- RAW EMAIL ---\n${emailContext.rawEmail}\n--- END RAW EMAIL ---`
    );
  }

  return parts.join('\n\n');
}

/**
 * Trims conversation messages if too large (keeping most recent messages)
 */
export function prepareTrimmedConversation(messages: Message[], maxCount = 20): { trimmed: Message[]; wasTrimmed: boolean } {
  // Filter out notice messages
  const dialogMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  
  if (dialogMessages.length <= maxCount) {
    return { trimmed: dialogMessages, wasTrimmed: false };
  }

  // Keep the most recent maxCount messages
  // If the first kept message is an assistant message, we should start from a user message to maintain conversational coherence
  let startIndex = dialogMessages.length - maxCount;
  if (dialogMessages[startIndex]?.role === 'assistant' && startIndex > 0) {
    startIndex += 1;
  }

  const kept = dialogMessages.slice(startIndex);
  return { trimmed: kept, wasTrimmed: true };
}

/**
 * Anthropic Claude Call
 */
export async function callClaude({
  apiKey,
  modelName,
  messages,
  documentContext,
  emailContext,
  searchResults,
}: ModelRequestOptions): Promise<ModelResponseResult> {
  const startTime = performance.now();

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Add your API key in Settings');
  }

  const { trimmed, wasTrimmed } = prepareTrimmedConversation(messages);
  const grounding = buildGroundingInstruction(documentContext, searchResults, emailContext);

  // Format messages for Claude
  const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (let i = 0; i < trimmed.length; i++) {
    const m = trimmed[i];
    const role = m.role === 'assistant' ? 'assistant' : 'user';

    // If this is the last message and it's from user, we can prepend or append grounding if not in system
    let text = m.content;
    if (i === trimmed.length - 1 && role === 'user' && grounding) {
      text = `${grounding}\n\nUser Question/Instruction:\n${m.content}`;
    }

    // Claude requires alternating turns
    const lastMsg = claudeMessages[claudeMessages.length - 1];
    if (lastMsg && lastMsg.role === role) {
      lastMsg.content += `\n\n${text}`;
    } else {
      claudeMessages.push({ role, content: text });
    }
  }

  // Ensure first message is user
  if (claudeMessages.length > 0 && claudeMessages[0].role !== 'user') {
    claudeMessages.unshift({ role: 'user', content: 'Hello' });
  }

  const bodyPayload: Record<string, unknown> = {
    model: modelName.trim(),
    max_tokens: 4096,
    messages: claudeMessages,
  };

  if (grounding) {
    bodyPayload.system = `You are a helpful and precise AI assistant. When provided with grounded context or documents, adhere strictly to the information provided.\n${grounding}`;
  }

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });
  } catch {
    throw new Error("Couldn't reach the model — try again");
  }

  const latencyMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Claude rejected the request — check your API key');
    }
    if (res.status === 429) {
      throw new Error('Rate limited — wait a moment and retry');
    }
    if (res.status >= 500) {
      throw new Error("Couldn't reach the model — try again");
    }
    const errText = await res.text().catch(() => '');
    throw new Error(`Claude error (${res.status}): ${errText || 'Request failed'}`);
  }

  const data = await res.json();
  const textContent = Array.isArray(data.content)
    ? data.content.map((c: { text?: string }) => c.text || '').join('\n')
    : data.content || '';

  return {
    text: textContent || '(No response received)',
    latencyMs,
    trimmedHistory: wasTrimmed,
  };
}

/**
 * Google Gemini Call (Legacy generateContent endpoint per spec)
 */
export async function callGemini({
  apiKey,
  modelName,
  messages,
  documentContext,
  emailContext,
  searchResults,
}: ModelRequestOptions): Promise<ModelResponseResult> {
  const startTime = performance.now();

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Add your API key in Settings');
  }

  const { trimmed, wasTrimmed } = prepareTrimmedConversation(messages);
  const grounding = buildGroundingInstruction(documentContext, searchResults, emailContext);

  // Gemini contents array: { role: 'user' | 'model', parts: [{ text: string }] }
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (let i = 0; i < trimmed.length; i++) {
    const m = trimmed[i];
    const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';

    let text = m.content;
    // Grounding prepended on the last user message or first message
    if (i === trimmed.length - 1 && role === 'user' && grounding) {
      text = `${grounding}\n\nUser Question/Instruction:\n${m.content}`;
    }

    // Gemini also requires alternating or coalesced parts
    const lastContent = contents[contents.length - 1];
    if (lastContent && lastContent.role === role) {
      lastContent.parts.push({ text });
    } else {
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Ensure first message is user
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({
      role: 'user',
      parts: [{ text: grounding ? `${grounding}\n\nHello` : 'Hello' }],
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName.trim()
  )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  };

  if (grounding) {
    payload.systemInstruction = {
      parts: [
        {
          text: `You are a helpful and precise AI assistant. When provided with grounded context or documents, adhere strictly to the information provided.\n${grounding}`,
        },
      ],
    };
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Couldn't reach the model — try again");
  }

  const latencyMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      // Check if it was invalid key
      throw new Error('Gemini rejected the request — check your API key');
    }
    if (res.status === 429) {
      throw new Error('Rate limited — wait a moment and retry');
    }
    if (res.status >= 500) {
      throw new Error("Couldn't reach the model — try again");
    }
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini error (${res.status}): ${errText || 'Request failed'}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts;
  const replyText = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p.text || '').join('\n')
    : '';

  return {
    text: replyText || '(No response received)',
    latencyMs,
    trimmedHistory: wasTrimmed,
  };
}

/**
 * Quick single prompt call for Email Draft or other helper tools
 */
export async function draftEmailWithModel({
  provider,
  apiKey,
  modelName,
  rawEmail,
  instruction,
}: {
  provider: 'claude' | 'gemini';
  apiKey: string;
  modelName: string;
  rawEmail: string;
  instruction: string;
}): Promise<{ draft: string; latencyMs: number }> {
  const prompt = `You are an expert executive communication assistant. Please draft an email reply based on the following email thread and user instruction.\n\n` +
    `--- RECEIVED EMAIL ---\n${rawEmail}\n--- END RECEIVED EMAIL ---\n\n` +
    `--- INSTRUCTION ---\n${instruction || 'Write an appropriate, concise, and professional reply.'}\n--- END INSTRUCTION ---\n\n` +
    `Provide only the plain text email reply draft without markdown conversational fluff, ready to copy and send.`;

  const dummyMessages: Message[] = [
    {
      id: 'email_prompt',
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    },
  ];

  if (provider === 'claude') {
    const res = await callClaude({
      apiKey,
      modelName,
      messages: dummyMessages,
    });
    return { draft: res.text.trim(), latencyMs: res.latencyMs };
  } else {
    const res = await callGemini({
      apiKey,
      modelName,
      messages: dummyMessages,
    });
    return { draft: res.text.trim(), latencyMs: res.latencyMs };
  }
}
