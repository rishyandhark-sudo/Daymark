import { describe, expect, it } from 'vitest';
import { compareSections } from '../src/utils/comparison';
import {
  blankHappenedActivity,
  blankHappenedRecord,
  blankTargetActivity,
  blankTargetRecord,
} from '../src/utils/section';

describe('TARGET / HAPPENED comparison', () => {
  it('never auto-matches activities with similar titles', () => {
    const target = blankTargetRecord('2026-01-01', 'UTC');
    const happened = blankHappenedRecord('2026-01-01', 'UTC');
    const planned = { ...blankTargetActivity(), name: 'Array practice', minutes: 60 };
    const actual = { ...blankHappenedActivity(), name: 'Array practice', minutes: 60 };
    target.activities = [planned];
    happened.activities = [actual];

    const result = compareSections(target, happened);
    expect(result.planned[0].status).toBe('not-completed');
    expect(result.unlinked).toHaveLength(1);
  });

  it('uses explicit links to determine completion status', () => {
    const target = blankTargetRecord('2026-01-01', 'UTC');
    const happened = blankHappenedRecord('2026-01-01', 'UTC');
    const planned = {
      ...blankTargetActivity(),
      id: 'planned-1',
      name: 'Graphs',
      minutes: 90,
      problems: [
        {
          id: 'problem-1',
          name: 'Number of Islands',
          platform: 'LeetCode',
          url: '',
          difficulty: 'Medium' as const,
          status: 'Attempted' as const,
        },
      ],
    };
    target.activities = [planned];

    const linked = {
      ...blankHappenedActivity(),
      name: 'Different title entirely',
      minutes: 90,
      linkedTargetActivityId: planned.id,
      problems: [
        {
          id: 'problem-2',
          name: 'Something else',
          platform: 'LeetCode',
          url: '',
          difficulty: 'Medium' as const,
          status: 'Solved' as const,
        },
      ],
    };
    happened.activities = [linked];

    const result = compareSections(target, happened);
    expect(result.planned[0].status).toBe('completed');
    expect(result.unlinked).toHaveLength(0);
    expect(result.expectedMinutes).toBe(90);
    expect(result.actualMinutes).toBe(90);
    expect(result.plannedProblems).toBe(1);
    expect(result.solvedProblems).toBe(1);
  });

  it('marks linked work with less time or fewer solved problems as partial', () => {
    const target = blankTargetRecord('2026-01-01', 'UTC');
    const happened = blankHappenedRecord('2026-01-01', 'UTC');
    const planned = { ...blankTargetActivity(), id: 'planned-1', minutes: 90 };
    target.activities = [planned];
    happened.activities = [
      {
        ...blankHappenedActivity(),
        minutes: 45,
        linkedTargetActivityId: planned.id,
      },
    ];

    expect(compareSections(target, happened).planned[0].status).toBe('partial');
  });
});
