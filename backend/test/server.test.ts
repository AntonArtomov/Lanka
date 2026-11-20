import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import { createApp, configFromEnv } from '../src/server.ts';
import { createLimiter } from '../src/limits.ts';
import works from '../data/works.json' with { type: 'json' };

let upstreamBodies: any[] = [];
let upstreamMode: 'ok' | 'empty' | 'fail' | 'fail-once' = 'ok';
let upstream: Server;
let app: Server;
let base: string;

const sse = (text: string) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;

before(async () => {
  upstream = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    upstreamBodies.push({ url: req.url, key: req.headers['x-goog-api-key'], body: JSON.parse(raw) });
    if (upstreamMode === 'fail-once' && upstreamBodies.length === 1) { res.writeHead(500); return res.end('boom'); }
    if (upstreamMode === 'fail') { res.writeHead(500); return res.end('boom'); }
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    if (upstreamMode === 'empty') return res.end(`data: ${JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } })}\n\n`);
    res.write(sse('Привіт, ')); // подія розрізана між чанками
    res.write(sse('це відповідь.').slice(0, 20));
    res.end(sse('це відповідь.').slice(20));
  }).listen(0);
  const upstreamPort = (upstream.address() as AddressInfo).port;
  const config = configFromEnv({
    GEMINI_API_KEY: 'test-key', GEMINI_BASE_URL: `http://127.0.0.1:${upstreamPort}`,
    ALLOWED_ORIGINS: 'https://lanka.example', RATE_PER_MIN: '1000',
  });
  app = createApp(config).listen(0);
  base = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
});
after(() => { app.close(); upstream.close(); });

const ask = (body: unknown, headers: Record<string, string> = {}) => fetch(`${base}/guide`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://lanka.example', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
const valid = { work: 'hay-market.jpg', messages: [{ role: 'user', text: 'Хто автор?' }] };

test('health', async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200);
});

test('стрімить текст і передає контекст твору та ключ у Gemini', async () => {
  upstreamBodies = []; upstreamMode = 'ok';
  const res = await ask({ ...valid, messages: [{ role: 'user', text: 'Привіт' }, { role: 'guide', text: 'Вітаю. '.repeat(100) }, { role: 'user', text: 'Хто автор?' }] });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://lanka.example');
  const text = await res.text();
  const events = text.trim().split('\n\n').map(line => JSON.parse(line.slice(6)));
  assert.equal(events.filter(e => e.text).map(e => e.text).join(''), 'Привіт, це відповідь.');
  assert.deepEqual(events.at(-1), { done: true });

  const sent = upstreamBodies[0];
  assert.equal(sent.key, 'test-key');
  assert.match(sent.url, /gemini-3\.5-flash-lite:streamGenerateContent\?alt=sse/);
  assert.match(sent.body.systemInstruction.parts[0].text, /Сінний ринок/);
  assert.deepEqual(sent.body.contents.map((c: any) => c.role), ['user', 'model', 'user']);
  assert.equal(sent.body.generationConfig.temperature, undefined);
});

test('відхиляє чужий origin, невідомий твір і погані повідомлення', async () => {
  assert.equal((await ask(valid, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await ask({ ...valid, work: '../etc/passwd' })).status, 400);
  assert.equal((await ask('not json')).status, 400);
  assert.equal((await ask({ ...valid, messages: [{ role: 'user', text: 'x'.repeat(301) }] })).status, 400);
  assert.equal((await ask({ ...valid, messages: [{ role: 'guide', text: 'я перший' }] })).status, 400);
  assert.equal((await ask({ ...valid, messages: [] })).status, 400);
  assert.equal((await ask({ ...valid, messages: Array.from({ length: 13 }, () => ({ role: 'user', text: 'a' })) })).status, 400);
  assert.equal((await ask('x'.repeat(9000))).status, 413);
});

test('помилка Gemini → 502, порожня відповідь → ввічлива відмова', async () => {
  upstreamMode = 'fail';
  assert.equal((await ask(valid)).status, 502);
  upstreamMode = 'empty';
  const res = await ask(valid);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /не можу відповісти/);
});

test('preflight дозволяє лише відомий origin', async () => {
  const ok = await fetch(`${base}/guide`, { method: 'OPTIONS', headers: { origin: 'https://lanka.example' } });
  assert.equal(ok.status, 204);
  const bad = await fetch(`${base}/guide`, { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
  assert.equal(bad.status, 403);
});

test('без ключа — 503', async () => {
  const bare = createApp(configFromEnv({ ALLOWED_ORIGINS: 'https://lanka.example' })).listen(0);
  const res = await fetch(`http://127.0.0.1:${(bare.address() as AddressInfo).port}/guide`, {
    method: 'POST', headers: { origin: 'https://lanka.example' }, body: JSON.stringify(valid),
  });
  assert.equal(res.status, 503);
  bare.close();
});

test('ліміт: хвилинний, добовий і глобальний', () => {
  let now = Date.UTC(2026, 10, 18, 12);
  const limit = createLimiter({ perMinute: 2, perDay: 3, globalPerDay: 4 }, () => now);
  assert.equal(limit('a').ok, true);
  assert.equal(limit('a').ok, true);
  const blocked = limit('a');
  assert.equal(blocked.ok, false);
  now += 61_000;
  assert.equal(limit('a').ok, true);          // 3-й за добу
  now += 61_000;
  assert.equal(limit('a').ok, false);         // добовий ліміт IP
  assert.equal(limit('b').ok, true);          // 4-й глобально
  assert.equal(limit('c').ok, false);         // глобальний ліміт
  now += 24 * 3600_000;
  assert.equal(limit('c').ok, true);          // новий день
});

test('разовий збій Gemini (500) перечікується повтором', async () => {
  upstreamBodies = [];
  upstreamMode = 'fail-once';
  const res = await ask(valid);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /це відповідь/);
  assert.equal(upstreamBodies.length, 2);
});

test('усі твори каталогу доступні гіду з контекстом своєї епохи', async () => {
  upstreamMode = 'ok';
  upstreamBodies = [];
  for (const work of works.artworks) {
    const response = await ask({ ...valid, work: work.image });
    assert.equal(response.status, 200, work.image);
    await response.text();
    const system = upstreamBodies.at(-1).body.systemInstruction.parts[0].text;
    assert(system.includes(work.title), work.image);
    assert(system.endsWith('context' in work ? work.context : works.context), work.image);
  }
});
