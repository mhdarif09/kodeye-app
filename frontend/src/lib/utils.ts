import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale/id";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCategory(cat: string) {
  return cat?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ?? "-";
}

export function formatDuration(start: string, end?: string) {
  if (end) {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }
  // single numeric argument — seconds
  const secs = Number(start);
  const mn = Math.floor(secs / 60);
  const sc = secs % 60;
  return `${mn}:${sc.toString().padStart(2, "0")}`;
}

export function relativeDate(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: id });
  } catch {
    return new Date(iso).toLocaleDateString("id-ID");
  }
}
