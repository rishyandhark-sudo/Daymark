import { format, parseISO } from 'date-fns';

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(key: string): Date {
  return parseISO(key);
}

export function prettyDate(key: string): string {
  return format(parseDateKey(key), 'EEEE, MMMM d, yyyy');
}

export function shortDate(key: string): string {
  return format(parseDateKey(key), 'MMM d');
}

export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  if (hours === 0) return '0h';
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}
