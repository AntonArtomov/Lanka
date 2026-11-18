import { useId, useRef, useState, type FormEvent } from 'react';
import { getCollectorStatus } from './rewards';
import { CollectorBadge } from './CollectorBadge';

type Avatar = 'mona' | 'van-gogh';

export type DemoProfile = { nickname: string; guest: boolean; avatar?: Avatar };

const profileKey = 'lanka-demo-profile';

export function readProfile(): DemoProfile | null {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(profileKey) ?? 'null');
    if (saved && typeof saved === 'object' && 'guest' in saved && typeof saved.guest === 'boolean'
      && 'nickname' in saved && typeof saved.nickname === 'string' && saved.nickname.trim()) {
      return { guest: saved.guest, nickname: saved.nickname, avatar: 'avatar' in saved && saved.avatar === 'van-gogh' ? 'van-gogh' : undefined };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveProfile(profile: DemoProfile) {
  try {
    sessionStorage.setItem(profileKey, JSON.stringify(profile));
  } catch {
    // The in-memory profile still works when storage is unavailable.
  }
}

export function Welcome({ onContinue }: { onContinue: (profile: DemoProfile) => void }) {
  const [nickname, setNickname] = useState('');

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    if (name) onContinue({ nickname: name, guest: false });
  }

  return <section className="welcome-screen">
    <h1>Вітаємо в Ланці</h1>
    <p>Обери нікнейм для демовходу або продовжуй як гість.</p>
    <form onSubmit={enter}>
      <label htmlFor="demo-nickname">Нікнейм</label>
      <input id="demo-nickname" name="nickname" autoComplete="nickname" maxLength={24}
        value={nickname} onChange={event => setNickname(event.target.value)} required />
      <button type="submit" className="button" disabled={!nickname.trim()}>Увійти →</button>
    </form>
    <button type="button" className="welcome-guest" onClick={() => onContinue({ nickname: 'гість', guest: true })}>
      <span aria-hidden="true">🦊</span> Продовжити як гість
    </button>
  </section>;
}

const avatarOutline = 'M-34 -48 C-20 -56 -12 -49 0 -49 S21 -56 34 -48 Q45 -44 48 -34 C56 -20 49 -12 49 0 S56 21 48 34 Q44 45 34 48 C20 56 12 49 0 49 S-21 56 -34 48 Q-45 44 -48 34 C-56 20 -49 12 -49 0 S-56 -21 -48 -34 Q-44 -45 -34 -48Z';

function ProfileAvatar({ profile }: { profile: DemoProfile }) {
  const clip = useId();
  const vanGogh = profile.avatar === 'van-gogh';

  return <svg className="profile-avatar" viewBox="-58 -58 116 116" aria-hidden="true">
    <defs>
      <clipPath id={clip}><path d={avatarOutline} /></clipPath>
    </defs>
    <g clipPath={`url(#${clip})`}>
      <path d={avatarOutline} fill={vanGogh ? "#8db7ab" : "var(--color-gold)"} />
      {vanGogh ? <>
        <path d="M-47 -34 Q-15 -52 10 -37 T47 -38 M-47 -21 Q-12 -39 8 -24 T47 -25" fill="none" stroke="#bdd6bc" strokeWidth="4" />
        <path d="M-51 51 Q-43 25 -16 23 L14 23 Q40 26 48 51Z" fill="#294e65" />
        <path d="M-22 25 L-6 45 L17 24 L10 13 L-14 13Z" fill="#e8c990" />
        <path d="M-24 -15 Q-21 -36 0 -36 Q21 -37 24 -12 L19 18 Q7 33 -11 20 L-23 7Z" fill="#a94c30" />
        <path d="M-15 -20 Q-5 -27 14 -24 L19 -11 L12 10 Q5 18 -5 11 L-10 2 L-19 -4Z" fill="#edb57d" />
        <path d="M-11 -9l6 -2m11 -1 6 1M3 -9L1 0l4 1M-4 9l11 -2" fill="none" stroke="#654539" strokeWidth="2" strokeLinecap="round" />
        <path d="M-31 -24 Q-30 -42 -3 -43 Q17 -45 28 -30 L29 -23 Q8 -17 -31 -24Z" fill="#ba873e" />
        <path d="M-35 -24 Q-4 -18 33 -26" fill="none" stroke="#efd18a" strokeWidth="5" strokeLinecap="round" />
      </> : <>
        <path d="M-105 29 Q-62 -23 -24 9 Q17 3 39 -19 Q68 -14 104 14 V79 H-105Z" fill="var(--color-sage)" />
        <path d="M-30 32 L-25 -9 Q-25 -35 -1 -37 Q24 -38 28 -8 L33 34Z" fill="var(--color-ink)" />
        <path d="M-48 67 Q-44 33 -15 26 L16 21 Q41 28 47 67Z" fill="#364638" />
        <path d="M-13 9 L-13 26 Q-2 41 16 22 L12 6Z" fill="#bc7856" />
        <path d="M-17 -20 Q-8 -18 1 -27 Q8 -18 18 -18 L16 -2 Q13 13 1 16 Q-12 15 -17 0Z" fill="#e8ae79" />
        <path d="M-10 -8h4m11 -1h4M-3 5q4 2 8 -1" fill="none" stroke="#624438" strokeWidth="2" strokeLinecap="round" />
        <path d="M-15 46 Q-4 36 12 40 L27 46 Q15 52 1 46 L-10 52Z" fill="#e8ae79" />
      </>}
    </g>
    <path d={avatarOutline} fill="none" stroke="var(--color-brand)" strokeWidth="4" />
  </svg>;
}

