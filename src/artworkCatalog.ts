import slides from './data/avant-slides.json';
import descriptions from './data/artwork-descriptions.json';

const images = import.meta.glob<string>('./artworks/*', { eager: true, query: '?url', import: 'default' });
export const descriptionOf: Record<string, string> = descriptions;
const coverArtwork = {
  image: 'girl-head.jpg',
  title: 'Голова дівчинки',
  credit: ['Касперович Микола', '1920-ті', 'школа неовізантизму', 'портрет'],
};
const artworks = [coverArtwork, ...slides.filter(slide => slide.type === 'artwork')];
export const artworkOf = (image: string) => artworks.find(item => item.image === image);
export const imageUrl = (image: string) => images[`./artworks/${image}`];

export const artworkEpoch = {
  title: 'Ранній модернізм і український авангард',
  route: '/epoch/avant/explore',
};
