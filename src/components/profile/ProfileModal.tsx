import { useEffect, useState } from 'react';
import { Check, Copy, ImageIcon } from 'lucide-react';
import { z } from 'zod';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Field, Input, Select, Textarea } from '../common/Field';
import { Modal } from '../common/Modal';
import { isValidTimeZone, timeZoneOptions } from '../../../shared/time';
import { useAuth } from '../../context/AuthContext';
import { PUBLIC_STAT_OPTIONS } from '../../utils/constants';
import type { PublicStatistics, UserProfile } from '../../types';

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter a display name').max(50, 'Keep it under 50 characters'),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/, 'Use 3–20 lowercase letters, numbers or underscores'),
  bio: z.string().max(240, 'Keep your bio under 240 characters'),
  photoURL: z.union([z.literal(''), z.url('Enter a valid image URL')]),
  timeZone: z.string().refine(isValidTimeZone, 'Choose a valid timezone'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = useState<UserProfile>(profile);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(profile);
      setErrors({});
      setSaved(false);
      setCopied(false);
    }
  }, [open, profile]);

  const setField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const setStat = (key: keyof PublicStatistics, value: boolean) => {
    setForm((current) => ({
      ...current,
      publicStatistics: { ...current.publicStatistics, [key]: value },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const result = profileSchema.safeParse({
      displayName: form.displayName,
      username: form.username,
      bio: form.bio,
      photoURL: form.photoURL,
      timeZone: form.timeZone,
    });

    if (!result.success) {
      const nextErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    updateProfile({ ...form, ...result.data });
    setErrors({});
    setSaved(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`/u/${form.username}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Choose what you want to share on your public profile."
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {saved ? 'Profile saved' : 'Only the details you select are public'}
          </span>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              {saved ? <Check size={15} strokeWidth={2} /> : null}
              Save profile
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <Avatar name={form.displayName || 'You'} src={form.photoURL} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{form.displayName || 'Your name'}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">/u/{form.username || 'username'}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
              <ImageIcon size={12} strokeWidth={1.8} /> Add a picture with a URL below
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" error={errors.displayName}>
            <Input
              value={form.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Username" error={errors.username} hint="Lowercase letters, numbers and underscores">
            <Input
              value={form.username}
              onChange={(event) => setField('username', event.target.value.toLowerCase())}
              placeholder="username"
            />
          </Field>
        </div>

        <Field label="Bio" optional error={errors.bio}>
          <Textarea
            value={form.bio}
            onChange={(event) => setField('bio', event.target.value)}
            placeholder="A short line about what you are learning"
            rows={3}
          />
        </Field>

        <Field label="Profile picture URL" optional error={errors.photoURL}>
          <Input
            value={form.photoURL}
            onChange={(event) => setField('photoURL', event.target.value)}
            placeholder="https://example.com/photo.jpg"
          />
        </Field>

        <Field
          label="Timezone"
          error={errors.timeZone}
          hint="TARGET locks at 11:59 PM and HAPPENED unlocks at 12:00 AM in this zone. Existing days keep their original timezone."
        >
          <Select value={form.timeZone} onChange={(event) => setField('timeZone', event.target.value)}>
            {!timeZoneOptions().includes(form.timeZone) && (
              <option value={form.timeZone}>{form.timeZone}</option>
            )}
            {timeZoneOptions().map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <p className="text-xs font-medium text-slate-600">Public statistics</p>
          <p className="mt-1 text-xs text-slate-400">Everything else stays private to your journal.</p>
          <div className="mt-3 space-y-2">
            {PUBLIC_STAT_OPTIONS.map((option) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span>
                  <span className="block text-sm text-slate-700">{option.label}</span>
                  <span className="block text-[11px] text-slate-400">{option.description}</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.publicStatistics[option.key]}
                  onChange={(event) => setStat(option.key, event.target.checked)}
                  className="h-4 w-4 accent-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-left text-xs text-slate-500 hover:bg-slate-50"
        >
          <span className="truncate">Your public link: /u/{form.username || 'username'}</span>
          {copied ? (
            <Check size={14} className="text-emerald-500" />
          ) : (
            <Copy size={14} className="shrink-0 text-slate-400" />
          )}
        </button>
      </div>
    </Modal>
  );
}