export function ProfileBadge({ profile, score, onSave, onReset }: { profile: DemoProfile; score: number; onSave: (profile: DemoProfile) => void; onReset: () => void }) {
  const editor = useRef<HTMLDialogElement>(null);
  const [nickname, setNickname] = useState('');

  const [avatar, setAvatar] = useState<Avatar>('mona');

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    if (!name) return;
    editor.current?.close();
    onSave({ nickname: name, guest: profile.guest && name === profile.nickname, avatar });
  }

  return <>
    <button type="button" className="profile-badge" title="Редагувати профіль"
      aria-haspopup="dialog" onClick={() => { setNickname(profile.nickname); setAvatar(profile.avatar ?? 'mona'); editor.current?.showModal(); }}>
      <ProfileAvatar profile={profile} />
      <span className="profile-name">
        <bdi className="profile-nickname">{profile.guest && profile.nickname === 'гість' ? 'Гість' : profile.nickname}</bdi>
        <span className="profile-status">({getCollectorStatus(score)})</span>
      </span>
    </button>
    <dialog ref={editor} className="profile-editor" aria-labelledby="profile-editor-title">
      <h2 id="profile-editor-title">Редагувати профіль</h2>
      <div className="profile-rank-preview"><CollectorBadge score={score} /><span>{getCollectorStatus(score)}<small>{score} ланок</small></span></div>
      <form onSubmit={save}>
        <label htmlFor="profile-nickname">Нікнейм</label>
        <input id="profile-nickname" value={nickname} autoComplete="nickname" maxLength={24}
          onChange={event => setNickname(event.target.value)} required />
        <fieldset className="profile-avatar-choices">
          <legend>Аватар</legend>
          {([{ id: 'mona', label: 'Мона Ліза' }, { id: 'van-gogh', label: 'Ван Гог' }] as const).map(choice =>
            <label key={choice.id}>
              <input className="sr-only" type="radio" name="avatar" checked={avatar === choice.id} onChange={() => setAvatar(choice.id)} />
              <ProfileAvatar profile={{ ...profile, avatar: choice.id }} />
              <span className="sr-only">{choice.label}</span>
            </label>
          )}
        </fieldset>
        <div className="profile-editor-actions">
          <button type="button" className="back" onClick={() => editor.current?.close()}>Скасувати</button>
          <button type="submit" className="button" disabled={!nickname.trim()}>Зберегти</button>
        </div>
      </form>
      <button type="button" className="profile-reset" onClick={() => { editor.current?.close(); onReset(); }}>
        Скинути прогрес демо
      </button>
    </dialog>
  </>;
}
