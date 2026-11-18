import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { artworkOf, descriptionOf, imageUrl } from './artworkCatalog';
import { BrandLink } from './BrandLink';
import { askGuide, guideApiEnabled } from './guideApi';

type Message = { author: 'guide' | 'visitor'; text: string; offline?: boolean };

// У lib.dom TypeScript Web Speech API для розпізнавання мовлення немає
interface Recognition {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
const recognitionCtor = (): (new () => Recognition) | undefined => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};
const voiceErrors: Record<string, string> = {
  'not-allowed': 'Немає доступу до мікрофона. Дозволь його в налаштуваннях браузера або пиши текстом.',
  'service-not-allowed': 'Немає доступу до мікрофона. Дозволь його в налаштуваннях браузера або пиши текстом.',
  'no-speech': 'Мовлення не почуто. Спробуй ще раз.',
};

// Пауза після останнього слова, після якої запитання відправляється саме
const SILENCE_MS = 1800;

// Плавне «друкування»: відповідь приходить шматками, а показуємо її рівно,
// з прискоренням, коли відставання велике. Без анімації — одразу.
function createTyper(onChange: (text: string) => void, instant: boolean) {
  let target = '';
  let shown = 0;
  let timer: number | undefined;
  let waiting: (() => void) | undefined;
  const stop = () => { window.clearInterval(timer); timer = undefined; };
  const tick = () => {
    shown = Math.min(target.length, shown + Math.max(2, Math.ceil((target.length - shown) / 20)));
    onChange(target.slice(0, shown));
    if (shown >= target.length) { stop(); waiting?.(); waiting = undefined; }
  };
  return {
    push(text: string) {
      target = text;
      if (instant) { shown = text.length; onChange(text); } else timer ??= window.setInterval(tick, 20);
    },
    done: () => new Promise<void>(resolve => {
      if (shown >= target.length) resolve(); else waiting = resolve;
    }),
    stop,
  };
}

const prompts = ['Що тут варто помітити?', 'Розкажи про автора', 'Як роздивлятися картину?'];

