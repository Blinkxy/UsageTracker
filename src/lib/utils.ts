import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a duration in seconds to a human-readable string.
 * Examples: "2h 15m", "45m 30s", "30s"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format a duration in seconds to a precise string.
 * Example: "02:15:30" (HH:MM:SS)
 */
export function formatDurationPrecise(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculate productivity score (0–100).
 * Based on time spent in productive apps (Brave + Cursor) vs total tracked time.
 * Only Brave and Cursor contribute to productivity; everything else is non-productive.
 */
export function calculateProductivityScore(
  productiveSeconds: number,
  totalSeconds: number
): number {
  if (totalSeconds === 0) return 0;
  return Math.round((productiveSeconds / totalSeconds) * 100);
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get the hour label (e.g., "9 AM", "2 PM").
 */
export function getHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get a productivity level label based on score.
 */
export function getProductivityLevel(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 80) return { label: "Excellent", color: "#22c55e", emoji: "🔥" };
  if (score >= 60) return { label: "Good", color: "#84cc16", emoji: "👍" };
  if (score >= 40) return { label: "Fair", color: "#f59e0b", emoji: "⚡" };
  if (score >= 20) return { label: "Low", color: "#f97316", emoji: "⚠️" };
  return { label: "Critical", color: "#ef4444", emoji: "🚨" };
}

/**
 * Get a CSS class for the category badge.
 */
export function getCategoryBadgeClass(category: string): string {
  const classes: Record<string, string> = {
    productive: "bg-green-500/20 text-green-400 border-green-500/30",
    communication: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    browsing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    entertainment: "bg-red-500/20 text-red-400 border-red-500/30",
    other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return classes[category] || classes.other;
}
