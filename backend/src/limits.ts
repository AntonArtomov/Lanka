// Ліміти в пам'яті процесу. Під один под цього досить; після масштабування
// на кілька реплік ліміт діє на кожну окремо.
export interface Limits { perMinute: number; perDay: number; globalPerDay: number }
export type Verdict = { ok: true } | { ok: false; retryAfter: number };

export function createLimiter(limits: Limits, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  let day = '';
  let total = 0;

  return function check(ip: string): Verdict {
    const t = now();
    const today = new Date(t).toISOString().slice(0, 10);
    if (today !== day) { day = today; total = 0; hits.clear(); }
    if (total >= limits.globalPerDay) return { ok: false, retryAfter: 3600 };

    const dayHits = (hits.get(ip) ?? []);
    const minuteHits = dayHits.filter(h => t - h < 60_000);
    if (dayHits.length >= limits.perDay) return { ok: false, retryAfter: 3600 };
    if (minuteHits.length >= limits.perMinute) {
      return { ok: false, retryAfter: Math.ceil((60_000 - (t - minuteHits[0])) / 1000) };
    }
    dayHits.push(t);
    hits.set(ip, dayHits);
    total++;
    return { ok: true };
  };
}
