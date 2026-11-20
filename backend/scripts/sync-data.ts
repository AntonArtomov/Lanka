// Збирає data/works.json із даних фронтенду цього ж репозиторію.
// Docker-контекст бачить лише цю папку, тому копія лежить у git.
// Запуск після зміни слайдів чи описів: npm run sync-data
import { readFileSync, writeFileSync } from 'node:fs';

const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`../../src/data/${name}`, import.meta.url), 'utf8'));
const slides: { type: string; title: string; paragraphs?: string[]; image?: string; credit?: string[]; quote?: { text: string; author: string } }[] =
  read('avant-slides.json');
const descriptions: Record<string, string> = read('artwork-descriptions.json');
const additional: { image: string; title: string; credit: string[]; epochNumber: number }[] = read('additional-artworks.json');
const daily = read('artwork-day.json');
const chain: { number: number; title: string }[] = read('chain.json');

// Те саме, що coverArtwork у lanka/src/artworkCatalog.ts: обкладинка не є слайдом
const cover = {
  image: 'girl-head.jpg',
  title: 'Голова дівчинки',
  credit: ['Касперович Микола', '1920-ті', 'школа неовізантизму', 'портрет'],
};

descriptions['bridge-sevres.jpg'] = slides.find(slide => slide.title === '«Міст. Севр»')?.paragraphs?.join('\n') ?? '';
descriptions['girl-red-hat.jpg'] = daily.paragraphs.join('\n');

const artworks = [
  { ...cover, epochNumber: 7 },
  ...slides.filter(slide => slide.type === 'artwork').map(slide => ({ ...slide, epochNumber: 7 })),
  { image: 'girl-red-hat.jpg', title: daily.title, credit: [daily.artist, daily.year, daily.technique, daily.museum], epochNumber: 7 },
  ...additional,
].map(artwork => ({
  image: artwork.image!,
  title: artwork.title,
  credit: artwork.credit ?? [],
  description: descriptions[artwork.image!] ?? `${artwork.title}. ${(artwork.credit ?? []).join('. ')}`,
  // Іншим епохам не передаємо історію авангарду як їхній власний контекст.
  ...(artwork.epochNumber === 7 ? {} : { context: `Епоха: ${chain.find(epoch => epoch.number === artwork.epochNumber)?.title ?? ''}. Додаткові матеріали про цю епоху поки відсутні.` }),
}));

// Тексти про епоху: відповіді на «чому», «що було далі» беруться звідси
const context = slides
  .filter(slide => slide.type === 'text')
  .map(slide => `${slide.title}\n${(slide.paragraphs ?? []).join('\n')}${slide.quote ? `\n${slide.quote.text}\n${slide.quote.author}` : ''}`)
  .join('\n\n');

writeFileSync(new URL('../data/works.json', import.meta.url), JSON.stringify({ artworks, context }, null, 2) + '\n');
console.log(`works.json: ${artworks.length} творів, контекст ${context.length} символів`);
