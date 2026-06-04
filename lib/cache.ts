const store = new Map<string, { data: unknown; ts: number }>();

const TTL = 30000;

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (entry && Date.now() - entry.ts < TTL) return entry.data as T;
  store.delete(key);
  return null;
}

export function setCache(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}
