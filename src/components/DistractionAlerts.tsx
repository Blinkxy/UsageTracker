"use client";

import type { AppUsage, CategoryBreakdown, Category, UserSettings } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { formatDuration } from "@/lib/utils";

interface DistractionAlertsProps {
  apps: AppUsage[];
  categories: CategoryBreakdown;
  currentApp: string | null;
  currentCategory: string | null;
  productivityScore: number;
  totalSeconds: number;
  settings: UserSettings;
}

interface Alert {
  type: "warning" | "danger" | "info" | "success";
  message: string;
  detail?: string;
  color: string;
  icon: string;
}

export default function DistractionAlerts({
  apps,
  categories,
  currentApp,
  currentCategory,
  productivityScore,
  totalSeconds,
  settings,
}: DistractionAlertsProps) {
  const alerts: Alert[] = [];

  // ── Productivity score threshold alert ──
  if (
    totalSeconds > 1800 &&
    productivityScore < settings.productivityScoreThreshold
  ) {
    alerts.push({
      type: "danger",
      message: `Productivity at ${productivityScore}% (below ${settings.productivityScoreThreshold}% target)`,
      detail:
        "Your productivity score has dropped below your threshold. Try switching to a productive app.",
      color: CATEGORY_COLORS.entertainment,
      icon: "🚨",
    });
  }

  // ── Entertainment time alerts (using configurable limit) ──
  const entertainmentSeconds = categories.entertainment;
  const limit = settings.entertainmentTimeLimit;

  if (entertainmentSeconds > limit * 2) {
    alerts.push({
      type: "danger",
      message: `Over ${formatDuration(entertainmentSeconds)} on entertainment today!`,
      detail: `You've exceeded double your ${formatDuration(limit)} daily limit.`,
      color: CATEGORY_COLORS.entertainment,
      icon: "🚨",
    });
  } else if (entertainmentSeconds > limit) {
    alerts.push({
      type: "warning",
      message: `${formatDuration(entertainmentSeconds)} spent on entertainment.`,
      detail: `You've exceeded your ${formatDuration(limit)} daily limit.`,
      color: CATEGORY_COLORS.entertainment,
      icon: "⚠️",
    });
  } else if (entertainmentSeconds > limit * 0.7) {
    alerts.push({
      type: "info",
      message: `${formatDuration(entertainmentSeconds)} on entertainment so far.`,
      detail: `Approaching your ${formatDuration(limit)} daily limit.`,
      color: CATEGORY_COLORS.browsing,
      icon: "⏱️",
    });
  }

  // ── Screen time cap alert ──
  if (totalSeconds > settings.dailyScreenTimeCap) {
    alerts.push({
      type: "warning",
      message: `Screen time: ${formatDuration(totalSeconds)}`,
      detail: `You've exceeded your ${formatDuration(settings.dailyScreenTimeCap)} daily cap.`,
      color: CATEGORY_COLORS.browsing,
      icon: "🖥️",
    });
  } else if (totalSeconds > settings.dailyScreenTimeCap * 0.85) {
    alerts.push({
      type: "info",
      message: `Screen time: ${formatDuration(totalSeconds)}`,
      detail: `Approaching your ${formatDuration(settings.dailyScreenTimeCap)} daily cap.`,
      color: CATEGORY_COLORS.other,
      icon: "🖥️",
    });
  }

  // ── Daily productive goal progress ──
  const productiveTime =
    categories.productive + categories.communication * 0.5;
  if (productiveTime >= settings.dailyProductiveGoal) {
    alerts.push({
      type: "success",
      message: "Daily productive goal reached!",
      detail: `${formatDuration(categories.productive)} productive — you hit your ${formatDuration(settings.dailyProductiveGoal)} goal.`,
      color: CATEGORY_COLORS.productive,
      icon: "🎯",
    });
  }

  // ── Per-app time limit alerts ──
  for (const [appName, maxSeconds] of Object.entries(
    settings.perAppTimeLimits
  )) {
    const app = apps.find(
      (a) => a.appName.toLowerCase() === appName.toLowerCase()
    );
    if (app && app.totalSeconds > maxSeconds) {
      alerts.push({
        type: "warning",
        message: `${app.displayName}: ${formatDuration(app.totalSeconds)}`,
        detail: `Exceeded your ${formatDuration(maxSeconds)} limit for ${app.displayName}.`,
        color: CATEGORY_COLORS[app.category as Category] || CATEGORY_COLORS.other,
        icon: "⏰",
      });
    }
  }

  // ── Currently on entertainment alert ──
  if (currentCategory === "entertainment" && currentApp) {
    alerts.push({
      type: "info",
      message: `Currently on: ${currentApp}`,
      detail:
        "You're currently using an entertainment app. Stay aware of your time!",
      color: CATEGORY_COLORS.entertainment,
      icon: "👀",
    });
  }

  // ── Productive streak alert ──
  const productivePercent =
    categories.productive /
    (Object.values(categories).reduce((a, b) => a + b, 0) || 1);

  if (productivePercent > 0.7 && categories.productive > 3600) {
    alerts.push({
      type: "success",
      message: "Great productivity streak!",
      detail: `${formatDuration(categories.productive)} of productive work. Keep it up!`,
      color: CATEGORY_COLORS.productive,
      icon: "🔥",
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="card h-full">
        <h3 className="text-text-secondary text-sm font-medium mb-4">
          Alerts & Insights
        </h3>
        <div className="flex items-center justify-center h-32 text-text-muted text-sm">
          No alerts — you&apos;re doing great!
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <h3 className="text-text-secondary text-sm font-medium mb-4">
        Alerts & Insights
      </h3>
      <div className="space-y-2.5">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
            style={{
              borderColor: `${alert.color}30`,
              background: `linear-gradient(135deg, ${alert.color}08, ${alert.color}03)`,
              boxShadow: `0 2px 12px ${alert.color}08, inset 0 1px 0 rgba(255,255,255,0.02)`,
            }}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{alert.icon}</span>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{ color: alert.color }}
              >
                {alert.message}
              </p>
              {alert.detail && (
                <p className="text-xs text-text-muted mt-0.5">
                  {alert.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
