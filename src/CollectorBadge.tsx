import { useId } from 'react';
import characters from './profile-badges.png';
import { getCollectorStatus } from './rewards';

const tiers = {
  'ентузіаст': { index: 0, metal: 'бронза', light: '#E4C5A8', base: '#AC7753', dark: '#745039' },
  'дослідник': { index: 1, metal: 'срібло', light: '#F1F1EE', base: '#B0B5BC', dark: '#737D88' },
  'куратор': { index: 2, metal: 'золото', light: '#F5E2AD', base: '#E5AC43', dark: '#A77826' },
};

// Невеликі фестони замість гострих зубців; персонажі беруться з наданого зображення.
const rim = Array.from({ length: 160 }, (_, point) => {
  const angle = point / 160 * Math.PI * 2;
  const radius = 37 + 1.1 * Math.cos(angle * 20);
  return `${point ? 'L' : 'M'}${50 + Math.cos(angle) * radius},${43 + Math.sin(angle) * radius}`;
}).join(' ') + 'Z';

export function CollectorBadge({ score }: { score: number }) {
  const id = useId();
  const status = getCollectorStatus(score);
  const tier = tiers[status];
  return <svg className="collector-badge" viewBox="0 0 100 94" role="img" aria-label={`${status}, ${tier.metal}`}>
    <defs>
      <linearGradient id={`${id}-metal`} x1="15" y1="8" x2="84" y2="82" gradientUnits="userSpaceOnUse">
        <stop stopColor={tier.dark} /><stop offset=".3" stopColor={tier.light} />
        <stop offset=".55" stopColor={tier.base} /><stop offset=".75" stopColor={tier.light} /><stop offset="1" stopColor={tier.dark} />
      </linearGradient>
      <clipPath id={`${id}-portrait`}><circle cx="50" cy="43" r="29.5" /></clipPath>
    </defs>
    <path d="M30 68 25 87 35 83 42 90 48 70ZM52 70 58 90 65 83 75 87 70 68Z" fill={tier.base} />
    <path d={rim} fill={`url(#${id}-metal)`} />
    <circle cx="50" cy="43" r="33" fill="var(--color-paper)" stroke={tier.dark} strokeWidth=".8" />
    <image href={characters} x={20 - tier.index * 60} y="13" width="180" height="60"
      preserveAspectRatio="none" clipPath={`url(#${id}-portrait)`} />
    <circle cx="50" cy="43" r="30" fill="none" stroke={`url(#${id}-metal)`} strokeWidth="1.5" />
  </svg>;
}
