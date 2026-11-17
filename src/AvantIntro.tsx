import { Link } from 'react-router-dom';
import portrait from './artworks/girl-head.jpg';

export function AvantIntro({ preview = false }: { preview?: boolean }) {
  const Title = preview ? 'h2' : 'h1';

  return <article className="avant-intro" aria-label={preview ? 'Попередній перегляд епохи' : undefined}>
    <figure>
      <img src={portrait} width="772" height="768" alt="Портрет білявої дівчинки в рожевому одязі на червоному тлі" />
      <figcaption>Голова дівчинки · Микола Касперович<br />1920-ті рр. · Школа неовізантизму<br />Національний художній музей України</figcaption>
    </figure>
    <Title>Ранній модернізм і український авангард</Title>
    <Link className="avant-explore" to="/epoch/avant/explore">Досліджуй <span aria-hidden="true">→</span></Link>
  </article>;
}
