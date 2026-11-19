import type { AppUser } from '../types';

const SESSION_KEY = 'daymark:session:v1';

export function loadSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AppUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Phase 1 mock auth. Replaced by Firebase Authentication in Phase 3.
export async function signIn(email: string): Promise<AppUser> {
  const name = email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    uid: `local-${email.toLowerCase()}`,
    name: name || 'Daymark user',
    email: email.toLowerCase(),
    photoURL: '',
  };
}

export async function register(name: string, email: string): Promise<AppUser> {
  return {
    uid: `local-${email.toLowerCase()}`,
    name: name.trim(),
    email: email.toLowerCase(),
    photoURL: '',
  };
}