function ArtworkDialogue({ image }: { image: string }) {
  const artwork = artworkOf(image)!;
  const description = descriptionOf[image];
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [pending, setPending] = useState(false);
  const [heard, setHeard] = useState('');
  const thread = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const voice = useRef<{ accum: string; cur: string; finishing: boolean; cancelled: boolean; fatal: boolean; silence?: number } | null>(null);
  const typer = useRef<ReturnType<typeof createTyper> | null>(null);
  const realVoice = Boolean(recognitionCtor());

  useEffect(() => {
    return () => {
      request.current?.abort();
      typer.current?.stop();
      if (voice.current) voice.current.cancelled = true;
      recognition.current?.abort();
    };
  }, []);

  useEffect(() => {
    const log = thread.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  // Запасна відповідь: без бекенда або коли він недоступний
  function localAnswer(question: string): string {
    const normalized = question.toLocaleLowerCase('uk');
    return /автор|хто (написав|створив)|митець/.test(normalized)
      ? [`«${artwork.title}».`, ...(artwork.credit ?? []).slice(0, 3)].join(' ')
      : /роздив|детал|компози|кольор/.test(normalized)
        ? 'Знайди деталь, на якій погляд зупинився першою. Потім простеж, як форми й кольори ведуть від неї до країв роботи. Повернись до першої деталі й перевір, чи тепер вона сприймається інакше.'
        : description ?? `Почнімо з «${artwork.title}». Поглянь на силуети й на те, що художник залишив поза центром композиції.`;
  }

  const setGuideText = (index: number, text: string, offline?: boolean) =>
    setMessages(previous => previous.map((message, at) => at === index ? { ...message, text, offline: offline ?? message.offline } : message));

  async function reply(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    // Історія для моделі: завершені пари запитання-відповідь + нове запитання
    const history = messages.map(message => ({ role: message.author === 'visitor' ? 'user' as const : 'guide' as const, text: message.text }));
    const index = messages.length + 1;
    setMessages(previous => [...previous, { author: 'visitor', text }, { author: 'guide', text: '' }]);
    setDraft('');
    setPending(true);
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const typing = typer.current = createTyper(value => setGuideText(index, value), instant);

    let answer: string;
    let offline = false;
    if (guideApiEnabled) {
      request.current?.abort();
      const controller = request.current = new AbortController();
      try {
        answer = await askGuide(image, [...history.slice(-10), { role: 'user', text }], typing.push, controller.signal);
      } catch {
        if (controller.signal.aborted) return;
        answer = localAnswer(text);
        offline = true;
      }
    } else {
      answer = localAnswer(text);
    }
    if (offline) setGuideText(index, '', true);
    typing.push(answer);
    await typing.done();
    setPending(false);
  }

  // Chrome завершує розпізнавання на першій паузі, тому запис — це ланцюжок
  // сесій: після кожної запускаємо наступну, а запитання відправляємо, коли
  // мовчання триває SILENCE_MS або користувач натиснув «Готово».
  function startListening() {
    const Ctor = recognitionCtor();
    if (!Ctor || pending) return;
    setVoiceStatus('');
    setHeard('');
    const session = voice.current = { accum: '', cur: '', finishing: false, cancelled: false, fatal: false } as NonNullable<typeof voice.current>;

    const end = () => {
      recognition.current = null;
      window.clearTimeout(session.silence);
      setListening(false);
      setHeard('');
      if (!session.cancelled && session.accum) void reply(session.accum);
    };
    const finish = () => {
      session.finishing = true;
      recognition.current?.stop();
    };
    const run = () => {
      const instance = recognition.current = new Ctor();
      instance.lang = 'uk-UA';
      instance.interimResults = true;
      instance.continuous = false;
      session.cur = '';
      instance.onresult = event => {
        session.cur = Array.from(event.results, result => result[0].transcript).join('');
        setHeard(`${session.accum} ${session.cur}`.trim());
        window.clearTimeout(session.silence);
        session.silence = window.setTimeout(finish, SILENCE_MS);
      };
      instance.onerror = event => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        session.fatal = true;
        setVoiceStatus(voiceErrors[event.error] ?? 'Не вдалося розпізнати мовлення. Спробуй ще раз або пиши текстом.');
      };
      instance.onend = () => {
        session.accum = `${session.accum} ${session.cur}`.trim();
        if (session.finishing || session.cancelled || session.fatal) return end();
        if (!session.cur && !session.accum) {
          setVoiceStatus(voiceErrors['no-speech']);
          return end();
        }
        run();
      };
      try {
        instance.start();
      } catch {
        session.fatal = true;
        setVoiceStatus('Не вдалося почати запис. Спробуй ще раз.');
        end();
      }
    };
    setListening(true);
    run();
  }

  function stopListening(discard: boolean) {
    const session = voice.current;
    if (!session || !recognition.current) return;
    session.cancelled = discard;
    session.finishing = true;
    window.clearTimeout(session.silence);
    recognition.current.stop();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void reply(draft);
  }

  return <section className="guide-shell">
    <h1>Ланка-Гід</h1>
    <div className="guide-artwork">
      <img src={imageUrl(image)} alt="" />
      <div><h2>{artwork.title}</h2><p>{artwork.credit?.[0]}</p></div>
      <Link className="guide-rescan" to="/scan">Інша картина</Link>
    </div>

    <div className="guide-chat">
      <div ref={thread} className="guide-thread" role="log" aria-busy={pending} aria-label="Діалог із Ланка-Гідом">
        <div className="guide-message">
          <BrandLink />
          <p>Розгляньмо цей твір разом. Що хочеш про нього дізнатися?</p>
        </div>
        {messages.map((message, index) => <div key={index}
          className={`guide-message${message.author === 'visitor' ? ' guide-visitor' : ''}${pending && index === messages.length - 1 ? (message.text ? ' is-typing' : ' is-waiting') : ''}`}>
          {message.author === 'guide' && <BrandLink />}
          <p><span className="sr-only">{message.author === 'guide' ? 'Ланка-Гід. ' : 'Ти. '}</span>{message.text || <span className="guide-dots" role="img" aria-label="Ланка-Гід думає"><i /><i /><i /></span>}</p>
        </div>)}
      </div>
      {messages.some(message => message.offline) && <p className="guide-note" role="status">Зв'язок із гідом-ШІ нестабільний: частина відповідей підготовлена заздалегідь і може бути загальною.</p>}

      <div className="guide-prompts" aria-label="Підказки для запитань">
        {prompts.map(prompt => <button key={prompt} type="button" disabled={pending || listening} onClick={() => void reply(prompt)}>{prompt}</button>)}
      </div>
      <form className="guide-compose" onSubmit={submit}>
        <input aria-label="Запитання до гіда" value={listening ? heard : draft} readOnly={listening} maxLength={300}
          placeholder={listening ? 'Слухаю…' : realVoice ? 'Напиши або скажи…' : 'Напиши запитання…'}
          onChange={event => setDraft(event.target.value)} />
        {realVoice && <button type="button" className={`guide-mic${listening ? ' is-listening' : ''}`}
          aria-pressed={listening} aria-label={listening ? 'Завершити запис' : 'Сказати запитання голосом'}
          disabled={pending && !listening} onClick={() => listening ? stopListening(false) : startListening()}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>}
        <button className="button guide-primary" disabled={!draft.trim() || pending || listening}>Надіслати</button>
      </form>
      {(listening || voiceStatus) && <p className="guide-note guide-mic-note" role="status">
        {listening ? 'Слухаю. Коли замовкнеш, запитання відправиться саме. ' : voiceStatus}
        {listening && <button type="button" className="guide-quiet" onClick={() => stopListening(true)}>Скасувати</button>}
      </p>}
      <p className="guide-note">Відповіді створює ШІ (Google Gemini) за матеріалами Ланки й можуть бути неточними. Запитання передаються на сервер, а мовлення розпізнає браузер.</p>
    </div>
  </section>;
}

export function ArtworkGuide() {
  const [params] = useSearchParams();
  const image = params.get('work');
  if (image && artworkOf(image)) return <ArtworkDialogue key={image} image={image} />;
  return <section className="guide-shell">
    <h1>Ланка-Гід</h1>
    <p className="my-4">Розпізнай картину, щоб відкрити розмову про неї.</p>
    <Link className="button guide-primary" to="/scan">Впізнай картину →</Link>
  </section>;
}
