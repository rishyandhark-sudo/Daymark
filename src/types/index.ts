import type {
  Category,
  Difficulty,
  ProblemStatus,
  Priority,
  Reflection,
} from '../../shared/domain';

export {
  CATEGORIES,
  DIFFICULTIES,
  PROBLEM_STATUSES,
  PRIORITIES,
  REFLECTION_KEYS,
} from '../../shared/domain';
export type {
  Category,
  Difficulty,
  ProblemStatus,
  Priority,
  Reflection,
} from '../../shared/domain';

export interface CodingProblem {
  id: string;
  name: string;
  platform: string;
  url: string;
  difficulty: Difficulty;
  status: ProblemStatus;
}

export interface Activity {
  id: string;
  name: string;
  category: Category;
  description: string;
  topics: string[];
  minutes: number;
  problems: CodingProblem[];
  links: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  summary: string;
  activities: Activity[];
  reflection: Reflection;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
}

export interface PublicStatistics {
  activeDays: boolean;
  problemsSolved: boolean;
  learningHours: boolean;
  currentStreak: boolean;
  heatmap: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
  timeZone: string;
  publicStatistics: PublicStatistics;
}

export type Period = 'week' | 'month' | 'all';

/* -------------------------------------------------------------------------- */
/* Two-section daily journal: TARGET and HAPPENED                             */
/* These are always separate records and are never merged into one entry.      */
/* -------------------------------------------------------------------------- */

export interface SectionActivity {
  id: string;
  name: string;
  category: Category;
  description: string;
  topics: string[];
  minutes: number;
  problems: CodingProblem[];
  links: string[];
}

export interface TargetActivity extends SectionActivity {
  priority: Priority | '';
}

export interface HappenedActivity extends SectionActivity {
  /** Set explicitly by the user. Activities are never auto-matched by title. */
  linkedTargetActivityId: string | null;
}

interface SectionRecordBase {
  date: string;
  title: string;
  description: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
}

export interface TargetRecord extends SectionRecordBase {
  kind: 'target';
  activities: TargetActivity[];
}

export interface HappenedRecord extends SectionRecordBase {
  kind: 'happened';
  activities: HappenedActivity[];
  reflection: Reflection;
}

export interface DayRecord {
  date: string;
  target: TargetRecord | null;
  happened: HappenedRecord | null;
}

export type SectionPayload<T extends TargetRecord | HappenedRecord> = Omit<
  T,
  'date' | 'timeZone' | 'createdAt' | 'updatedAt' | 'kind'
>;
