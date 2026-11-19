import { CATEGORIES, type Category } from '../types';

export const CATEGORY_OPTIONS = CATEGORIES;

export const PLATFORM_SUGGESTIONS = [
  'LeetCode',
  'CodeChef',
  'HackerRank',
  'GFG',
  'Codeforces',
  'GitHub',
];

export const REFLECTION_QUESTIONS = [
  { key: 'accomplished', label: 'What did I accomplish?', placeholder: 'The main things you finished today…' },
  { key: 'learned', label: 'What did I learn?', placeholder: 'A concept, a trick, a new perspective…' },
  { key: 'challenges', label: 'What challenges did I face?', placeholder: 'Where did you get stuck?' },
  { key: 'improve', label: 'What can I improve?', placeholder: 'One thing to do differently next time…' },
  { key: 'tomorrow', label: "Tomorrow's target", placeholder: 'A clear focus for the next session…' },
] as const;

export const PUBLIC_STAT_OPTIONS: { key: keyof import('../types').PublicStatistics; label: string; description: string }[] = [
  { key: 'activeDays', label: 'Active days', description: 'Total days with an entry' },
  { key: 'problemsSolved', label: 'Problems solved', description: 'Total solved problems' },
  { key: 'learningHours', label: 'Learning hours', description: 'Total time invested' },
  { key: 'currentStreak', label: 'Current streak', description: 'Consecutive active days' },
  { key: 'heatmap', label: 'Activity heatmap', description: 'Monthly consistency overview' },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  DSA: '#6366f1',
  Java: '#f59e0b',
  Python: '#0ea5e9',
  'Web Development': '#14b8a6',
  'AI / ML': '#8b5cf6',
  'Agentic AI': '#d946ef',
  Projects: '#f97316',
  Academics: '#3b82f6',
  Reading: '#10b981',
  'Personal Development': '#64748b',
  Other: '#94a3b8',
};
