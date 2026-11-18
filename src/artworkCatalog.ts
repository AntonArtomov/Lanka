import slides from './data/avant-slides.json';
import descriptions from './data/artwork-descriptions.json';
import additionalArtworks from './data/additional-artworks.json';
import dailyArtwork from './data/artwork-day.json';
import chain from './data/chain.json';
import { epochPreviews } from './epochPreviews';

const images = import.meta.glob<string>('./artworks/*', { eager: true, query: '?url', import: 'default' });
export const descriptionOf: Record<string, string> = {
  ...descriptions,
  'bridge-sevres.jpg': slides.find(slide => slide.type === 'text' && slide.title === '«Міст. Севр»')?.paragraphs?.join('\n\n') ?? '',
  'girl-red-hat.jpg': dailyArtwork.paragraphs.join('\n\n'),
};
const coverArtwork = {
  image: 'girl-head.jpg',
  title: 'Голова дівчинки',
  credit: ['Касперович Микола', '1920-ті', 'школа неовізантизму', 'портрет'],
};
const artworks = [
  { ...coverArtwork, epochNumber: 7 },
  ...slides.filter(slide => slide.type === 'artwork').map(slide => ({ ...slide, epochNumber: 7 })),
  { image: 'girl-red-hat.jpg', title: dailyArtwork.title, credit: [dailyArtwork.artist, dailyArtwork.year, dailyArtwork.technique, dailyArtwork.museum], epochNumber: 7 },
  ...additionalArtworks,
];
for (const artwork of additionalArtworks) {
  descriptionOf[artwork.image] = artwork.image === 'trypillia-mask.jpg'
    ? 'Артефакт трипільської культури з нашої добірки.'
    : epochPreviews[artwork.epochNumber]?.caption ?? artwork.title;
}
export const artworkOf = (image: string) => artworks.find(item => item.image === image);
export const imageUrl = (image: string) => images[`./artworks/${image}`];

export const artworkEpoch = {
  title: 'Ранній модернізм і український авангард',
  route: '/epoch/avant/explore',
};

export function epochOf(image: string) {
  const number = artworkOf(image)?.epochNumber;
  if (!number) return undefined;
  return number === 7 ? { ...artworkEpoch, hasGallery: true }
    : { title: chain.find(epoch => epoch.number === number)?.title ?? '', route: '/journey', hasGallery: false };
}
