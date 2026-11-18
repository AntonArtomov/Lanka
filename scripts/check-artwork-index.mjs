import { readdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const readJson = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const files = readdirSync(new URL('../src/artworks/', import.meta.url)).filter(name => /\.(jpe?g|png|webp)$/i.test(name)).sort();
const index = readJson('embeddings');
const catalog = new Set([
  'girl-head.jpg', 'girl-red-hat.jpg',
  ...readJson('avant-slides').filter(slide => slide.type === 'artwork').map(slide => slide.image),
  ...readJson('additional-artworks').map(work => work.image),
]);
const indexed = [...new Set(index.entries.map(entry => entry.image))].sort();
assert.deepEqual(indexed, files, 'Індекс застарів: виконай npm run embeddings, потім повтори збірку.');
assert.deepEqual([...catalog].sort(), files, 'Кожна репродукція повинна мати запис у каталозі для аналізатора й Гіда.');
for (const file of files) {
  const entries = index.entries.filter(entry => entry.image === file);
  assert.equal(new Set(entries.map(entry => entry.variant)).size, 12, `${file}: очікуються 12 варіантів`);
  assert(entries.every(entry => entry.vector.length === 768 && entry.vector.every(Number.isFinite)), `${file}: некоректний вектор`);
}
console.log(`Каталог та індекс узгоджені: ${files.length} репродукцій, ${index.entries.length} векторів.`);
