import { useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { linkOutline } from './linkOutline';

import { heroJoinedKey } from './rewards';

const fixedLinks = [
  { x: 257, y: 201, angle: 19.5, color: 'var(--color-sage)' },
  { x: 411, y: 184, angle: -19.5, color: 'var(--color-brand)' },
  { x: 719, y: 184, angle: -19.5, color: 'var(--color-clay)' },
  { x: 873, y: 201, angle: 19.5, color: 'var(--color-ink)' },
];

function LinkStroke({ color }: { color: string }) {
  return <>
    <path d={linkOutline} fill="none" stroke={color} strokeWidth="23" />
  </>;
}

export function HeroChain({ onReward }: { onReward: () => void }) {
  const id = useId();
  const [joined, setJoined] = useState(() => localStorage.getItem(heroJoinedKey) === 'true');
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const [touchPreview, setTouchPreview] = useState(false);
  const [nearby, setNearby] = useState(false);
  const reduced = useReducedMotion();
  const docked = joined || nearby || touchPreview;
  const transition = reduced ? { duration: 0 } : { type: 'spring', stiffness: 145, damping: 18 } as const;
  const center = { x: 565, y: 200, angle: 19.5, color: 'var(--color-gold)' };
  const crossings = [
    { front: fixedLinks[1], x: 501, y: 140, closesWithCenter: true },
    { front: fixedLinks[2], x: 655, y: 244, closesWithCenter: true },
    { front: fixedLinks[2], x: 810, y: 141, closesWithCenter: false },
  ];

  return <figure className="brand-art">
    <button type="button" className="hero-chain" aria-pressed={joined}
      aria-label="З’єднати ланцюг"
      onClick={event => {
        if (joined || (event.detail > 0 && swiped.current)) return;
        setJoined(true);
        localStorage.setItem(heroJoinedKey, 'true');
        onReward();
      }}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setNearby(true); }}
      onPointerLeave={() => setNearby(false)}
      onPointerDown={event => {
        swiped.current = false;
        touchStart.current = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
      }}
      onPointerMove={event => {
        const start = touchStart.current;
        if (event.pointerType !== 'touch' || !start || joined) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10) return;
        swiped.current = true;
        setTouchPreview(true);
      }}
      onPointerUp={() => { touchStart.current = null; setTouchPreview(false); }}
      onPointerCancel={() => { touchStart.current = null; setTouchPreview(false); }}>
      <svg viewBox="0 0 1130 290" width="1130" height="290" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-left-crossing-window`}>
            <circle cx="348" cy="244" r="30" />
          </clipPath>
          <mask id={`${id}-left-weave`} maskUnits="userSpaceOnUse" x="0" y="0" width="1130" height="290">
            <rect width="1130" height="290" fill="white" />
            <g clipPath={`url(#${id}-left-crossing-window)`}>
              <path d={linkOutline} fill="none" stroke="black" strokeWidth="21"
                transform={`translate(${fixedLinks[0].x} ${fixedLinks[0].y}) rotate(${fixedLinks[0].angle})`} />
            </g>
          </mask>
          {crossings.map(({ x, y }, index) => <clipPath key={index} id={`${id}-crossing-${index}`}>
            <circle cx={x} cy={y} r="22" />
          </clipPath>)}
        </defs>
        {fixedLinks.map((link, index) => <g key={link.x} mask={index === 1 ? `url(#${id}-left-weave)` : undefined}>
          <g transform={`translate(${link.x} ${link.y}) rotate(${link.angle})`}>
            <LinkStroke color={link.color} />
          </g>
        </g>)}
        <motion.g initial={false}
          animate={{ x: center.x, y: docked ? center.y : 79, rotate: docked ? center.angle : 36 }}
          transition={transition}>
          <motion.g animate={docked || reduced ? { y: 0, rotate: 0 } : { y: [0, -5, 0, 5, 0], rotate: [0, -3, 0, 3, 0] }}
            transition={docked || reduced ? { duration: reduced ? 0 : .18 } : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
            <LinkStroke color="var(--color-platinum)" />
            <motion.path d={linkOutline} fill="none" stroke={center.color} strokeWidth="23"
              initial={false} animate={{ opacity: docked ? 1 : 0 }} transition={{ duration: reduced ? 0 : .3 }} />
          </motion.g>
        </motion.g>
        {/* Restore the rear ring at one crossing only, so the rings alternate front and back. */}
        {crossings.map(({ front, closesWithCenter }, index) =>
          <motion.g key={index} clipPath={`url(#${id}-crossing-${index})`} initial={false}
            animate={{ opacity: !closesWithCenter || docked ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : .12, delay: !reduced && docked && closesWithCenter ? .32 : 0 }}>
            <g transform={`translate(${front.x} ${front.y}) rotate(${front.angle})`}>
              <LinkStroke color={front.color} />
            </g>
          </motion.g>
        )}
      </svg>
    </button>
    <figcaption aria-live="polite">{joined ? 'Ланцюг з’єднано' : 'Досліджуй і пам’ятай, щоб ланцюг тримався'}</figcaption>
  </figure>;
}
