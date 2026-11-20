import type { Turn } from './prompt.ts';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  thinking: string;
  maxOutputTokens: number;
}

export class UpstreamError extends Error {
  status: number;
  constructor(status: number) {
    super(`upstream ${status}`);
    this.status = status;
  }
}

// Потокова відповідь Gemini (streamGenerateContent, alt=sse). Віддає шматки тексту.
// temperature не передаємо: нові моделі її ігнорують і попереджають про
// майбутню помилку 400.
export async function* streamGemini(
  config: GeminiConfig, system: string, turns: Turn[], signal: AbortSignal,
): AsyncGenerator<string> {
  const generationConfig: Record<string, unknown> = { maxOutputTokens: config.maxOutputTokens };
  if (config.thinking) generationConfig.thinkingConfig = { thinkingLevel: config.thinking };

  const response = await fetch(`${config.baseUrl}/v1beta/models/${config.model}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-goog-api-key': config.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map(turn => ({ role: turn.role === 'user' ? 'user' : 'model', parts: [{ text: turn.text }] })),
      generationConfig,
    }),
  });
  if (!response.ok || !response.body) throw new UpstreamError(response.status);

  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let end: number;
    while ((end = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const event = buffer.slice(0, end);
      buffer = buffer.slice(end).replace(/^\r?\n\r?\n/, '');
      const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('');
      if (!data) continue;
      let parsed: { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      try { parsed = JSON.parse(data); } catch { continue; }
      for (const part of parsed.candidates?.[0]?.content?.parts ?? []) {
        if (part.text && !part.thought) yield part.text;
      }
    }
  }
}
