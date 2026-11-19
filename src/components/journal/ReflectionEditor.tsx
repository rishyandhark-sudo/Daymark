import type { Reflection } from '../../types';
import { REFLECTION_QUESTIONS } from '../../utils/constants';
import { Field, Textarea } from '../common/Field';

export function ReflectionEditor({
  reflection,
  onChange,
}: {
  reflection: Reflection;
  onChange: (reflection: Reflection) => void;
}) {
  return (
    <div className="grid gap-4">
      {REFLECTION_QUESTIONS.map((question) => (
        <Field key={question.key} label={question.label} optional>
          <Textarea
            value={reflection[question.key]}
            onChange={(event) => onChange({ ...reflection, [question.key]: event.target.value })}
            placeholder={question.placeholder}
            rows={2}
          />
        </Field>
      ))}
    </div>
  );
}
