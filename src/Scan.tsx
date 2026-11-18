import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { artworkEpoch, artworkOf, descriptionOf, imageUrl } from './artworkCatalog';
import { loadModel, recognize, type Result } from './scan/recognize';

type State =
  | { step: 'idle' }
  | { step: 'working'; photo: string }
  | { step: 'done'; photo: string; result: Result }
  | { step: 'error'; message: string };

function ArtworkCard({ image }: { image: string }) {
  const artwork = artworkOf(image);
  if (!artwork?.credit) return null;
  return <article className="scan-card">
    <img src={imageUrl(image)} alt={artwork.title} />
    <div>
      <h2>{artwork.title}</h2>
      <p className="scan-description">{descriptionOf[image]}</p>
      <ul className="scan-credit">{artwork.credit.map(line => <li key={line}>{line}</li>)}</ul>
    </div>
  </article>;
}

function GuideLink({ image }: { image: string }) {
  return <Link className="button guide-primary scan-guide-link" to={`/guide?work=${encodeURIComponent(image)}`}>
    Розпитати Ланка-Гіда про цей твір →
  </Link>;
}

export function Scan() {
  const [state, setState] = useState<State>({ step: 'idle' });
  const [progress, setProgress] = useState<number | null>(0);
  const [picked, setPicked] = useState<string | null>(null);
  const photoUrl = useRef<string | null>(null);

  // Модель вантажиться ще до першого фото: поки людина дійде до картини
  // й відкриє камеру, вона вже готова.
  useEffect(() => {
    loadModel(setProgress).then(() => setProgress(null), () => setProgress(null));
    return () => { if (photoUrl.current) URL.revokeObjectURL(photoUrl.current); };
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    const photo = photoUrl.current = URL.createObjectURL(file);
    setPicked(null);
    setState({ step: 'working', photo });
    try {
      setState({ step: 'done', photo, result: await recognize(file) });
    } catch {
      setState({ step: 'error', message: 'Не вдалося обробити фото. Перевір з’єднання й спробуй ще раз.' });
    }
  }

  const foundImage = state.step === 'done'
    ? state.result.verdict === 'match' ? state.result.matches[0]?.image : picked
    : null;
  const busy = state.step === 'working';
  const loadingModel = progress !== null;
  return <section className="scan">
    <h1>РОЗПІЗНАЙ АРТОБ’ЄКТ</h1>
    <p className="scan-lead">Сфотографуй артефакт, наприклад картину в музеї - Ланка-Гід розповість тобі більше про неї</p>

    <div className="scan-actions">
      <label className="button scan-button" aria-disabled={busy}>
        Сфотографувати
        <input type="file" accept="image/*" capture="environment" disabled={busy}
          onChange={event => { void onFile(event.target.files?.[0]); event.target.value = ''; }} />
      </label>
      <label className="scan-gallery" aria-disabled={busy}>
        або обрати з галереї
        <input type="file" accept="image/*" disabled={busy}
          onChange={event => { void onFile(event.target.files?.[0]); event.target.value = ''; }} />
      </label>
    </div>
    {loadingModel && <p className="scan-status" role="status">
      Готуємо розпізнавання{progress ? ` · ${Math.round(progress)}%` : '…'} Перший запуск довший, далі працює швидко.
    </p>}

    {state.step === 'working' && <div className="scan-result" role="status">
      <img className="scan-photo" src={state.photo} alt="Твоє фото" />
      <p className="scan-status">Розпізнаємо…</p>
    </div>}

    {state.step === 'error' && <p className="scan-status" role="alert">{state.message}</p>}

    {state.step === 'done' && <div className="scan-result" aria-live="polite">
      <img className="scan-photo" src={state.photo} alt="Твоє фото" />
      {state.result.verdict === 'match' && <>
        <p className="scan-verdict">Це вона:</p>
        <GuideLink image={state.result.matches[0].image} />
        <ArtworkCard image={state.result.matches[0].image} />
      </>}
      {state.result.verdict === 'maybe' && <>
        <p className="scan-verdict">Не певні. Може, це одна з цих:</p>
        <ul className="scan-options">
          {state.result.matches.map(match => <li key={match.image}>
            <button type="button" aria-pressed={picked === match.image}
              onClick={() => setPicked(match.image)}>
              <img src={imageUrl(match.image)} alt="" />
              <span>{artworkOf(match.image)?.title ?? match.image}</span>
            </button>
          </li>)}
        </ul>
        {picked && <><GuideLink image={picked} /><ArtworkCard image={picked} /></>}
      </>}
      {state.result.verdict === 'none' && <p className="scan-verdict">
        Цієї картини немає в нашій добірці. Спробуй знімати рівніше, без відблисків і щоб твір займав увесь кадр.
      </p>}
    </div>}

    {foundImage && artworkOf(foundImage) && <div className="scan-result-actions">
      <Link className="scan-all" to={artworkEpoch.route}>
        Переглянути всі твори епохи: {artworkEpoch.title} →
      </Link>
    </div>}
  </section>;
}
