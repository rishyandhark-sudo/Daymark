import type { HappenedActivity, HappenedRecord, TargetActivity, TargetRecord } from '../types';
import { activityMinutes, solvedCount } from './section';

export type CompletionStatus = 'completed' | 'partial' | 'not-completed';

export interface PlannedComparison {
  activity: TargetActivity;
  /** Status is derived only from activities the user explicitly linked. */
  status: CompletionStatus;
  linked: HappenedActivity[];
  actualMinutes: number;
  plannedProblems: number;
  solvedProblems: number;
}

export interface SectionComparison {
  expectedMinutes: number;
  actualMinutes: number;
  plannedProblems: number;
  solvedProblems: number;
  planned: PlannedComparison[];
  /** Actual activities without an explicit link are never auto-matched by title. */
  unlinked: HappenedActivity[];
}

/**
 * Compares a TARGET with a HAPPENED record. Similar titles are never treated as
 * equivalent: only `linkedTargetActivityId` connects actual work to a plan.
 */
export function compareSections(target: TargetRecord, happened: HappenedRecord): SectionComparison {
  const linkedByTarget = new Map<string, HappenedActivity[]>();
  const unlinked: HappenedActivity[] = [];

  happened.activities.forEach((activity) => {
    const id = activity.linkedTargetActivityId;
    if (id && target.activities.some((planned) => planned.id === id)) {
      const list = linkedByTarget.get(id) ?? [];
      list.push(activity);
      linkedByTarget.set(id, list);
    } else {
      unlinked.push(activity);
    }
  });

  const planned = target.activities.map((activity): PlannedComparison => {
    const linked = linkedByTarget.get(activity.id) ?? [];
    const actualMinutes = activityMinutes(linked);
    const plannedProblems = activity.problems.length;
    const solvedProblems = solvedCount(linked);

    let status: CompletionStatus = 'not-completed';
    if (linked.length > 0) {
      const timeDone = activity.minutes === 0 || actualMinutes >= activity.minutes;
      const problemsDone = plannedProblems === 0 || solvedProblems >= plannedProblems;
      status = timeDone && problemsDone ? 'completed' : 'partial';
    }

    return { activity, status, linked, actualMinutes, plannedProblems, solvedProblems };
  });

  return {
    expectedMinutes: activityMinutes(target.activities),
    actualMinutes: activityMinutes(happened.activities),
    plannedProblems: target.activities.reduce((sum, activity) => sum + activity.problems.length, 0),
    solvedProblems: solvedCount(happened.activities),
    planned,
    unlinked,
  };
}
