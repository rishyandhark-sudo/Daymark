import { subDays } from 'date-fns';
import type {
  Activity,
  AppUser,
  Category,
  CodingProblem,
  Difficulty,
  JournalEntry,
  ProblemStatus,
  Reflection,
  TargetRecord,
  HappenedRecord,
  DayRecord,
  SectionActivity,
  TargetActivity,
  HappenedActivity,
  UserProfile,
} from '../types';
import { localDateKey } from '../../shared/time';
import { dateKey } from '../utils/date';

/**
 * Temporary demo content for Phase 1 (UI review only).
 * Every number shown in the interface is derived from these records — nothing is hardcoded.
 * This file is replaced by Firestore-backed data in Phase 3.
 */

interface ProblemSeed {
  name: string;
  platform: string;
  url: string;
  difficulty: Difficulty;
  status: ProblemStatus;
}

interface ActivitySeed {
  name: string;
  category: Category;
  minutes: number;
  description?: string;
  topics?: string[];
  links?: string[];
  problems?: ProblemSeed[];
}

const emptyReflection = (): Reflection => ({
  accomplished: '',
  learned: '',
  challenges: '',
  improve: '',
  tomorrow: '',
});

function makeActivity(entryOffset: number, index: number, seed: ActivitySeed): Activity {
  const problems: CodingProblem[] = (seed.problems ?? []).map((problem, problemIndex) => ({
    id: `demo-p-${entryOffset}-${index}-${problemIndex}`,
    name: problem.name,
    platform: problem.platform,
    url: problem.url,
    difficulty: problem.difficulty,
    status: problem.status,
  }));

  return {
    id: `demo-a-${entryOffset}-${index}`,
    name: seed.name,
    category: seed.category,
    description: seed.description ?? '',
    topics: seed.topics ?? [],
    minutes: seed.minutes,
    problems,
    links: seed.links ?? [],
  };
}

