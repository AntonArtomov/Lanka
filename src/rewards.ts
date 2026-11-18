export const heroJoinedKey = 'lanka-hero-joined';

export function getCollectorStatus(linkCount: number) {
  if (linkCount <= 3) return 'ентузіаст';
  if (linkCount <= 20) return 'дослідник';
  return 'куратор';
}
export const avantQuizCompletedKey = 'lanka-avant-quiz-completed';
export const avantCompletionKey = 'lanka-avant-completed';

export const bonusRewardKeys = {
  reader: 'lanka-avant-slide-17-bonus',
  quiz: 'lanka-avant-question-4-bonus',
} as const;

type BonusKey = typeof bonusRewardKeys[keyof typeof bonusRewardKeys];

export function hasBonus(key: BonusKey) {
  return sessionStorage.getItem(key) === 'true';
}

export function collectBonus(key: BonusKey) {
  if (hasBonus(key)) return false;
  sessionStorage.setItem(key, 'true');
  return true;
}

const rewards = [
  { key: bonusRewardKeys.reader, persistence: 'tab' },
  { key: bonusRewardKeys.quiz, persistence: 'tab' },
  { key: heroJoinedKey, persistence: 'browser' },
  { key: avantQuizCompletedKey, persistence: 'tab' },
  { key: avantCompletionKey, persistence: 'tab' },
] as const;

function storageFor(persistence: 'browser' | 'tab') {
  return persistence === 'browser' ? localStorage : sessionStorage;
}

export function getRewardCount() {
  return rewards.filter(({ key, persistence }) => storageFor(persistence).getItem(key) === 'true').length;
}

export function clearRewards() {
  for (const { key, persistence } of rewards) storageFor(persistence).removeItem(key);
}
