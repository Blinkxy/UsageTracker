// ─── Database Row Types ───

export interface FocusEventRow {
  id: number;
  app_name: string;
  window_title: string;
  category: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  date: string;
}

// ─── API Response Types ───

export interface CategoryBreakdown {
  productive: number;
  communication: number;
  browsing: number;
  entertainment: number;
  other: number;
}

export interface SummaryResponse {
  date: string;
  totalSeconds: number;
  categories: CategoryBreakdown;
  productivityScore: number;
  currentApp: string | null;
  currentCategory: string | null;
}

export interface AppUsage {
  appName: string;
  displayName: string;
  category: string;
  totalSeconds: number;
  percentage: number;
  sessions: number;
}

export interface UsageResponse {
  date: string;
  apps: AppUsage[];
}

export interface HourlyData {
  hour: number;
  label: string;
  productive: number;
  communication: number;
  browsing: number;
  entertainment: number;
  other: number;
  total: number;
}

export interface TimelineResponse {
  date: string;
  hours: HourlyData[];
}

export interface DailyData {
  date: string;
  label: string;
  productive: number;
  communication: number;
  browsing: number;
  entertainment: number;
  other: number;
  total: number;
}

export type TimelineRange = "today" | "3d" | "1w" | "1m";

export interface RangeTimelineResponse {
  range: TimelineRange;
  days: DailyData[];
}

// ─── Component Props Types ───

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: "up" | "down" | "neutral";
}

export type Category =
  | "productive"
  | "communication"
  | "browsing"
  | "entertainment"
  | "other";

export const CATEGORY_COLORS: Record<Category, string> = {
  productive: "#22c55e",
  communication: "#3b82f6",
  browsing: "#f59e0b",
  entertainment: "#ef4444",
  other: "#6b7280",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  productive: "Productive",
  communication: "Communication",
  browsing: "Browsing",
  entertainment: "Entertainment",
  other: "Other",
};

// ─── User Settings ───

export interface UserSettings {
  // Alerts & Thresholds
  productivityScoreThreshold: number; // 0-100, alert if score drops below
  entertainmentTimeLimit: number; // seconds, daily max before warning
  perAppTimeLimits: Record<string, number>; // app name -> seconds

  // Goals
  dailyProductiveGoal: number; // seconds, target productive time
  dailyScreenTimeCap: number; // seconds, max total screen time

  // Productivity Rules
  productiveApps: string[]; // app names that count as productive
  workingHoursEnabled: boolean;
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23

  // Notifications
  browserNotifications: boolean;
  soundAlerts: boolean;
  notificationCooldown: number; // seconds between repeated alerts

  // Display
  refreshRate: number; // milliseconds
  defaultTimelineRange: TimelineRange;
}

export const DEFAULT_SETTINGS: UserSettings = {
  productivityScoreThreshold: 50,
  entertainmentTimeLimit: 3600, // 1 hour
  perAppTimeLimits: {},

  dailyProductiveGoal: 21600, // 6 hours
  dailyScreenTimeCap: 36000, // 10 hours

  productiveApps: ["brave", "brave-browser", "cursor"],
  workingHoursEnabled: false,
  workingHoursStart: 9,
  workingHoursEnd: 18,

  browserNotifications: true,
  soundAlerts: false,
  notificationCooldown: 900, // 15 minutes

  refreshRate: 5000,
  defaultTimelineRange: "today",
};
