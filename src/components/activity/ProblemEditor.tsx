import { Trash2 } from 'lucide-react';
import type { CodingProblem, Difficulty, ProblemStatus } from '../../types';
import { DIFFICULTIES, PROBLEM_STATUSES } from '../../types';
import { Input, Select } from '../common/Field';
import { PLATFORM_SUGGESTIONS } from '../../utils/constants';
import { cn } from '../../utils/cn';

export function ProblemEditor({
  problem,
  listId,
  onChange,
  onRemove,
}: {
  problem: CodingProblem;
  listId: string;
  onChange: (problem: CodingProblem) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof CodingProblem>(key: K, value: CodingProblem[K]) => {
    onChange({ ...problem, [key]: value });
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-surface p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Input
            value={problem.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Problem name"
            aria-label="Problem name"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove problem"
          className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Input
            list={listId}
            value={problem.platform}
            onChange={(event) => set('platform', event.target.value)}
            placeholder="Platform"
            aria-label="Platform"
          />
          <datalist id={listId}>
            {PLATFORM_SUGGESTIONS.map((platform) => (
              <option key={platform} value={platform} />
            ))}
          </datalist>
        </div>
        <Select
          value={problem.difficulty}
          onChange={(event) => set('difficulty', event.target.value as Difficulty)}
          aria-label="Difficulty"
        >
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </Select>
      </div>

      <Input
        type="url"
        value={problem.url}
        onChange={(event) => set('url', event.target.value)}
        placeholder="Reference URL (optional)"
        aria-label="Problem URL"
      />

      <div className="flex gap-1.5">
        {PROBLEM_STATUSES.map((status: ProblemStatus) => (
          <button
            key={status}
            type="button"
            onClick={() => set('status', status)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors',
              problem.status === status
                ? status === 'Solved'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50',
            )}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
