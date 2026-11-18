import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { artworkOf, descriptionOf, imageUrl } from './artworkCatalog';
import { BrandLink } from './BrandLink';

type Message = { author: 'guide' | 'visitor'; text: string };

const prompts = ['Що тут варто помітити?', 'Розкажи про автора', 'Як роздивлятися картину?'];

function ArtworkDialogue({ image }: { image: string }) {
  const artwork = artworkOf(image)!;
  const description = descriptionOf[image];
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const thread = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    const log = thread.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  function speak(text: string) {
    const synth = window.speechSynthesis;
    const voice = synth?.getVoices().find(item => /^uk(?:[-_]|$)/i.test(item.lang));
    if (!voice || typeof SpeechSynthesisUtterance === 'undefined') {
      setVoiceStatus('Український голос недоступний у цьому браузері. Відповідь є в діалозі.');
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = .92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setVoiceStatus('Озвучення не відтворилося. Відповідь є в діалозі.');
    };
    setVoiceStatus('');
    setSpeaking(true);
    synth.speak(utterance);
  }

  function reply(question: string, voice = false) {
    const text = question.trim();
    if (!text) return;
    const normalized = text.toLocaleLowerCase('uk');
    const answer = /автор|хто (написав|створив)|митець/.test(normalized)
      ? [`«${artwork.title}».`, ...(artwork.credit ?? []).slice(0, 3)].join(' ')
      : /роздив|детал|компози|кольор/.test(normalized)
        ? 'Знайди деталь, на якій погляд зупинився першою. Потім простеж, як форми й кольори ведуть від неї до країв роботи. Повернись до першої деталі й перевір, чи тепер вона сприймається інакше.'
        : description ?? `Почнімо з «${artwork.title}». Поглянь на силуети й на те, що художник залишив поза центром композиції.`;
    setMessages(previous => [...previous, { author: 'visitor', text }, { author: 'guide', text: answer }]);
    setDraft('');
    if (voice) speak(answer);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reply(draft);
  }

  function changeMode(next: 'text' | 'voice') {
    setMode(next);
    setListening(false);
    setSpeaking(false);
    setVoiceStatus('');
    window.speechSynthesis?.cancel();
    if (next === 'voice') window.speechSynthesis?.getVoices();
  }

  const lastReply = messages.at(-1)?.text;

  return <section className="guide-shell">
    <h1>Ланка-Гід</h1>
    <div className="guide-artwork">
      <img src={imageUrl(image)} alt="" />
      <div><h2>{artwork.title}</h2><p>{artwork.credit?.[0]}</p></div>
      <Link className="button guide-rescan" to="/scan">Сфотографувати ще</Link>
    </div>

    {description && <p className="guide-artwork-description">{description}</p>}

    <div className="guide-chat">
      <div className="guide-modes" role="group" aria-label="Режим спілкування">
        <button type="button" aria-pressed={mode === 'text'} onClick={() => changeMode('text')}>Текст</button>
        <button type="button" aria-pressed={mode === 'voice'} onClick={() => changeMode('voice')}>Голос</button>
      </div>

      <div ref={thread} className="guide-thread" role="log" aria-label="Діалог із Ланка-Гідом">
        <div className="guide-message">
          <BrandLink />
          <p>Розгляньмо цей твір разом. Що хочеш про нього дізнатися?</p>
        </div>
        {messages.map((message, index) => <div key={index}
          className={message.author === 'visitor' ? 'guide-message guide-visitor' : 'guide-message'}>
          {message.author === 'guide' && <BrandLink />}
          <p><span className="sr-only">{message.author === 'guide' ? 'Ланка-Гід. ' : 'Ти. '}</span>{message.text}</p>
        </div>)}
      </div>

      {mode === 'text' ? <>
        <div className="guide-prompts" aria-label="Підказки для запитань">
          {prompts.map(prompt => <button key={prompt} type="button" onClick={() => reply(prompt)}>{prompt}</button>)}
        </div>
        <form className="guide-compose" onSubmit={submit}>
          <input aria-label="Запитання до гіда" placeholder="Напиши запитання…" value={draft}
            maxLength={300} onChange={event => setDraft(event.target.value)} />
          <button className="button guide-primary" disabled={!draft.trim()}>Надіслати</button>
        </form>
      </> : <div className="guide-voice">
        <strong>Голосове демо</strong>
        <p>Сценарій імітує запис і підставляє готове запитання. Мікрофон не використовується.</p>
        <div className={`guide-wave${listening ? ' is-listening' : ''}`} aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
        </div>
        <p role="status">{listening ? 'Слухаю…' : speaking ? 'Ланка-Гід відповідає…' : voiceStatus}</p>
        <div className="guide-voice-actions">
          {listening ? <>
            <button type="button" className="button guide-primary" onClick={() => {
              setListening(false);
              reply(prompts[(messages.length / 2) % prompts.length], true);
            }}>Завершити запис</button>
            <button type="button" className="guide-quiet" onClick={() => setListening(false)}>Скасувати</button>
          </> : <>
            <button type="button" className="button guide-primary" onClick={() => {
              window.speechSynthesis?.cancel();
              setSpeaking(false);
              setVoiceStatus('');
              setListening(true);
            }}>Почати голосове демо</button>
            {lastReply && (speaking
              ? <button type="button" className="guide-quiet" onClick={() => {
                window.speechSynthesis?.cancel();
                setSpeaking(false);
              }}>Зупинити озвучення</button>
              : <button type="button" className="guide-quiet" onClick={() => speak(lastReply)}>Прослухати відповідь</button>)}
          </>}
        </div>
      </div>}
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
