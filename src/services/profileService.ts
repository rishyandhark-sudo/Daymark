import { DEMO_PROFILE, DEMO_USER } from '../data/mockData';
import type { AppUser, UserProfile } from '../types';
import { DEFAULT_TIME_ZONE } from '../../shared/time';

const profileKey = (uid: string) => `daymark:profile:v1:${uid}`;

export function defaultProfile(user: AppUser): UserProfile {
  return {
    uid: user.uid,
    displayName: user.name,
    username: (user.uid === DEMO_USER.uid ? DEMO_PROFILE.username : user.email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ''),
    bio: '',
    photoURL: user.photoURL || '',
    timeZone: DEFAULT_TIME_ZONE,
    publicStatistics: { ...DEMO_PROFILE.publicStatistics },
  };
}

// Phase 1 local store. Replaced by a separate public Firestore resource in Phase 5.
export function loadProfile(user: AppUser | null): UserProfile {
  if (!user) return DEMO_PROFILE;
  try {
    const raw = localStorage.getItem(profileKey(user.uid));
    if (raw) return { ...defaultProfile(user), ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    // Ignore corrupted local data.
  }
  return defaultProfile(user);
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(profileKey(profile.uid), JSON.stringify(profile));
}

export function isUsernameAvailable(username: string, currentUid: string): boolean {
  // Temporary local check. Enforced uniquely in Firestore in Phase 5.
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('daymark:profile:v1:')) continue;
      const profile = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<UserProfile>;
      if (profile.username === username && profile.uid !== currentUid) return false;
    }
  } catch {
    // Ignore storage errors.
  }
  return username !== 'admin' && username !== 'u';
}
