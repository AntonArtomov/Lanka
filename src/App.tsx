import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Timeline } from './Timeline';
import { epochs } from './data';
import { HeroChain } from './HeroChain';
import { BrandLink } from './BrandLink';
import { AvantIntro } from './AvantIntro';
import { AvantReader } from './AvantReader';
import { AvantQuiz, QuizHub } from './AvantQuiz';
import { Scan } from './Scan';
import { ArtworkGuide } from './ArtworkGuide';
import { clearRewards, getRewardCount } from './rewards';
import { RewardLeaderboard } from './RewardLeaderboard';
import { ProfileBadge, Welcome, readProfile, saveProfile, type DemoProfile } from './DemoProfile';
const sections = [
  { path: '/journey', title: 'Збирай ланцюг', caption: 'Досліджуй епохи історії українського мистецтва', color: 'var(--color-gold)' },
  { path: '/artworks', title: 'Карбуй образи', caption: 'Відкривай щодня нові артефакти та шедеври', color: 'var(--color-sage)' },
  { path: '/quiz', title: 'Гартуй пам’ять', caption: 'Проходь квізи для запам’ятовування вивченого матеріалу', color: 'var(--color-clay)' },
  { path: '/scan', title: 'Впізнай картину', caption: 'Сфотографуй твір у музеї, і Ланка розпізнає його', color: 'var(--color-brand)' },
];

function Home({ onReward }: { onReward: () => void }) {
  return <section className="brand-home">
    <h1>Українське<br />мистецтво</h1>
    <p className="brand-subtitle">Ланка за ланкою</p>
    <p className="brand-intro">Відтворюй ланцюжок історії через ключові події й твори</p>
    <HeroChain onReward={onReward} />
    <ul className="brand-menu">
      {sections.map(section => <li key={section.path}>
        <Link to={section.path}>
          <BrandLink style={{ color: section.color }} />
          <span>
            <strong>{section.title}</strong>
            <span className="brand-caption">{section.caption}</span>
          </span>
          <span className="brand-arrow" aria-hidden="true">↗</span>
        </Link>
      </li>)}
    </ul>
  </section>;
}

function SectionPreview({ section }: { section: typeof sections[number] }) {
  return <section>
    <Link className="back" to="/">← Головна</Link>
    <h1>{section.title}</h1>
    <p className="my-4">{section.caption}</p>
    <p>Розділ у підготовці.</p>
  </section>;
}

function Journey() {
  return <section>
    <Link className="back" to="/">← Головна</Link>
    <h1 className="mx-auto max-w-2xl">Збери ланки у єдиний ланцюг</h1>
    <Timeline />
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
  const navigate = useNavigate();
  const [resetVersion, setResetVersion] = useState(0);
  const [rewardCount, setRewardCount] = useState(getRewardCount);
  const [profile, setProfile] = useState(readProfile);
  const hasProfile = Boolean(profile);
  const reduce = useReducedMotion();
  const isHome = location.pathname === '/';
  const isAvantIntro = location.pathname === '/epoch/avant';
  const isAvantReader = location.pathname === '/epoch/avant/explore';
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
  }, [location.pathname, hasProfile]);

  function continueWith(profile: DemoProfile) {
    saveProfile(profile);
    setProfile(profile);
  }
  function refreshRewards() {
    setRewardCount(getRewardCount());
  }

  function resetDemo() {
    clearRewards();
    refreshRewards();
    if (location.state?.celebrateAvant) navigate(location.pathname, { replace: true, state: null });
    setResetVersion(version => version + 1);
  }

  return <>
    <header className={isHome || !profile ? "brand-header" : "shell brand-header-inner"}>
      <div className="flex items-center gap-4">
        {profile && isAvantReader && <Link className="avant-back" to="/epoch/avant" aria-label="До вступу">←</Link>}
        {profile && isAvantIntro && <Link className="avant-back" to="/journey" aria-label="До карти епох">←</Link>}
        <Link className="brand-wordmark" to="/"><BrandLink />ЛАНКА</Link>
      </div>
      {profile && <div className="brand-header-actions">
        <RewardLeaderboard nickname={profile.nickname} score={rewardCount} />
        <ProfileBadge profile={profile} onSave={continueWith} onReset={resetDemo} />
      </div>}
    </header>
    <main className={!profile || isHome ? "brand-main" : isAvantReader ? "shell" : "shell py-9 sm:py-14"} tabIndex={-1}>
      {!profile ? <Welcome onContinue={continueWith} /> : <motion.div key={`${location.pathname}:${resetVersion}`} initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.24 }}>
        <Routes location={location}>
          <Route path="/" element={<Home onReward={refreshRewards} />} />
          <Route path="/journey" element={<Journey />} />
          {sections.slice(1, 2).map(section => <Route key={section.path} path={section.path}
            element={<SectionPreview section={section} />} />)}
          <Route path="/quiz" element={<QuizHub />} />
          <Route path="/quiz/avant" element={<AvantQuiz onReward={refreshRewards} />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/guide" element={<ArtworkGuide />} />
          <Route path="/epoch/avant" element={<AvantIntro />} />
          <Route path="/epoch/avant/explore" element={<AvantReader onReward={refreshRewards} />} />
          <Route path="/epoch/:id" element={<EpochPage />} />
          <Route path="*" element={<MissingPage />} />
        </Routes>
      </motion.div>}
    </main>
  </>;
}
