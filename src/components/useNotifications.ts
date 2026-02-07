"use client";

import { useEffect, useRef } from "react";
import type { UserSettings, SummaryResponse, CategoryBreakdown } from "@/types";

/**
 * Hook that fires browser notifications based on settings and current data.
 * Respects cooldown to avoid spamming.
 */
export function useNotifications(
  settings: UserSettings,
  summary: SummaryResponse | null,
  categories: CategoryBreakdown
) {
  const lastNotified = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!settings.browserNotifications || !summary) return;
    if (typeof window === "undefined") return;

    // Request permission on first use
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission !== "granted") return;

    const now = Date.now();
    const cooldown = settings.notificationCooldown * 1000;

    const notify = (id: string, title: string, body: string) => {
      const last = lastNotified.current[id] || 0;
      if (now - last < cooldown) return;
      lastNotified.current[id] = now;

      new Notification(title, {
        body,
        icon: "/favicon.ico",
        silent: !settings.soundAlerts,
      });
    };

    // Productivity score alert
    if (
      summary.totalSeconds > 1800 &&
      summary.productivityScore < settings.productivityScoreThreshold
    ) {
      notify(
        "productivity-low",
        "Productivity Alert",
        `Your score is ${summary.productivityScore}% (below ${settings.productivityScoreThreshold}% target)`
      );
    }

    // Entertainment limit alert
    if (categories.entertainment > settings.entertainmentTimeLimit) {
      const mins = Math.round(categories.entertainment / 60);
      notify(
        "entertainment-limit",
        "Entertainment Limit Exceeded",
        `${mins} minutes of entertainment today`
      );
    }

    // Screen time cap alert
    if (summary.totalSeconds > settings.dailyScreenTimeCap) {
      notify(
        "screen-time-cap",
        "Screen Time Cap Reached",
        `You've exceeded your daily screen time limit`
      );
    }
  }, [settings, summary, categories]);
}
