import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { avantCompletionKey, avantQuizCompletedKey } from './rewards';
import { FlyingReward } from './FlyingReward';
import portrait from './artworks/girl-head.jpg';
import market from './artworks/hay-market.jpg';

const title = 'Ранній модернізм і український авангард';
const letters = ['А', 'Б', 'В', 'Г'];
const questions = [
  { prompt: 'Точкою відліку українського авангарду є виставка митців 1908 року, яка називалася…',
    options: ['«Нова Генерація»', '«Ланка»', '«Салон незалежних»', '«Кільце»'], correct: 1 },
  { prompt: 'У якому місті Олександра Екстер познайомилася з Пабло Пікассо та Жоржем Браком?',
    options: ['У Києві', 'У Венеції', 'У Парижі', 'У Берліні'], correct: 2 },
  { prompt: 'Хто автор цієї роботи?',
    options: ['Микола Касперович', 'Михайло Бойчук', 'Олександр Богомазов', 'Георгій Нарбут'], correct: 0,
    image: { src: portrait, alt: 'Портрет дівчинки в рожевому одязі на червоному тлі' } },
  { prompt: 'У якому стилі виконана картина Олександра Богомазова «Сінний ринок. Київ»?',
    options: ['Імпресіонізм', 'Символізм', 'Ар нуво', 'Кубофутуризм'], correct: 3,
    image: { src: market, alt: 'Сінний ринок. Київ' } },
  { prompt: 'Яку картину Екстер урятували від знищення у 1960-х?',
    options: ['«Три жіночі фігури»', '«Міст. Севр»', '«Вид на Париж»', '«Венеція»'], correct: 1 },
];

export function QuizHub() {
  return <section className="quiz-shell">
    <h1>Гартуй пам’ять</h1>
    <Link className="quiz-entry" to="/quiz/avant">
      <h2>{title}</h2><span>5 запитань <span aria-hidden="true">→</span></span>
    </Link>
  </section>;
}

export function AvantQuiz({ onReward }: { onReward: () => void }) {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<number, number>>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const question = questions[page];
  const selected = answers[page];

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [page]);

  function goForward() {
    if (selected === undefined) return;
    if (page === questions.length - 1) {
      sessionStorage.setItem(avantQuizCompletedKey, 'true');
      onReward();
    }
    setPage(page + 1);
  }

  function endSwipe(event: PointerEvent<HTMLElement>) {
    const origin = start.current;
    start.current = null;
    if (!origin || event.pointerType !== 'touch' || !event.isPrimary) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    dragged.current = Math.hypot(dx, dy) > 12;
    if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    if (dx < 0) goForward();
    else if (page > 0) setPage(page - 1);
  }

  if (!question) {
    const score = questions.filter((item, index) => answers[index] === item.correct).length;
    return <section className="quiz-shell">
      <h1 ref={heading} tabIndex={-1}>Квіз завершено</h1>
      <p className="quiz-score">Правильних відповідей: {score} із {questions.length}</p>
      <p className="quiz-farewell">Сподіваюся ти не забудеш вивчене <span aria-hidden="true">☺️</span></p>
      <div className="quiz-controls quiz-result-actions">
        <button type="button" className="back" onClick={() => { setAnswers({}); setPage(0); }}>Пройти ще раз</button>
        <Link className="button quiz-next-epoch" to="/journey"
          state={{ celebrateAvant: sessionStorage.getItem(avantCompletionKey) !== 'true' }}
          onClick={() => {
            sessionStorage.setItem(avantCompletionKey, 'true');
            onReward();
          }}>
          Вперед до нової епохи →
        </Link>
      </div>
    </section>;
  }

  return <section className="quiz-shell">
    <Link className="back" to="/quiz">← До квізів</Link>
    <h1>{title}</h1>
    <div className="quiz-card" onPointerDown={event => {
      if (!event.isPrimary) return;
      dragged.current = false;
      if (event.pointerType === 'touch') start.current = { x: event.clientX, y: event.clientY };
    }} onPointerUp={endSwipe} onPointerCancel={() => { start.current = null; dragged.current = true; }}>
      <svg className="quiz-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1" y="1" width="98" height="98" rx="5" pathLength="100" />
        <rect className="quiz-frame-fill" x="1" y="1" width="98" height="98" rx="5" pathLength="100"
          strokeDasharray={page === questions.length - 1 ? undefined : `${(page + 1) / questions.length * 100} 100`} />
      </svg>
      <p className="quiz-count">Запитання {page + 1} / {questions.length}</p>
      <h2 ref={heading} tabIndex={-1}>{question.prompt}</h2>
      {question.image && <img className="quiz-image" src={question.image.src} alt={question.image.alt} />}
      {page === 3 && <FlyingReward place="quiz" onReward={onReward} />}
      <div className="quiz-options">
        {question.options.map((option, index) => {
          const correct = selected !== undefined && index === question.correct;
          const wrong = selected === index && !correct;
          return <button type="button" key={option}
            className={`quiz-option${correct ? ' is-correct' : wrong ? ' is-wrong' : ''}`}
            aria-disabled={selected !== undefined}
            onClick={event => {
              if (selected !== undefined || (event.detail > 0 && dragged.current)) return;
              setAnswers(previous => ({ ...previous, [page]: index }));
            }}>
            <span className="quiz-letter">{letters[index]}.</span>
            <span>{option}</span>
            {correct && <span className="quiz-mark" aria-label="Правильна відповідь">✓</span>}
            {wrong && <span className="quiz-mark" aria-label="Неправильна відповідь">×</span>}
          </button>;
        })}
      </div>
      <p className="quiz-feedback" role="status">
        {selected === undefined ? '' : selected === question.correct ? 'Правильно.' : `Правильна відповідь: ${question.options[question.correct]}.`}
      </p>
      <div className="quiz-controls">
        <button type="button" className="back" disabled={page === 0} onClick={() => setPage(page - 1)}>← Назад</button>
        <button type="button" className="button" disabled={selected === undefined} onClick={goForward}>
          {page === questions.length - 1 ? 'Побачити результат' : 'Далі'} →
        </button>
      </div>
    </div>
  </section>;
}
