import type {
  Activity,
  HappenedActivity,
  HappenedRecord,
  JournalEntry,
  SectionActivity,
  TargetActivity,
  TargetRecord,
} from '../types';
import { newId } from './entry';

export function blankTargetActivity(): TargetActivity {
  return {
    id: newId('target-activity'),
    name: '',
    category: 'DSA',
    description: '',
    topics: [],
    minutes: 30,
    problems: [],
    links: [],
    priority: '',
  };
}

export function blankHappenedActivity(): HappenedActivity {
  return {
    id: newId('happened-activity'),
    name: '',
    category: 'DSA',
    description: '',
    topics: [],
    minutes: 30,
    problems: [],
    links: [],
    linkedTargetActivityId: null,
  };
}

export function blankTargetRecord(date: string, timeZone: string): TargetRecord {
  const now = new Date().toISOString();
  return {
    kind: 'target',
    date,
    title: '',
    description: '',
    activities: [],
    timeZone,
    createdAt: now,
    updatedAt: now,
  };
}

export function blankHappenedRecord(date: string, timeZone: string): HappenedRecord {
  const now = new Date().toISOString();
  return {
    kind: 'happened',
    date,
    title: '',
    description: '',
    activities: [],
    reflection: {
      accomplished: '',
      learned: '',
      challenges: '',
      improve: '',
      tomorrow: '',
    },
    timeZone,
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneTarget(record: TargetRecord): TargetRecord {
  return JSON.parse(JSON.stringify(record)) as TargetRecord;
}

export function cloneHappened(record: HappenedRecord): HappenedRecord {
  return JSON.parse(JSON.stringify(record)) as HappenedRecord;
}

export function activityMinutes(activities: SectionActivity[]): number {
  return activities.reduce((total, activity) => total + Math.max(0, activity.minutes), 0);
}

export function solvedCount(activities: SectionActivity[]): number {
  return activities.reduce(
    (total, activity) =>
      total + activity.problems.filter((problem) => problem.status === 'Solved').length,
    0,
  );
}

export function problemCount(activities: SectionActivity[]): number {
  return activities.reduce((total, activity) => total + activity.problems.length, 0);
}

/** Legacy Phase 1 entries represented actual work; migrate them to HAPPENED only. */
export function legacyEntryToHappened(entry: JournalEntry, timeZone: string): HappenedRecord {
  const activities: HappenedActivity[] = entry.activities.map((activity: Activity) => ({
    id: activity.id,
    name: activity.name,
    category: activity.category,
    description: activity.description,
    topics: activity.topics,
    minutes: activity.minutes,
    problems: activity.problems,
    links: activity.links,
    linkedTargetActivityId: null,
  }));

  return {
    kind: 'happened',
    date: entry.date,
    title: entry.title,
    description: entry.summary,
    activities,
    reflection: entry.reflection,
    timeZone,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
