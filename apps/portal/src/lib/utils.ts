import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy · HH:mm:ss");
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

export function maskToken(token: string): string {
  if (token.length < 12) return "••••••••";
  return token.slice(0, 8) + "••••••••" + token.slice(-4);
}

export function agentStatusColor(status: string): string {
  const map: Record<string, string> = {
    active:    "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40",
    suspended: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40",
    pending:   "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40",
    revoked:   "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40",
  };
  return map[status] ?? "text-gray-600 bg-gray-50";
}

export function actionResultColor(result: string): string {
  const map: Record<string, string> = {
    success:          "text-emerald-600 dark:text-emerald-400",
    failure:          "text-red-600 dark:text-red-400",
    blocked:          "text-orange-600 dark:text-orange-400",
    pending_approval: "text-amber-600 dark:text-amber-400",
  };
  return map[result] ?? "text-gray-600";
}

export function generateId(prefix = "drift"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}
