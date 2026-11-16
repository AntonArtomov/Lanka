import type { CSSProperties } from 'react';
import { linkOutline } from './linkOutline';

export function BrandLink({ style }: { style?: CSSProperties }) {
  return <svg className="brand-link" viewBox="-150 -88 300 176" aria-hidden="true" style={style}>
    <path d={linkOutline} transform="rotate(-24)" fill="none" stroke="currentColor" strokeWidth="23" />
  </svg>;
}
