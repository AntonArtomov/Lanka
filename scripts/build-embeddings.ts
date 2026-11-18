// Рахує ембедінги репродукцій для розпізнавання на екрані /scan.
// Запуск: npm run embeddings  (потрібен інтернет — модель тягнеться з Hugging Face).
// Для кожної картини додаються спотворені варіанти, що імітують фото з музею:
// кропи, нахил, перспектива, відблиск, слабке світло, низька якість.
import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';
import sharp from 'sharp';
import { MODEL_DTYPE, MODEL_ID, pool } from '../src/scan/vector.ts';

const dir = new URL('../src/artworks/', import.meta.url);
const outFile = new URL('../src/data/embeddings.json', import.meta.url);

type Variant = { name: string; make: (img: sharp.Sharp, w: number, h: number) => sharp.Sharp };
const crop = (f: number, ax: number, ay: number): Variant['make'] => (img, w, h) =>
  img.extract({
    left: Math.round((w * (1 - f)) * ax), top: Math.round((h * (1 - f)) * ay),
    width: Math.round(w * f), height: Math.round(h * f),
  });
const variants: Variant[] = [
  { name: 'original', make: img => img },
  { name: 'crop-center', make: crop(0.85, 0.5, 0.5) },
  { name: 'crop-tl', make: crop(0.78, 0, 0) },
  { name: 'crop-br', make: crop(0.78, 1, 1) },
  { name: 'crop-tr', make: crop(0.78, 1, 0) },
  { name: 'crop-bl', make: crop(0.78, 0, 1) },
  { name: 'rotate-left', make: img => img.rotate(-6, { background: '#444' }) },
  { name: 'rotate-right', make: img => img.rotate(6, { background: '#444' }) },
  { name: 'perspective', make: img => img.affine([[1, 0.12], [0.04, 0.92]], { background: '#444' }) },
  { name: 'dark', make: img => img.modulate({ brightness: 0.7, saturation: 0.9 }) },
  { name: 'bright-glare', make: img => img.modulate({ brightness: 1.3 }).gamma(1.6) },
  { name: 'lowres', make: (img, w) => img.resize(Math.round(w * 0.3)).blur(1) },
];

const extractor = await pipeline('image-feature-extraction', MODEL_ID, { dtype: MODEL_DTYPE });
const files = readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const entries: { image: string; variant: string; vector: number[] }[] = [];

for (const file of files) {
  const src = sharp(fileURLToPath(new URL(file, dir)));
  const { width = 0, height = 0 } = await src.metadata();
  for (const v of variants) {
    const buf = await v.make(src.clone(), width, height).jpeg().toBuffer();
    const blob = new Blob([new Uint8Array(buf)], { type: 'image/jpeg' });
    const out = await extractor(blob);
    const [, tokens, dim] = out.dims;
    const vector = pool(out.data as Float32Array, tokens, dim).map(x => Math.round(x * 1000) / 1000);
    entries.push({ image: file, variant: v.name, vector });
  }
  console.log(file, 'ok');
}

writeFileSync(outFile, JSON.stringify({ model: MODEL_ID, dtype: MODEL_DTYPE, entries }));
console.log(`записано ${entries.length} векторів`);
