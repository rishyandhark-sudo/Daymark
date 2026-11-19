import type { JournalEntry } from '../types';
import { getMockEntries } from '../data/mockData';

const entriesKey = (userId: string) => `daymark:entries:v1:${userId}`;

// Phase 1 local store. Replaced by Cloud Firestore in Phase 3.
export function loadEntries(userId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(entriesKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as JournalEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fall back to demo data if local storage is unavailable or corrupted.
  }
  return getMockEntries();
}

export function saveEntries(userId: string, entries: JournalEntry[]): void {
  localStorage.setItem(entriesKey(userId), JSON.stringify(entries));
}

export function saveDraft(date: string, entry: JournalEntry): void {
  localStorage.setItem(`daymark:draft:${date}`, JSON.stringify(entry));
}

export function loadDraft(date: string): JournalEntry | null {
  try {
    const raw = localStorage.getItem(`daymark:draft:${date}`);
    return raw ? (JSON.parse(raw) as JournalEntry) : null;
  } catch {
    return null;
  }
}

export function clearDraft(date: string): void {
  localStorage.removeItem(`daymark:draft:${date}`);
}
