import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { linkOutline } from './linkOutline';
import chain from './data/chain.json';
import { AvantIntro } from './AvantIntro';
import { epochPreviews } from './epochPreviews';
import { avantCompletionKey } from './rewards';

const completedColors = ['sage', 'brand', 'gold', 'clay', 'ink', 'sage'];
const spring = { type: 'spring', stiffness: 190, damping: 18 } as const;

function CompletedChain({ avantCompleted }: { avantCompleted: boolean }) {
  const id = useId();
  const rings = (avantCompleted ? [...completedColors, "gold"] : completedColors).map((color, index) => ({
    color,
    transform: `translate(${index % 2 ? 57 : 49} ${40 + index * 80}) rotate(${index % 2 ? 70.5 : 109.5}) scale(.52)`,
  }));

  const height = rings.length * 80;
  return <svg className="journey-chain-art" width="106" height={height} viewBox={`0 0 106 ${height}`} aria-hidden="true">
    <defs>
      {rings.slice(1).map((_, index) => {
        const maskId = `${id}-${index}`;
        return <mask key={maskId} id={maskId} maskUnits="userSpaceOnUse" x="-20" y="-30" width="146" height={height + 60}>
          <rect x="-20" y="-30" width="146" height={height + 60} fill="white" />
          <clipPath id={`${maskId}-window`}>
            <circle cx={index % 2 ? 80 : 26} cy={87 + index * 80} r="16" />
          </clipPath>
          <g clipPath={`url(#${maskId}-window)`}>
            <path d={linkOutline} transform={rings[index].transform} fill="none" stroke="black" strokeWidth="21" />
          </g>
        </mask>;
      })}
    </defs>
    {rings.map(({ color, transform }, index) => <g key={index} mask={index ? `url(#${id}-${index - 1})` : undefined}>
      <path d={linkOutline} transform={transform} fill="none" stroke={`var(--color-${color})`} strokeWidth="23" />
    </g>)}
  </svg>;
}

