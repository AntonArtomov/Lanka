import { useState, type MouseEvent } from 'react';
import { BrandLink } from './BrandLink';
import { bonusRewardKeys, collectBonus, hasBonus } from './rewards';

export function FlyingReward({ place, onReward }: { place: keyof typeof bonusRewardKeys; onReward: () => void }) {
  const key = bonusRewardKeys[place];
  const [stage, setStage] = useState(() => hasBonus(key) ? 'gone' : 'available');

  function collect(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!collectBonus(key)) return;
    setStage('burst');
    onReward();
  }

  if (stage === 'gone') return null;
  if (stage === 'burst') return <div className="flying-reward flying-reward-burst" aria-hidden="true">
    <span className="flying-reward-ring"><BrandLink /></span>
    <span className="flying-reward-points" onAnimationEnd={() => setStage('gone')}>+1</span>
  </div>;

  return <button className="flying-reward flying-reward-button" type="button"
    aria-label="Зібрати золоту ланку" onPointerDown={event => event.stopPropagation()} onClick={collect}>
    <BrandLink />
  </button>;
}
