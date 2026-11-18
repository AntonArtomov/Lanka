import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { CollectorBadge } from './CollectorBadge';
import { getCollectorStatus } from './rewards';

type Promotion = { from: number; to: number };
const colors = ['brand', 'gold', 'sage', 'clay', 'ink'];
const particles = Array.from({ length: 32 }, (_, index) => {
  const angle = index * 2.39996;
  const radius = 110 + (index % 5) * 24;
  return {
    '--confetti-x': `${Math.cos(angle) * radius}px`,
    '--confetti-y': `${Math.sin(angle) * radius - 35}px`,
    '--confetti-turn': `${(index % 2 ? -1 : 1) * (180 + index * 31)}deg`,
    '--confetti-delay': `${.88 + index % 4 * .045}s`,
    background: `var(--color-${colors[index % colors.length]})`,
    borderRadius: index % 3 === 0 ? '50%' : '1px',
  } as CSSProperties;
});

/** Показує підвищення лише при перетині порога; вхід і скидання демо його не запускають. */
export function RankAchievement({ score }: { score: number }) {
  const previous = useRef(score);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const oldScore = previous.current;
    previous.current = score;
    if (score < oldScore) setPromotion(null);
    else if (score > oldScore && getCollectorStatus(score) !== getCollectorStatus(oldScore)) {
      setPromotion({ from: oldScore, to: score });
    }
  }, [score]);

  useEffect(() => {
    if (!promotion) return;
    const timeout = window.setTimeout(() => setPromotion(null), reduced ? 1800 : 2800);
    return () => window.clearTimeout(timeout);
  }, [promotion, reduced]);

  if (!promotion) return null;
  return <div key={`${promotion.from}-${promotion.to}`} className={`rank-achievement${reduced ? ' rank-achievement-reduced' : ''}`}>
    <p className="sr-only" role="status">Новий ранг: {getCollectorStatus(promotion.to)}. Вітаємо!</p>
    <div className="rank-achievement-card" aria-hidden="true">
      <div className="rank-achievement-glow" />
      <p className="rank-achievement-eyebrow">Нова ланка твого шляху</p>
      <div className="rank-coin-stage">
        <div className="rank-coin">
          <div className="rank-coin-face rank-coin-old"><CollectorBadge score={promotion.from} /></div>
          <div className="rank-coin-face rank-coin-new"><CollectorBadge score={promotion.to} /></div>
        </div>
        <div className="rank-confetti">{particles.map((style, index) => <i key={index} style={style} />)}</div>
      </div>
      <div className="rank-achievement-labels">
        <p className="rank-label-old">{getCollectorStatus(promotion.from)}</p>
        <p className="rank-label-new">{getCollectorStatus(promotion.to)}</p>
      </div>
      <p className="rank-achievement-caption">Мистецтво стає ближчим. Вітаємо!</p>
    </div>
  </div>;
}
