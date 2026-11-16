import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Timeline } from './Timeline';
import { epochs, narrators } from './data';
import cover from './cover.png';

function Home() {
  return <section className="home-grid">
    <div>
      <p className="label">Мандрівка крізь епохи</p>
      <h1>Відкрий українське мистецтво</h1>
      <p className="my-6 max-w-md">Від трипільської кераміки до сучасних інсталяцій. Обери свій шлях історією мистецтва.</p>
      <Link className="button" to="/journey">До мандрівки <span aria-hidden="true">↗</span></Link>
    </div>
    <img className="cover" src={cover} alt="Фрагмент стилізованого живописного портрета" />
  </section>;
}

function Journey() {
  const [narratorId, setNarratorId] = useState(() => sessionStorage.getItem('lanka-narrator') ?? '');
  const narrator = narrators.find(item => item.id === narratorId);
  return <section>
    <Link className="back" to="/">← Головна</Link>
    <h1>Мандрівка</h1>
    <p className="my-4">Обери зупинку або почни маршрут із Трипілля.</p>
    <Link className="button" to={`/epoch/${epochs[0].id}`}>Почати мандрівку →</Link>
    <Timeline />
    <section className="panel mx-auto max-w-lg">
      <h2>Обери характер гіда</h2>
      <div className="my-4 flex flex-wrap gap-2" aria-label="Стиль гіда" role="group">
        {narrators.map(item => <button type="button" className="chip" key={item.id}
          aria-pressed={narratorId === item.id} onClick={() => {
            sessionStorage.setItem('lanka-narrator', item.id);
            setNarratorId(item.id);
          }}>{item.title}</button>)}
      </div>
      <p aria-live="polite">{narrator?.sample ?? 'Обери стиль, щоб побачити приклад репліки.'}</p>
      <p className="mt-2 text-sm opacity-75">Демо голосового супроводу · текстовий приклад</p>
    </section>
  </section>;
}

function EpochPage() {
  const { id } = useParams();
  const index = epochs.findIndex(epoch => epoch.id === id);
  const epoch = epochs[index];
  if (!epoch) return <MissingPage />;
  const next = epochs[index + 1];
  return <article>
    <Link className="back" to="/journey">← До маршруту</Link>
    <div className="home-grid">
      <div>
        <p className="label">{epoch.period}</p>
        <h1>{epoch.title}</h1>
        <p className="my-5 max-w-xl">{epoch.description}</p>
      </div>
      <figure>
        <div className="epoch-art" style={{ background: `conic-gradient(from 42deg, ${epoch.palette.join(', ')}, ${epoch.palette[0]})` }} />
        <figcaption className="mt-2 text-sm opacity-75">Демонстраційна композиція</figcaption>
      </figure>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="panel"><h2>Митці</h2><ul className="mt-3 list-disc space-y-2 pl-5">
        {epoch.artists.map(artist => <li key={artist}>{artist}</li>)}
      </ul></section>
      <section className="panel"><h2>Твори</h2><ul className="mt-3 space-y-3">
        {epoch.works.map(work => <li key={work.title}>
          {work.url ? <a className="underline underline-offset-4" href={work.url} target="_blank" rel="noreferrer">{work.title} ↗</a> : <strong>{work.title}</strong>}
          <p>{work.note}</p>
        </li>)}
      </ul></section>
    </div>
    <div className="mt-6">
      {next ? <Link className="button" to={`/epoch/${next.id}`}>Наступна зупинка →</Link>
        : <Link className="button" to="/journey">Завершити мандрівку →</Link>}
    </div>
  </article>;
}

function MissingPage() {
  return <section><h1>Сторінку не знайдено</h1><Link className="back" to="/journey">← До маршруту</Link></section>;
}

export function App() {
  const location = useLocation();
  const reduce = useReducedMotion();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
  }, [location.pathname]);
  return <>
    <header className="shell flex items-center justify-between border-b border-ink/20 py-5">
      <Link className="logo" to="/">Ланка<span aria-hidden="true">∞</span></Link>
      <nav aria-label="Основна навігація"><Link className="back" to="/journey">Маршрут</Link></nav>
    </header>
    <main className="shell py-9 sm:py-14" tabIndex={-1}>
      <motion.div key={location.pathname} initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.24 }}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/epoch/:id" element={<EpochPage />} />
          <Route path="*" element={<MissingPage />} />
        </Routes>
      </motion.div>
    </main>
  </>;
}
