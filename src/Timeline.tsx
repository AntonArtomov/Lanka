import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { epochs } from './data';

const width = 440;
const rowHeight = 108;
const endInset = 56;
const points = epochs.map((_, index) => ({
  x: index % 2 === 0 ? 60 : width - 60,
  y: endInset + index * rowHeight,
}));
const height = endInset * 2 + (points.length - 1) * rowHeight;
const path = points.map((point, index) => {
  if (index === 0) return `M ${point.x} ${point.y}`;
  const previous = points[index - 1];
  const middle = (previous.y + point.y) / 2;
  return `C ${previous.x} ${middle}, ${point.x} ${middle}, ${point.x} ${point.y}`;
}).join(' ');

export function Timeline() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="timeline" style={{ aspectRatio: `${width} / ${height}` }}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={path} fill="none" stroke="#d0c5aa" strokeWidth="8" strokeDasharray="1 14" strokeLinecap="round" />
        <motion.path d={path} fill="none" stroke="#b45136" strokeWidth="4" strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reducedMotion ? 0 : 1.65, ease: 'easeInOut' }} />
      </svg>
      <ol aria-label="Зупинки мандрівки">
        {epochs.map((epoch, index) => (
          <motion.li key={epoch.id}
            className={index % 2 ? 'stop stop-right' : 'stop'}
            style={{ left: `${points[index].x / width * 100}%`, top: `${points[index].y / height * 100}%` }}
            initial={reducedMotion ? false : { opacity: 0.65 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : index * 0.19 }}>
            <Link to={`/epoch/${epoch.id}`}>
              <span className="stop-number">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{epoch.label}</strong><small>{epoch.period}</small></span>
            </Link>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
