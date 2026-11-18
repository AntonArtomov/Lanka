// Адреса бекенда задається під час збірки (VITE_GUIDE_API_URL). Без неї гід
// працює на локальних відповідях, як і до появи бекенда.
const base = (import.meta.env.VITE_GUIDE_API_URL as string | undefined)?.replace(/\/$/, '');

export const guideApiEnabled = Boolean(base);
export type Turn = { role: 'user' | 'guide'; text: string };

const TIMEOUT_MS = 30_000;

// Відповідь приходить потоком SSE; onText отримує накопичений текст.
export async function askGuide(
  work: string, turns: Turn[], onText: (text: string) => void, signal: AbortSignal,
): Promise<string> {
  const response = await fetch(`${base}/guide`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ work, messages: turns }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
  });
  if (!response.ok || !response.body) throw new Error(`guide ${response.status}`);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const line = buffer.slice(0, end).replace(/^data:\s*/, '');
      buffer = buffer.slice(end + 2);
      if (!line) continue;
      const event = JSON.parse(line) as { text?: string; error?: string; done?: boolean };
      if (event.error) throw new Error(event.error);
      if (event.text) onText(text += event.text);
    }
  }
  if (!text) throw new Error('empty');
  return text;
}
