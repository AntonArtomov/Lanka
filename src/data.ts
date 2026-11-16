import epochData from './data/epochs.json';
import narratorData from './data/narrators.json';

export interface Epoch {
  id: string;
  title: string;
  label: string;
  period: string;
  description: string;
  artists: string[];
  works: { title: string; note: string; url?: string }[];
  palette: string[];
}
export interface Narrator {
  id: string;
  title: string;
  sample: string;
}

export const epochs: Epoch[] = epochData;
export const narrators: Narrator[] = narratorData;
