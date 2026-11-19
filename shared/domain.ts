/**
 * Domain constants shared by the web app, Cloud Functions and tests.
 * Kept outside `src` so server code does not depend on the React application.
 */

export const CATEGORIES = [
  'DSA',
  'Java',
  'Python',
  'Web Development',
  'AI / ML',
  'Agentic AI',
  'Projects',
  'Academics',
  'Reading',
  'Personal Development',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PROBLEM_STATUSES = ['Solved', 'Attempted'] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REFLECTION_KEYS = [
  'accomplished',
  'learned',
  'challenges',
  'improve',
  'tomorrow',
] as const;

export interface Reflection {
  accomplished: string;
  learned: string;
  challenges: string;
  improve: string;
  tomorrow: string;
}
