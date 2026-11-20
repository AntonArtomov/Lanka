import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { streamGemini, UpstreamError, type GeminiConfig } from './gemini.ts';
import { createLimiter } from './limits.ts';
import { systemPrompt, type Turn, type Works } from './prompt.ts';
import works from '../data/works.json' with { type: 'json' };

const MAX_BODY = 8 * 1024;
const MAX_TURNS = 12;
const MAX_USER_TEXT = 300;
// Відповіді гіда повертаються в історії, а вони довші за запитання
const MAX_GUIDE_TEXT = 1500;
const UPSTREAM_TIMEOUT_MS = 25_000;
// Відповідь, коли Gemini нічого не віддав (наприклад, заблокував запит)
const NO_ANSWER = 'На це запитання я не можу відповісти. Спитай про цей твір, його автора чи епоху.';

export interface AppConfig {
  gemini: GeminiConfig;
  allowedOrigins: string[];
  perMinute: number;
  perDay: number;
  globalPerDay: number;
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    gemini: {
      apiKey: env.GEMINI_API_KEY ?? '',
      // Назву моделі взято зі сторінки тарифів Google; ключ потрібен, щоб
      // підтвердити її живим викликом — npm run check
      model: env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
      baseUrl: env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com',
      thinking: env.GEMINI_THINKING ?? 'MINIMAL',
      maxOutputTokens: Number(env.MAX_OUTPUT_TOKENS ?? 400),
    },
    allowedOrigins: (env.ALLOWED_ORIGINS ?? 'https://lanka.nickromant.com,http://localhost:5173,http://localhost:4173')
      .split(',').map(origin => origin.trim()).filter(Boolean),
    perMinute: Number(env.RATE_PER_MIN ?? 15),
    perDay: Number(env.RATE_PER_DAY ?? 200),
    globalPerDay: Number(env.GLOBAL_PER_DAY ?? 3000),
  };
}

function clientIp(req: IncomingMessage): string {
  // За Traefik справжня адреса — остання в X-Forwarded-For; ліві записи
  // клієнт може підробити.
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',').map(part => part.trim()).filter(Boolean);
  return forwarded.at(-1) ?? req.socket.remoteAddress ?? 'unknown';
}

function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseRequest(raw: string, data: Works): { work: Works['artworks'][number]; turns: Turn[] } | string {
  let body: { work?: unknown; messages?: unknown };
  try { body = JSON.parse(raw); } catch { return 'invalid json'; }
  const work = data.artworks.find(artwork => artwork.image === body.work);
  if (!work) return 'unknown work';
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_TURNS) return 'invalid messages';
  const turns: Turn[] = [];
  for (const message of messages) {
    const role = message?.role;
    const text = typeof message?.text === 'string' ? message.text.trim() : '';
    if ((role !== 'user' && role !== 'guide') || !text || text.length > (role === 'user' ? MAX_USER_TEXT : MAX_GUIDE_TEXT)) return 'invalid messages';
    turns.push({ role, text });
  }
  if (turns[0].role !== 'user' || turns.at(-1)!.role !== 'user') return 'invalid messages';
  return { work, turns };
}

export function createApp(config: AppConfig, data: Works = works as Works) {
  const limit = createLimiter({ perMinute: config.perMinute, perDay: config.perDay, globalPerDay: config.globalPerDay });

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    const originOk = !origin || config.allowedOrigins.includes(origin);
    const cors: Record<string, string> = origin && originOk
      ? { 'access-control-allow-origin': origin, vary: 'Origin' }
      : {};

    if (req.url === '/health') return json(res, 200, { ok: true });
    if (req.url !== '/guide') return json(res, 404, { error: 'not found' });

    if (req.method === 'OPTIONS') {
      res.writeHead(originOk ? 204 : 403, {
        ...cors,
        'access-control-allow-methods': 'POST',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '600',
      });
      return res.end();
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });
    if (!originOk) return json(res, 403, { error: 'forbidden origin' });
    if (!config.gemini.apiKey) return json(res, 503, { error: 'not configured' }, cors);

    const verdict = limit(clientIp(req));
    if (!verdict.ok) return json(res, 429, { error: 'rate limited' }, { ...cors, 'retry-after': String(verdict.retryAfter) });

    const raw = await readBody(req);
    if (raw === null) return json(res, 413, { error: 'too large' }, cors);
    const parsed = parseRequest(raw, data);
    if (typeof parsed === 'string') return json(res, 400, { error: parsed }, cors);

    const started = Date.now();
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), UPSTREAM_TIMEOUT_MS);
    // Користувач закрив вкладку — не палимо ліміт на відповідь, яку ніхто не читає
    res.on('close', () => abort.abort());

    const open = () => streamGemini(config.gemini, systemPrompt(parsed.work, parsed.work.context ?? data.context), parsed.turns, abort.signal);
    let stream = open();
    let status = 200;
    let upstreamStatus: number | undefined;
    try {
      // Перший шматок отримуємо до заголовків, щоб помилку Gemini
      // віддати нормальним HTTP-статусом, а не обірваним потоком.
      let first: IteratorResult<string>;
      try {
        first = await stream.next();
      } catch (error) {
        // Разові збої Gemini (5xx, обрив з'єднання) до першого шматка
        // перечікуємо одним повтором; 4xx і скасування повторювати марно.
        const transient = error instanceof UpstreamError ? error.status >= 500 : !abort.signal.aborted;
        if (!transient) throw error;
        stream = open();
        first = await stream.next();
      }
      res.writeHead(200, { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-cache', 'x-accel-buffering': 'no' });
      const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
      if (first.done) {
        send({ text: NO_ANSWER });
      } else {
        send({ text: first.value });
        for await (const text of stream) send({ text });
      }
      send({ done: true });
      res.end();
    } catch (error) {
      if (error instanceof UpstreamError) upstreamStatus = error.status;
      status = upstreamStatus === 429 ? 503 : 502;
      if (!res.headersSent) json(res, status, { error: 'upstream' }, cors);
      else { res.write(`data: ${JSON.stringify({ error: 'upstream' })}\n\n`); res.end(); }
    } finally {
      clearTimeout(timer);
      // Текст запитань не логуємо: лише технічні поля
      console.log(JSON.stringify({ work: parsed.work.image, status, upstream: upstreamStatus, ms: Date.now() - started }));
    }
  });
}

if (import.meta.main) {
  const config = configFromEnv();
  if (!config.gemini.apiKey) console.warn('GEMINI_API_KEY не задано: /guide відповідатиме 503, фронтенд перейде на запасні відповіді');
  const port = Number(process.env.PORT ?? 8080);
  createApp(config).listen(port, () => console.log(`lanka-api слухає :${port}`));
}
