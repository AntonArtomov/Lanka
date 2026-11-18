// Перевірка розпізнавання всіх еталонів після обробки, подібної до браузерної.
// node --use-system-ca scripts/check-recognition.ts
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';
import sharp from 'sharp';
import { MODEL_ID, MODEL_DTYPE, pool, cosine } from '../src/scan/vector.ts';

const dir = new URL('../src/artworks/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('../src/data/embeddings.json', import.meta.url), 'utf8'));
const extractor = await pipeline('image-feature-extraction', MODEL_ID, { dtype: MODEL_DTYPE });
const files = readdirSync(dir).filter(file => /\.(jpe?g|png|webp)$/i.test(file)).sort();

async function check(file: string, distorted = false) {
  let image = sharp(fileURLToPath(new URL(file, dir))).rotate();
  if (distorted) {
    const { width = 0, height = 0 } = await image.metadata();
    image = image.extract({ left: Math.round(width * .08), top: Math.round(height * .08), width: Math.floor(width * .84), height: Math.floor(height * .84) })
      .rotate(3, { background: '#444' }).modulate({ brightness: .85 });
  }
  const buffer = await image.resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  const out = await extractor(new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }));
  const [, tokens, dim] = out.dims;
  const query = pool(out.data as Float32Array, tokens, dim);
  const scores = new Map<string, number>();
  for (const entry of index.entries) scores.set(entry.image, Math.max(scores.get(entry.image) ?? -1, cosine(query, entry.vector)));
  const matches = [...scores].sort((a, b) => b[1] - a[1]);
  console.log(`${file}${distorted ? ' (crop/rotate/dim)' : ''}: ${matches.slice(0, 2).map(([name, score]) => `${name} ${score.toFixed(3)}`).join(' / ')}`);
  assert.equal(matches[0][0], file, `Неправильний збіг для ${file}`);
  assert(matches[0][1] >= .55, `${file}: бал нижче порога розпізнавання`);
}

for (const file of files) await check(file);
for (const file of ['bridge-sevres.jpg', 'paris.jpg', 'girl-red-hat.jpg']) await check(file, true);
console.log(`Успішно: ${files.length} оригіналів і 3 спотворені зображення.`);
