import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/common/Button';
import { Field, Input } from '../components/common/Field';
import { useAuth } from '../context/AuthContext';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name'),
    email: z.email('Enter a valid email address'),
    password: z.string().min(6, 'Use at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const next: Errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      });
      setErrors(next);
      return;
    }

    setErrors({});
    setBusy(true);
    await register(result.data.name, result.data.email, result.data.password);
    navigate('/journal');
  };

  return (
    <AuthLayout
      title="Create your account"
      description="A simple space to record what you learn, every single day."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-600">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Your name" error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </Field>

        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <Input
            type="password"
            value={form.password}
            onChange={(event) => setField('password', event.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword}>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setField('confirmPassword', event.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </Field>

        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
