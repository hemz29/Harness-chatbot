import { SearchResultItem } from '../types';

export interface TavilySearchResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
}

export async function searchTavily(apiKey: string, query: string): Promise<SearchResultItem[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No Tavily API key provided.');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey.trim(),
      query: query.trim(),
      max_results: 3,
      search_depth: 'basic',
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Tavily rejected search request — check your Tavily API key.');
    }
    if (response.status === 429) {
      throw new Error('Tavily rate limit exceeded.');
    }
    throw new Error(`Tavily search failed (${response.status})`);
  }

  const data = (await response.json()) as TavilySearchResponse;
  const items: SearchResultItem[] = [];
  if (data.results && Array.isArray(data.results)) {
    for (const r of data.results.slice(0, 3)) {
      items.push({
        title: r.title || 'Untitled',
        url: r.url || '',
        content: r.content || '',
      });
    }
  }

  return items;
}

export function formatSearchSnippetsForContext(results: SearchResultItem[]): string {
  if (results.length === 0) return '';
  const formatted = results
    .map(
      (r, idx) =>
        `[${idx + 1}] "${r.title}" (${r.url}):\n${r.content}`
    )
    .join('\n\n');
  return `Web Search Context (Top ${results.length} live results):\n${formatted}\n`;
}