export function Timeline() {
  const reduced = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const [celebrating, setCelebrating] = useState(() => location.state?.celebrateAvant === true && !reduced);
  const [flight, setFlight] = useState<{ x: number; y: number; endX: number; endY: number }>();
  const chainList = useRef<HTMLOListElement>(null);
  const avantRing = useRef<SVGSVGElement>(null);
  const avantRow = useRef<HTMLLIElement>(null);
  const avantCompleted = sessionStorage.getItem(avantCompletionKey) === 'true';

  useEffect(() => {
    if (!location.state?.celebrateAvant) return;
    const frame = requestAnimationFrame(() => {
      avantRow.current?.scrollIntoView({ block: 'center' });
      if (celebrating && avantRing.current && chainList.current) {
        const ring = avantRing.current.getBoundingClientRect();
        const list = chainList.current.getBoundingClientRect();
        setFlight({ x: ring.left + ring.width / 2, y: ring.top + ring.height / 2, endX: list.left + 49, endY: list.top + 520 });
      }
      navigate(location.pathname, { replace: true, state: null });
    });
    return () => cancelAnimationFrame(frame);
  }, [celebrating, location.pathname, location.state, navigate]);
  const [lean, setLean] = useState(0);
  const [showPreview, setShowPreview] = useState<number | null>(null);

  useEffect(() => {
    if (!showPreview) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowPreview(null);
    }
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [showPreview]);
  const [focused, setFocused] = useState(false);

  function followPointer(event: PointerEvent<HTMLAnchorElement>) {
    if (reduced || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setLean(Math.max(-1, Math.min(1, (event.clientX - bounds.left - 50) / 50)));
  }

  const joined = avantCompleted && !celebrating;

  return <>
    <ol ref={chainList} aria-label="Епохи українського мистецтва" className="journey-chain">
    {chain.map(({ number, title }) => {
      const preview = epochPreviews[number];
      const canOpenAvant = number === 7 && !celebrating;
      const active = canOpenAvant && !avantCompleted;
      const completed = number <= completedColors.length || (number === 7 && joined);
      const angle = number % 2 ? 70.5 : 109.5;
      const movement = active ? lean * 13 : 0;
      const ring = completed ? <span aria-hidden="true" /> : <motion.svg ref={number === 7 ? avantRing : undefined} style={{ visibility: number === 7 && flight ? "hidden" : undefined }} aria-hidden="true" viewBox="-53 -59 106 118"
        initial={false}
        animate={{ x: number === 7 && !joined ? 12 + lean * 6 : 0, y: active && focused ? -4 : 0 }}
        whileTap={active && !reduced ? { scale: .92 } : undefined}
        transition={reduced ? { duration: 0 } : spring}>
        <motion.g initial={false} animate={{ rotate: angle + movement }}
          transition={reduced ? { duration: 0 } : spring}>
          <g className={active ? 'journey-chain-floating' : undefined}>
            <path d={linkOutline} transform="scale(.52)" fill="none" stroke="var(--color-platinum)" strokeWidth="23" />
          </g>
        </motion.g>
      </motion.svg>;
      const label = <span className="journey-chain-label">
        <span className="journey-chain-status">{String(number).padStart(2, '0')} · {completed ? 'Пройдено' : active || (number === 7 && celebrating) ? 'Наступна епоха' : 'У підготовці'}</span>
        <strong>{title}</strong>
      </span>;
      return <li key={number} ref={number === 7 ? avantRow : undefined} className={completed ? 'journey-chain-complete' : undefined}>
        {number === 1 && <CompletedChain avantCompleted={joined} />}
        {canOpenAvant ? <div className="journey-preview-anchor"
          onPointerEnter={event => {
            if (event.pointerType === 'mouse' && window.matchMedia('(any-hover: hover)').matches) setShowPreview(number);
          }}
          onPointerLeave={() => { setLean(0); setShowPreview(null); }}>
          <Link to="/epoch/avant" className={completed ? "journey-chain-row journey-preview-trigger" : "journey-chain-row journey-chain-next"}
            onPointerMove={active ? followPointer : undefined}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
            {ring}{label}
          </Link>
          {showPreview === number && <div className="journey-preview"><AvantIntro preview /></div>}
        </div> : preview ? <div className="journey-preview-anchor"
          onPointerEnter={event => { if (event.pointerType === 'mouse') setShowPreview(number); }}
          onPointerLeave={event => {
            if (event.pointerType === 'mouse') setShowPreview(current => current === number ? null : current);
          }}>
          <button type="button" className="journey-chain-row journey-preview-trigger"
            aria-expanded={showPreview === number}
            onClick={event => {
              setShowPreview(current => event.detail > 0 && 'pointerType' in event.nativeEvent && event.nativeEvent.pointerType === 'mouse'
                ? number : current === number ? null : number);
            }}>
            {ring}{label}
          </button>
          {showPreview === number && <div className="journey-preview epoch-work-preview">
            <figure>
              {preview.image && <img src={preview.image} alt={preview.caption} />}
              <figcaption>{preview.caption}</figcaption>
            </figure>
          </div>}
        </div> : <div className="journey-chain-row">{ring}{label}</div>}
      </li>;
    })}
    </ol>
    {flight && createPortal(<motion.div className="avant-link-flight" aria-hidden="true"
      initial={{ x: flight.x, y: flight.y, scale: 1, rotate: 70.5 }}
      animate={{ x: [flight.x, window.innerWidth / 2, window.innerWidth / 2, flight.endX],
        y: [flight.y, window.innerHeight / 2, window.innerHeight / 2, flight.endY],
        scale: [1, 2.6, 2.6, 1], rotate: [70.5, 345, 380, 469.5] }}
      transition={{ duration: 2.25, times: [0, .35, .66, 1], ease: 'easeInOut' }}
      onAnimationComplete={() => { setFlight(undefined); setCelebrating(false); }}>
      <svg viewBox="-53 -59 106 118">
        <path d={linkOutline} transform="scale(.52)" fill="none" stroke="var(--color-platinum)" strokeWidth="23" />
        <motion.path d={linkOutline} transform="scale(.52)" fill="none" stroke="var(--color-gold)" strokeWidth="23"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1] }}
          transition={{ duration: 2.25, times: [0, .28, .48, 1] }} />
        <motion.path d={linkOutline} transform="scale(.52)" fill="none" stroke="#fff2be" strokeWidth="8"
          pathLength="100" strokeDasharray="22 78"
          initial={{ opacity: 0, strokeDashoffset: 0 }}
          animate={{ opacity: [0, 0, .95, 0, 0], strokeDashoffset: [0, 0, -48, -100, -100] }}
          transition={{ duration: 2.25, times: [0, .39, .49, .65, 1] }}
          className="avant-link-glint" />
      </svg>
    </motion.div>, document.body)}
  </>;
}