function makeEntry(
  offset: number,
  title: string,
  summary: string,
  seeds: ActivitySeed[],
  reflection: Partial<Reflection> = {},
): JournalEntry {
  const date = subDays(new Date(), offset);
  const key = dateKey(date);
  const timestamp = date.toISOString();

  return {
    id: `demo-e-${offset}`,
    userId: 'demo-user',
    date: key,
    title,
    summary,
    activities: seeds.map((seed, index) => makeActivity(offset, index, seed)),
    reflection: { ...emptyReflection(), ...reflection },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const DEMO_USER: AppUser = {
  uid: 'demo-user',
  name: 'Rishy Andhark',
  email: 'demo@dailyprogress.app',
  photoURL: '',
};

export const DEMO_PROFILE: UserProfile = {
  uid: 'demo-user',
  displayName: 'Rishy Andhark',
  username: 'rishy',
  bio: 'Learning something new every day. Currently focused on programming, machine learning and building small projects.',
  photoURL: '',
  timeZone: 'Asia/Kolkata',
  publicStatistics: {
    activeDays: true,
    problemsSolved: true,
    learningHours: true,
    currentStreak: true,
    heatmap: true,
  },
};

export function getMockEntries(): JournalEntry[] {
  return [
    makeEntry(
      0,
      'DSA + Java',
      'Steady session on arrays and a bit of Java practice in the evening.',
      [
        {
          name: 'Array practice',
          category: 'DSA',
          minutes: 75,
          description: 'Worked on sliding window patterns and two-pointer problems.',
          topics: ['Sliding window', 'Two pointers'],
          problems: [
            { name: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium', status: 'Solved' },
            { name: 'Minimum Size Subarray Sum', platform: 'LeetCode', url: 'https://leetcode.com/problems/minimum-size-subarray-sum/', difficulty: 'Medium', status: 'Attempted' },
          ],
          links: ['https://leetcode.com/study-plan/arrays/'],
        },
        {
          name: 'Java collections',
          category: 'Java',
          minutes: 40,
          description: 'Revised HashMap internals and practised a few examples.',
          topics: ['HashMap', 'Collections'],
        },
      ],
      {
        learned: 'Sliding window problems become easier when the invariant is written down first.',
        tomorrow: 'Finish the remaining two-pointer set and review Java generics.',
      },
    ),
    makeEntry(
      1,
      'Web Development',
      'Built a small responsive layout and cleaned up the component structure.',
      [
        {
          name: 'Frontend practice',
          category: 'Web Development',
          minutes: 95,
          description: 'Implemented a responsive dashboard layout with reusable cards.',
          topics: ['React', 'CSS Grid', 'Responsive design'],
          links: ['https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout'],
        },
      ],
      {
        accomplished: 'Completed the responsive layout and checked it at mobile width.',
        challenges: 'Getting the grid to collapse gracefully at tablet size took a few tries.',
      },
    ),
    makeEntry(
      2,
      'ML Learning',
      'Started a short course on supervised learning and worked through the first notebook.',
      [
        {
          name: 'Supervised learning basics',
          category: 'AI / ML',
          minutes: 80,
          description: 'Linear regression, cost functions and gradient descent intuition.',
          topics: ['Linear regression', 'Gradient descent'],
          links: ['https://www.coursera.org/learn/machine-learning'],
        },
      ],
      {
        learned: 'The learning rate has a bigger effect on convergence than I expected.',
      },
    ),
    makeEntry(
      3,
      'Project Work',
      'Added the first version of the weekly progress view to the side project.',
      [
        {
          name: 'Progress view',
          category: 'Projects',
          minutes: 110,
          description: 'Added charts and wired them to local sample data.',
          topics: ['Charts', 'Component design'],
        },
        {
          name: 'Reading',
          category: 'Reading',
          minutes: 25,
          description: 'A few pages on clean component boundaries.',
        },
      ],
      {
        accomplished: 'The first chart is rendering and the layout works on mobile.',
        improve: 'Split the data logic out of the component earlier next time.',
      },
    ),
    makeEntry(
      5,
      'Academics + DSA',
      'Revised for a college test and solved a few easy problems as a warm-up.',
      [
        {
          name: 'Revision',
          category: 'Academics',
          minutes: 70,
          topics: ['DBMS', 'Normalization'],
        },
        {
          name: 'Warm-up problems',
          category: 'DSA',
          minutes: 35,
          problems: [
            { name: 'Two Sum', platform: 'LeetCode', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', status: 'Solved' },
          ],
        },
      ],
    ),
    makeEntry(
      7,
      'Java fundamentals',
      'Focused on exceptions and multithreading basics.',
      [
        {
          name: 'Java practice',
          category: 'Java',
          minutes: 65,
          topics: ['Exceptions', 'Threads'],
          problems: [
            { name: 'Thread-safe counter', platform: 'GitHub', url: '', difficulty: 'Medium', status: 'Attempted' },
          ],
        },
      ],
    ),
    makeEntry(
      8,
      'Graph problems',
      'Spent the evening on BFS and DFS variations.',
      [
        {
          name: 'Graphs',
          category: 'DSA',
          minutes: 90,
          topics: ['BFS', 'DFS'],
          problems: [
            { name: 'Number of Islands', platform: 'LeetCode', url: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'Medium', status: 'Solved' },
            { name: 'Course Schedule', platform: 'LeetCode', url: 'https://leetcode.com/problems/course-schedule/', difficulty: 'Medium', status: 'Solved' },
            { name: 'Word Ladder', platform: 'LeetCode', url: 'https://leetcode.com/problems/word-ladder/', difficulty: 'Hard', status: 'Attempted' },
          ],
        },
      ],
    ),
    makeEntry(
      9,
      'Reading + planning',
      'Read a chapter on deep work and planned the coming week.',
      [
        { name: 'Reading', category: 'Reading', minutes: 35, topics: ['Focus', 'Deep work'] },
        { name: 'Weekly planning', category: 'Personal Development', minutes: 20 },
      ],
    ),
    makeEntry(
      11,
      'Agentic AI exploration',
      'Tried a small tool-calling example and read about agent loops.',
      [
        {
          name: 'Agent basics',
          category: 'Agentic AI',
          minutes: 85,
          description: 'Explored tool calling, short-term memory and simple loops.',
          topics: ['Tool calling', 'Agent loops'],
          links: ['https://platform.openai.com/docs/guides/function-calling'],
        },
      ],
    ),
    makeEntry(
      12,
      'Python scripting',
      'Automated a small file-cleanup task with Python.',
      [
        {
          name: 'Automation script',
          category: 'Python',
          minutes: 55,
          topics: ['pathlib', 'Scripting'],
        },
      ],
    ),
    makeEntry(
      14,
      'Side project',
      'Set up the project structure and fixed a few rough edges.',
      [{ name: 'Project setup', category: 'Projects', minutes: 100, topics: ['Vite', 'TypeScript'] }],
    ),
    makeEntry(
      18,
      'Web Development',
      'Practised forms, validation and accessible inputs.',
      [
        {
          name: 'Forms',
          category: 'Web Development',
          minutes: 70,
          topics: ['Validation', 'Accessibility'],
        },
      ],
    ),
    makeEntry(
      21,
      'Habit review',
      'Took a quiet morning to review the last few weeks.',
      [{ name: 'Reflection', category: 'Personal Development', minutes: 30 }],
    ),
    makeEntry(
      26,
      'Neural networks intro',
      'Watched a lecture on perceptrons and activation functions.',
      [{ name: 'Neural networks', category: 'AI / ML', minutes: 60, topics: ['Perceptrons', 'Activations'] }],
    ),
    makeEntry(
      33,
      'DSA consistency',
      'Kept the streak going with a few string problems.',
      [
        {
          name: 'Strings',
          category: 'DSA',
          minutes: 45,
          problems: [
            { name: 'Valid Anagram', platform: 'LeetCode', url: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'Easy', status: 'Solved' },
          ],
        },
      ],
    ),
  ];
}

/* -------------------------------------------------------------------------- */
/* TARGET / HAPPENED demo records                                              */
/* Seed data only — production records come from Firestore via Cloud Functions. */
/* -------------------------------------------------------------------------- */

interface DemoDaySeed {
  offset: number;
  target?: { title: string; description?: string; activities: ActivitySeed[] };
  happened?: { title: string; description?: string; activities: ActivitySeed[] };
  reflection?: Partial<Reflection>;
}

function toSectionActivity(
  offset: number,
  index: number,
  seed: ActivitySeed,
  kind: 'target' | 'happened',
  linkedTargetActivityId: string | null = null,
): SectionActivity {
  const prefix = kind === 'target' ? 't' : 'h';
  const problems: CodingProblem[] = (seed.problems ?? []).map((problem, problemIndex) => ({
    id: `demo-p-${prefix}-${offset}-${index}-${problemIndex}`,
    name: problem.name,
    platform: problem.platform,
    url: problem.url,
    difficulty: problem.difficulty,
    status: problem.status,
  }));

  const base: SectionActivity = {
    id: `demo-a-${prefix}-${offset}-${index}`,
    name: seed.name,
    category: seed.category,
    description: seed.description ?? '',
    topics: seed.topics ?? [],
    minutes: seed.minutes,
    problems,
    links: seed.links ?? [],
  };

  if (kind === 'target') {
    return { ...base, priority: '' } as TargetActivity;
  }
  return { ...base, linkedTargetActivityId } as HappenedActivity;
}

const DEMO_DAYS: DemoDaySeed[] = [
  {
    offset: 0,
    target: {
      title: 'DSA + Java',
      description: 'Finish the sliding-window set and revise Java collections.',
      activities: [
        {
          name: 'Array practice',
          category: 'DSA',
          minutes: 75,
          description: 'Sliding window and two-pointer patterns.',
          topics: ['Sliding window', 'Two pointers'],
          problems: [
            { name: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', url: '', difficulty: 'Medium', status: 'Solved' },
            { name: 'Minimum Size Subarray Sum', platform: 'LeetCode', url: '', difficulty: 'Medium', status: 'Attempted' },
          ],
        },
        { name: 'Java collections', category: 'Java', minutes: 45, topics: ['HashMap', 'Generics'] },
      ],
    },
  },
  {
    offset: 1,
    target: {
      title: 'Web Development',
      description: 'Build the responsive layout and check it on mobile.',
      activities: [{ name: 'Frontend practice', category: 'Web Development', minutes: 90, topics: ['React', 'CSS Grid'] }],
    },
    happened: {
      title: 'Web Development',
      description: 'Completed most of the layout; tablet breakpoint still needs work.',
      activities: [
        { name: 'Frontend practice', category: 'Web Development', minutes: 70, topics: ['React', 'CSS Grid'] },
        { name: 'Quick reading', category: 'Reading', minutes: 20, topics: ['Accessibility'] },
      ],
    },
    reflection: {
      learned: 'The grid collapses cleanly once the breakpoint is explicit.',
      challenges: 'Tablet sizing needed an extra check.',
    },
  },
  {
    offset: 2,
    // No target: demonstrates that HAPPENED can be recorded independently.
    happened: {
      title: 'ML Learning',
      description: 'Started supervised learning notes.',
      activities: [{ name: 'Supervised learning basics', category: 'AI / ML', minutes: 80, topics: ['Linear regression', 'Gradient descent'] }],
    },
  },
  {
    offset: 3,
    target: {
      title: 'Project Work',
      description: 'Add charts and tidy the project structure.',
      activities: [
        { name: 'Progress view', category: 'Projects', minutes: 100 },
        { name: 'Code review', category: 'Projects', minutes: 30 },
      ],
    },
    happened: {
      title: 'Project Work',
      description: 'Charts are rendering; code review moved to tomorrow.',
      activities: [
        { name: 'Progress view', category: 'Projects', minutes: 110, topics: ['Charts', 'Component design'] },
        { name: 'Reading', category: 'Reading', minutes: 25 },
      ],
    },
    reflection: { improve: 'Schedule the review earlier next time.' },
  },
  {
    offset: 5,
    target: { title: 'Academics + DSA', activities: [{ name: 'Revision', category: 'Academics', minutes: 70 }, { name: 'Warm-up problems', category: 'DSA', minutes: 35 }] },
    happened: { title: 'Academics + DSA', activities: [{ name: 'Revision', category: 'Academics', minutes: 70 }, { name: 'Warm-up problems', category: 'DSA', minutes: 40, problems: [{ name: 'Two Sum', platform: 'LeetCode', url: '', difficulty: 'Easy', status: 'Solved' }] }] },
  },
  {
    offset: 7,
    target: { title: 'Java fundamentals', activities: [{ name: 'Java practice', category: 'Java', minutes: 70 }] },
    happened: { title: 'Java fundamentals', activities: [{ name: 'Java practice', category: 'Java', minutes: 65, topics: ['Exceptions', 'Threads'] }] },
  },
  {
    offset: 8,
    target: { title: 'Graph problems', activities: [{ name: 'Graphs', category: 'DSA', minutes: 90, problems: [{ name: 'Number of Islands', platform: 'LeetCode', url: '', difficulty: 'Medium', status: 'Attempted' }] }] },
    happened: { title: 'Graph problems', activities: [{ name: 'Graphs', category: 'DSA', minutes: 90, problems: [
      { name: 'Number of Islands', platform: 'LeetCode', url: '', difficulty: 'Medium', status: 'Solved' },
      { name: 'Course Schedule', platform: 'LeetCode', url: '', difficulty: 'Medium', status: 'Solved' },
      { name: 'Word Ladder', platform: 'LeetCode', url: '', difficulty: 'Hard', status: 'Attempted' },
    ] }] },
    reflection: { accomplished: 'Two graph problems solved.' },
  },
  {
    offset: 9,
    target: { title: 'Reading + planning', activities: [{ name: 'Reading', category: 'Reading', minutes: 40 }, { name: 'Weekly planning', category: 'Personal Development', minutes: 25 }] },
    happened: { title: 'Reading + planning', activities: [{ name: 'Reading', category: 'Reading', minutes: 35 }, { name: 'Weekly planning', category: 'Personal Development', minutes: 20 }] },
  },
  {
    offset: 11,
    target: { title: 'Agentic AI exploration', activities: [{ name: 'Agent basics', category: 'Agentic AI', minutes: 90 }] },
    happened: { title: 'Agentic AI exploration', activities: [{ name: 'Agent basics', category: 'Agentic AI', minutes: 85, topics: ['Tool calling', 'Agent loops'] }] },
  },
  {
    offset: 12,
    target: { title: 'Python scripting', activities: [{ name: 'Automation script', category: 'Python', minutes: 60 }] },
    happened: { title: 'Python scripting', activities: [{ name: 'Automation script', category: 'Python', minutes: 55, topics: ['pathlib'] }] },
  },
  {
    offset: 14,
    target: { title: 'Side project', activities: [{ name: 'Project setup', category: 'Projects', minutes: 100 }] },
    happened: { title: 'Side project', activities: [{ name: 'Project setup', category: 'Projects', minutes: 100 }] },
  },
  {
    offset: 18,
    target: { title: 'Web Development', activities: [{ name: 'Forms', category: 'Web Development', minutes: 75 }] },
    happened: { title: 'Web Development', activities: [{ name: 'Forms', category: 'Web Development', minutes: 70 }] },
  },
  {
    offset: 21,
    target: { title: 'Habit review', activities: [{ name: 'Reflection', category: 'Personal Development', minutes: 30 }] },
    happened: { title: 'Habit review', activities: [{ name: 'Reflection', category: 'Personal Development', minutes: 30 }] },
  },
  {
    offset: 26,
    target: { title: 'Neural networks intro', activities: [{ name: 'Neural networks', category: 'AI / ML', minutes: 70 }] },
    happened: { title: 'Neural networks intro', activities: [{ name: 'Neural networks', category: 'AI / ML', minutes: 60 }] },
  },
  {
    offset: 33,
    target: { title: 'DSA consistency', activities: [{ name: 'Strings', category: 'DSA', minutes: 50 }] },
    happened: { title: 'DSA consistency', activities: [{ name: 'Strings', category: 'DSA', minutes: 45, problems: [{ name: 'Valid Anagram', platform: 'LeetCode', url: '', difficulty: 'Easy', status: 'Solved' }] }] },
  },
  {
    // Future date: targets can be prepared in advance.
    offset: -2,
    target: {
      title: 'Next session plan',
      description: 'Prepare the next focus areas ahead of time.',
      activities: [{ name: 'Revision', category: 'Academics', minutes: 60 }],
    },
  },
];

export function getMockDays(): DayRecord[] {
  const zone = DEMO_PROFILE.timeZone;

  return DEMO_DAYS.map((seed) => {
    const date = subDays(new Date(), seed.offset);
    // Date keys must match the timezone declared on each record, otherwise
    // near midnight the seed appears locked relative to the app's "today".
    const key = localDateKey(date, zone);
    const timestamp = date.toISOString();

    const target: TargetRecord | null = seed.target
      ? {
          kind: 'target',
          date: key,
          title: seed.target.title,
          description: seed.target.description ?? '',
          activities: seed.target.activities.map((activity, index) =>
            toSectionActivity(seed.offset, index, activity, 'target') as TargetActivity,
          ),
          timeZone: zone,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      : null;

    const happened: HappenedRecord | null = seed.happened
      ? {
          kind: 'happened',
          date: key,
          title: seed.happened.title,
          description: seed.happened.description ?? '',
          activities: seed.happened.activities.map((activity, index) =>
            toSectionActivity(
              seed.offset,
              index,
              activity,
              'happened',
              target?.activities[index]?.id ?? null,
            ) as HappenedActivity,
          ),
          reflection: {
            accomplished: '',
            learned: '',
            challenges: '',
            improve: '',
            tomorrow: '',
            ...seed.reflection,
          },
          timeZone: zone,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      : null;

    return { date: key, target, happened };
  }).sort((a, b) => b.date.localeCompare(a.date));
}
