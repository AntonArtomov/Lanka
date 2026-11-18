import { Link } from 'react-router-dom';
import { useCollection } from './collection';
import artwork from './data/artwork-day.json';
import portrait from './artworks/girl-red-hat.jpg';

function Bookmark({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
    <path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>;
}

export function ArtworkDay({ story = false }: { story?: boolean }) {
  const { ids, setSaved, storageError } = useCollection();
  const saved = ids.includes(artwork.id);

  function toggleSaved() {
    setSaved(artwork.id, !saved);
  }

  const saveButton = <button type="button" className="art-day-save" aria-pressed={saved} onClick={toggleSaved}>
    <Bookmark filled={saved} />{saved ? 'У колекції' : 'Зберегти до колекції'}
  </button>;

  return <article className={`art-day${story ? ' art-day-story' : ''}`}>
    <p className="art-day-label">Карбуй образи</p>
    {!story && <h1>Картина дня</h1>}
    <div className="art-day-feature">
      <img className="art-day-image" src={portrait} width="447" height="600"
        alt="Дівчина з темним волоссям у червоному капелюсі та чорній сукні" />
      <div className="art-day-summary">
        {story ? <h1>{artwork.title}</h1> : <h2>{artwork.title}</h2>}
        <p className="art-day-credit">{artwork.artist} · {artwork.year}</p>
        {story ? saveButton : <Link className="art-day-save art-day-open" to="/artworks/story">Читати про картину <span aria-hidden="true">→</span></Link>}
      </div>
    </div>
    {storageError && <p role="alert">Не вдалося зберегти картину. Перевір доступ браузера до локального сховища.</p>}
    {story && <>
      <div className="art-day-text">
        {artwork.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <dl className="art-day-facts">
        <div>
          <dt><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4c-1-.6-1-2 .5-2H17a4 4 0 0 0 4-4c0-4.5-4-8-9-8Z" stroke="currentColor" strokeWidth="1.5" /><g fill="currentColor"><circle cx="7" cy="10" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7" r="1" /><circle cx="17" cy="10" r="1" /></g></svg><span className="sr-only">Матеріал і розмір</span></dt>
          <dd>{artwork.technique}</dd>
        </div>
        <div>
          <dt><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 8 9-5 9 5H3Zm1 12h16M3 22h18M6 10v8m6-8v8m6-8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="sr-only">Музей</span></dt>
          <dd>{artwork.museum}</dd>
        </div>
      </dl>
      <p className="art-day-source">{artwork.source}</p>
    </>}
  </article>;
}
