/**
 * Як працює «Впізнай картину»
 *
 * 1. Екран починає завантажувати модель до вибору фото. Після вибору
 *    враховуємо орієнтацію зображення й зменшуємо довшу сторону до 640 px,
 *    якщо вона більша. Фото обробляється в браузері.
 *
 * 2. DINOv2 представляє фото вектором із 768 чисел: ознаки всього
 *    зображення та усереднені ознаки його ділянок. Індекс створено тією ж
 *    моделлю. Для кожного з 10 творів він містить 12 варіантів, зокрема
 *    оригінал, обрізки, нахили й імітації різного освітлення.
 *
 * 3. Порівнюємо фото зі 120 еталонами, беремо найкращий збіг для кожного
 *    твору й сортуємо твори за схожістю. Від 0,55 показуємо один збіг,
 *    за балу від 0,40 і нижче 0,55 пропонуємо до трьох варіантів,
 *    а нижче 0,40 повідомляємо, що збігу в добірці немає.
 *    Бал вимірює схожість і не є відсотком упевненості.
 */
import { MODEL_DTYPE, MODEL_ID, cosine, pool } from './vector';

type Extractor = (input: string) => Promise<{ data: ArrayLike<number>; dims: number[] }>;
export interface Match { image: string; score: number }
export interface Result { matches: Match[]; verdict: 'match' | 'maybe' | 'none' }

// Пороги підібрані на синтетичних спотвореннях (кроп, нахил, відблиск,
// слабке світло): шум і порожні кадри давали ≤0.33, спотворені копії ≥0.79.
// Реальні фото з музею гірші, тому «maybe» залишає вибір користувачеві.
const MATCH = 0.55;
const MAYBE = 0.4;
const MAX_SIDE = 640;

let loading: Promise<Extractor> | undefined;

export function loadModel(onProgress?: (percent: number) => void): Promise<Extractor> {
  loading ??= import('@huggingface/transformers').then(async ({ pipeline }) => {
    const files = new Map<string, number>();
    const extractor = await pipeline('image-feature-extraction', MODEL_ID, {
      dtype: MODEL_DTYPE,
      progress_callback: (p: { status: string; file?: string; progress?: number }) => {
        if (p.status !== 'progress' || !p.file || p.progress === undefined) return;
        files.set(p.file, p.progress);
        onProgress?.([...files.values()].reduce((a, b) => a + b, 0) / files.size);
      },
    });
    return extractor as unknown as Extractor;
  });
  loading.catch(() => { loading = undefined; });
  return loading;
}

// Фото з телефона на 12 Мп ні до чого — модель однаково стискає до 224 px.
// Заодно canvas застосовує EXIF-поворот.
async function downscale(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * k);
  canvas.height = Math.round(bitmap.height * k);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((ok, fail) =>
    canvas.toBlob(b => (b ? ok(b) : fail(new Error('canvas'))), 'image/jpeg', 0.9));
  return URL.createObjectURL(blob);
}

export async function recognize(file: Blob): Promise<Result> {
  const [extractor, index] = await Promise.all([loadModel(), import('../data/embeddings.json')]);
  const url = await downscale(file);
  try {
    const out = await extractor(url);
    const [, tokens, dim] = out.dims;
    const query = pool(out.data, tokens, dim);
    const best = new Map<string, number>();
    for (const entry of index.default.entries) {
      const score = cosine(query, entry.vector);
      if (score > (best.get(entry.image) ?? -1)) best.set(entry.image, score);
    }
    const matches = [...best].map(([image, score]) => ({ image, score })).sort((a, b) => b.score - a.score);
    const top = matches[0]?.score ?? 0;
    return { matches: matches.slice(0, 3), verdict: top >= MATCH ? 'match' : top >= MAYBE ? 'maybe' : 'none' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
