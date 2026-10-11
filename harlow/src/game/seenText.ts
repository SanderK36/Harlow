/**
 * Lines the typewriter has already finished. "Skip seen text" reads this.
 * Kept apart from game saves and from the settings blob.
 */

export const SEEN_TEXT_KEY = "harlow-seen-text";
const SEEN_LIMIT = 600;

export type SeenStorage = Pick<Storage, "getItem" | "setItem">;

const listeners = new Set<() => void>();

function resolveStorage(storage?: SeenStorage): SeenStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readList(storage: SeenStorage): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SEEN_TEXT_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

export function hasSeenText(text: string, storage?: SeenStorage) {
  if (!text) return false;
  const store = resolveStorage(storage);
  if (!store) return false;
  return readList(store).includes(text);
}

export function markTextSeen(text: string, storage?: SeenStorage) {
  if (!text) return;
  const store = resolveStorage(storage);
  if (!store) return;
  const without = readList(store).filter((entry) => entry !== text);
  without.push(text);
  const capped = without.length > SEEN_LIMIT ? without.slice(without.length - SEEN_LIMIT) : without;
  try {
    store.setItem(SEEN_TEXT_KEY, JSON.stringify(capped));
  } catch {
    return;
  }
  if (!storage) listeners.forEach((listener) => listener());
}

export function subscribeSeenText(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
