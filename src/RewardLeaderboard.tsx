import { useRef } from 'react';
import { BrandLink } from './BrandLink';
import { getCollectorStatus } from './rewards';
import { CollectorBadge } from './CollectorBadge';

const artists = [
  { name: 'Катерина Білокур', score: 11 },
  { name: 'Марія Примаченко', score: 10 },
  { name: 'Олександра Екстер', score: 9 },
  { name: 'Олександр Богомазов', score: 8 },
  { name: 'Георгій Нарбут', score: 7 },
  { name: 'Софія Налепинська-Бойчук', score: 6 },
  { name: 'Михайло Бойчук', score: 5 },
  { name: 'Анатоль Петрицький', score: 4 },
  { name: 'Микола Касперович', score: 3 },
];

export function RewardLeaderboard({ nickname, score }: { nickname: string; score: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const rows = [...artists.map(artist => ({ ...artist, current: false })), { name: nickname, score, current: true }]
    .sort((left, right) => right.score - left.score);

  return <>
    <button type="button" className="reward-count" aria-haspopup="dialog"
      aria-label={`Зібрані ланки: ${score}. Відкрити рейтинг`} onClick={() => dialog.current?.showModal()}>
      <span key={score} className="reward-count-icon"><BrandLink /></span>
      <span aria-live="polite">{score}</span>
    </button>
    <dialog ref={dialog} className="profile-editor reward-leaderboard" aria-labelledby="leaderboard-title">
      <button type="button" className="leaderboard-close" aria-label="Закрити рейтинг" onClick={() => dialog.current?.close()}>×</button>
      <h2 id="leaderboard-title">Вітаємо! Ти серед БОГЕМИ!)</h2>
      <p>Деморейтинг · Топ 10 за ланками</p>
      <ol>
        {rows.map(({ name, score: total, current }, index) => <li key={current ? 'visitor' : name} className={current ? 'leaderboard-current' : undefined}>
          <span aria-hidden="true">{index + 1}</span>
          <span className="leaderboard-identity"><CollectorBadge score={total} /><bdi>{name} ({getCollectorStatus(total)}){current && ' · Ти'}</bdi></span>
          <strong aria-label={`${total} ланок`}>{total}</strong>
        </li>)}
      </ol>
    </dialog>
  </>;
}
