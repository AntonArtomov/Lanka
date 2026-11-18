import { Link } from 'react-router-dom';
import { BrandLink } from './BrandLink';
import { useCollection } from './collection';
import artwork from './data/artwork-day.json';
import portrait from './artworks/girl-red-hat.jpg';

export function MyCollection() {
  const { ids, setSaved, storageError } = useCollection();
  const works = ids.includes(artwork.id) ? [artwork] : [];

  return <section className="my-collection">
    <p className="art-day-label">Особистий простір</p>
    <h1>Моя колекція</h1>
    <p className="collection-intro">Твори, до яких хочеться повертатися.</p>
    {storageError && <p role="alert">Не вдалося змінити колекцію. Перевір доступ браузера до локального сховища.</p>}
    {works.length ? <>
      <p className="collection-count" role="status">Збережено: {works.length}</p>
      <ul className="collection-grid">
        {works.map(work => <li key={work.id} className="collection-card">
          <Link className="collection-work" to="/artworks/story">
            <img src={portrait} width="447" height="600" alt={work.title} />
            <h2>{work.title}</h2>
            <p>{work.artist} · {work.year}</p>
            <span className="collection-read">Читати історію ↗</span>
          </Link>
          <button type="button" className="collection-remove" onClick={() => setSaved(work.id, false)}
            aria-label={`Прибрати «${work.title}» з колекції`}>Прибрати з колекції</button>
        </li>)}
      </ul>
      <Link className="collection-discover" to="/artworks">До картини дня ↗</Link>
    </> : <div className="collection-empty">
      <div className="collection-empty-art" aria-hidden="true"><BrandLink /><BrandLink /><BrandLink /></div>
      <h2>Твоя колекція починається з одного твору</h2>
      <p>Відкрий картину дня й натисни «Зберегти до колекції». Вона з’явиться тут.</p>
      <Link className="button" to="/artworks">Відкрити картину дня <span aria-hidden="true">↗</span></Link>
    </div>}
  </section>;
}
