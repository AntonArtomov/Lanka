import { useEffect, useId, useState, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { linkOutline } from './linkOutline';
import chain from './data/chain.json';
import { AvantIntro } from './AvantIntro';

const completedColors = ['sage', 'brand', 'gold', 'clay', 'ink', 'sage'];
const spring = { type: 'spring', stiffness: 190, damping: 18 } as const;

function CompletedChain() {
  const id = useId();
  const rings = completedColors.map((color, index) => ({
    color,
    transform: `translate(${index % 2 ? 57 : 49} ${40 + index * 80}) rotate(${index % 2 ? 70.5 : 109.5}) scale(.52)`,
  }));

  return <svg className="journey-chain-art" width="106" height="480" viewBox="0 0 106 480" aria-hidden="true">
    <defs>
      {rings.slice(1).map((_, index) => {
        const maskId = `${id}-${index}`;
        return <mask key={maskId} id={maskId} maskUnits="userSpaceOnUse" x="-20" y="-30" width="146" height="540">
          <rect x="-20" y="-30" width="146" height="540" fill="white" />
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
  const [lean, setLean] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!showPreview) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowPreview(false);
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

  return <ol aria-label="Епохи українського мистецтва" className="journey-chain">
    {chain.map(({ number, title }) => {
      const active = number === 7;
      const completed = number <= completedColors.length;
      const angle = number % 2 ? 70.5 : 109.5;
      const movement = active ? lean * 13 : 0;
      const ring = completed ? <span aria-hidden="true" /> : <motion.svg aria-hidden="true" viewBox="-53 -59 106 118"
        initial={false}
        animate={{ x: active ? 12 + lean * 6 : 0, y: active && focused ? -4 : 0 }}
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
        <span className="journey-chain-status">{String(number).padStart(2, '0')} · {completed ? 'Пройдено' : active ? 'Наступна епоха' : 'У підготовці'}</span>
        <strong>{title}</strong>
        {active && <span className="journey-chain-action">Відкрити ланку ↗</span>}
      </span>;
      return <li key={number} className={completed ? 'journey-chain-complete' : undefined}>
        {number === 1 && <CompletedChain />}
        {active ? <div className="journey-preview-anchor"
          onPointerEnter={event => {
            if (event.pointerType === 'mouse' && window.matchMedia('(any-hover: hover)').matches) setShowPreview(true);
          }}
          onPointerLeave={() => { setLean(0); setShowPreview(false); }}>
          <Link to="/epoch/avant" className="journey-chain-row journey-chain-next"
            onPointerMove={followPointer}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
            {ring}{label}
          </Link>
          {showPreview && <div className="journey-preview"><AvantIntro preview /></div>}
        </div> : <div className="journey-chain-row">{ring}{label}</div>}
      </li>;
    })}
  </ol>;
}
