import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/common/Button';
import { Field, Input } from '../components/common/Field';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Use at least 6 characters'),
});

type Errors = Partial<Record<'email' | 'password', string>>;

export function Login() {
  const { signIn, signInWithDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = loginSchema.safeParse({ email, password });
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
    await signIn(result.data.email, result.data.password);
    navigate('/journal');
  };

  const handleDemo = async () => {
    setBusy(true);
    await signInWithDemo();
    navigate('/journal');
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue your journal, exactly where you left off."
      footer={
        <>
          New to Daymark?{' '}
          <Link to="/register" className="font-medium text-indigo-500 hover:text-indigo-600">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete="current-password"
          />
        </Field>

        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-100" />
        <span className="text-[11px] uppercase tracking-wider text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-100" />
      </div>

      <Button onClick={handleDemo} className="w-full" disabled={busy}>
        Explore with demo account <ArrowRight size={15} strokeWidth={1.8} />
      </Button>
    </AuthLayout>
  );
}
