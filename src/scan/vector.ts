// Спільне для скрипта індексації (Node) і браузера: ембедінг у обох
// місцях має рахуватися однаково, інакше вектори не можна порівнювати.

export const MODEL_ID = 'Xenova/dinov2-small';
export const MODEL_DTYPE = 'q8';

// Вихід DINOv2: [1, 1 + patches, dim]. Беремо CLS-токен і середнє
// по патчах — перший тримає глобальний зміст, друге стійкіше до кропу.
export function pool(data: ArrayLike<number>, tokens: number, dim: number): number[] {
  const out = new Array<number>(dim * 2).fill(0);
  for (let d = 0; d < dim; d++) out[d] = data[d];
  for (let t = 1; t < tokens; t++)
    for (let d = 0; d < dim; d++) out[dim + d] += data[t * dim + d] / (tokens - 1);
  const norm = Math.hypot(...out) || 1;
  return out.map(v => v / norm);
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}
