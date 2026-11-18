import { Link } from 'react-router-dom';
import portrait from './artworks/girl-head.jpg';

export function AvantIntro({ preview = false }: { preview?: boolean }) {
  return <article className="avant-intro" aria-label={preview ? 'Попередній перегляд епохи' : undefined}>
    <figure>
      <img src={portrait} width="772" height="768" alt="Портрет білявої дівчинки в рожевому одязі на червоному тлі" />
      {preview ? <figcaption>«Голова дівчинки», Микола Касперович. 1920-ті. Школа неовізантизму. Портрет.</figcaption>
        : <figcaption className="avant-cover-caption"><strong>Голова дівчинки</strong><br />Касперович Микола<br />1920-ті<br />школа неовізантизму<br />портрет</figcaption>}
    </figure>
    {!preview && <h1>Ранній модернізм і український авангард</h1>}
    {!preview && <blockquote className="avant-quote">
      <p>Український авангард збили у польоті зенітки сталінського терору. Розстріляно бойчукістів, фізично покалічено їхні картини, а також картини художників, які «працювали під впливом ворогів народу».</p>
      <footer>Дмитро Горбачов</footer>
    </blockquote>}
    {!preview && <Link className="avant-explore" to="/epoch/avant/explore">Досліджуй <span aria-hidden="true">→</span></Link>}
  </article>;
}
