import { useState } from 'react';

const collectionKey = 'lanka:collection:v1';

function readCollection(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(collectionKey) ?? '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter((id): id is string => typeof id === 'string'))] : [];
  } catch { return []; }
}

/** Єдине локальне сховище для картини дня та екрана колекції. */
export function useCollection() {
  const [ids, setIds] = useState(readCollection);
  const [storageError, setStorageError] = useState(false);

  function setSaved(id: string, saved: boolean) {
    const current = readCollection();
    const next = saved ? [...new Set([...current, id])] : current.filter(item => item !== id);
    try {
      localStorage.setItem(collectionKey, JSON.stringify(next));
      setIds(next);
      setStorageError(false);
    } catch { setStorageError(true); }
  }

  return { ids, setSaved, storageError };
}
