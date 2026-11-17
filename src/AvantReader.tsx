import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { BrandLink } from './BrandLink';
import slideData from './data/avant-slides.json';
const images = import.meta.glob<string>('./artworks/*', { eager: true, query: '?url', import: 'default' });
type ArtworkSlide = { type: 'artwork'; title: string; image: string; credit: string[] };
type TextSlide = { type: 'text'; title: string; paragraphs: string[] };

const slides = slideData as (ArtworkSlide | TextSlide)[];
const slideCount = slides.length;
const thumbnails = slides.filter((slide): slide is ArtworkSlide => slide.type === 'artwork')
  .filter((_, index) => index % 2 === 0);

function QuizInvitation({ goBack }: { goBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  return <article className="avant-reader avant-finale">
    <button type="button" className="back avant-finale-back" onClick={goBack}>← До останньої картини</button>
    <div className="avant-finale-content">
      <div className="avant-finale-art" aria-hidden="true">
        <div className="avant-finale-gallery">
          {thumbnails.map(artwork => <img key={artwork.image} src={images[`./artworks/${artwork.image}`]} alt="" />)}
        </div>
        <div className="avant-finale-chain">
          {Array.from({ length: 8 }, (_, index) => <span key={index}><BrandLink /></span>)}
        </div>
      </div>
      <h1 ref={heading} tabIndex={-1}>Що запам’яталося?</h1>
      <p>Пригадай твори й митців українського авангарду.</p>
      <Link className="avant-explore" to="/quiz">Пройти квіз <span aria-hidden="true">→</span></Link>
    </div>
    <Link className="button avant-finale-home" to="/">На головну</Link>
  </article>;
}

export function AvantReader() {
  const [page, setPage] = useState(0);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const slide = slides[page];

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  function turn(direction: number) {
    setPage(current => Math.min(slideCount, Math.max(0, current + direction)));
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    dragged.current = false;
    if (event.pointerType === 'touch' && event.isPrimary) {
      gesture.current = { x: event.clientX, y: event.clientY };
    }
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || event.pointerType !== 'touch') return;
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    dragged.current = Math.hypot(horizontal, vertical) > 12;
    if (Math.abs(horizontal) > 40 && Math.abs(horizontal) > Math.abs(vertical) * 1.4) {
      turn(horizontal < 0 ? 1 : -1);
    }
  }

  function onContentClick(event: MouseEvent<HTMLElement>) {
    if (dragged.current || event.detail === 0 || window.getSelection()?.toString()) return;
    if ((event.target as Element).closest('a, button')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    turn(event.clientX >= bounds.left + bounds.width / 2 ? 1 : -1);
  }

  if (page === slideCount) return <QuizInvitation goBack={() => turn(-1)} />;

  return <article className="avant-reader" onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      turn(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }}>
    <h1>Ранній модернізм і український авангард</h1>
    <section key={page} className="avant-slide" aria-label={slide.title}
      onClick={onContentClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      onPointerCancel={() => { gesture.current = null; dragged.current = true; }}>
      {slide.type === "artwork" ? <figure className="avant-study">
        <img src={images[`./artworks/${slide.image}`]} alt={slide.title} />
        <figcaption>
          <strong>{slide.title}</strong>
          {slide.credit.map(line => <span className="block" key={line}>{line}</span>)}
        </figcaption>
      </figure> : <>
        <h2>{slide.title}</h2>
        {slide.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </>}
    </section>
    <nav className="avant-pagination" aria-label="Гортання слайдів">
      <progress max={slideCount} value={page + 1} aria-label="Прогрес епохи" />
      <div>
        <button type="button" disabled={page === 0} onClick={() => turn(-1)} aria-label="Попередній слайд">‹</button>
        <output aria-live="polite">{String(page + 1).padStart(2, '0')} / {slideCount}</output>
        <button type="button" onClick={() => turn(1)} aria-label={page === slideCount - 1 ? "Завершити перегляд" : "Наступний слайд"}>›</button>
      </div>
    </nav>
  </article>;
}
