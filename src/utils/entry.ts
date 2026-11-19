import type { Activity, CodingProblem, JournalEntry, Reflection } from '../types';

export function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function emptyReflection(): Reflection {
  return {
    accomplished: '',
    learned: '',
    challenges: '',
    improve: '',
    tomorrow: '',
  };
}

export function blankActivity(): Activity {
  return {
    id: newId('activity'),
    name: '',
    category: 'DSA',
    description: '',
    topics: [],
    minutes: 30,
    problems: [],
    links: [],
  };
}

export function blankProblem(): CodingProblem {
  return {
    id: newId('problem'),
    name: '',
    platform: 'LeetCode',
    url: '',
    difficulty: 'Easy',
    status: 'Solved',
  };
}

export function blankEntry(date: string, userId: string): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: newId('entry'),
    userId,
    date,
    title: '',
    summary: '',
    activities: [],
    reflection: emptyReflection(),
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneEntry(entry: JournalEntry): JournalEntry {
  return JSON.parse(JSON.stringify(entry)) as JournalEntry;
}
