import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { addDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getProximityColor = (dateStr: string) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateStr < todayStr) return "text-overdue border-overdue/30 bg-overdue/5";
  if (dateStr === todayStr || dateStr <= addDays(new Date(), 3).toISOString().split('T')[0]) return "text-urgent border-urgent/30 bg-urgent/5";
  return "text-upcoming border-upcoming/30 bg-upcoming/5";
};
