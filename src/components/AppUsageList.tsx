"use client";

import type { AppUsage, Category } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import { formatDuration, getCategoryBadgeClass } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface AppUsageListProps {
  apps: AppUsage[];
}

export default function AppUsageList({ apps }: AppUsageListProps) {
  if (apps.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>All Applications Used Today</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-text-muted text-sm">
          No applications tracked yet today.
        </CardContent>
      </Card>
    );
  }

  const maxSeconds = apps[0]?.totalSeconds || 1;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>All Applications Used Today</CardTitle>
        <span className="text-text-muted text-xs">
          {apps.length} app{apps.length !== 1 ? "s" : ""}
        </span>
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_80px_60px_80px] gap-2 px-3 py-2 text-xs text-text-muted font-medium">
            <span>Application</span>
            <span className="text-right">Time</span>
            <span className="text-right">Share</span>
            <span className="text-center">Sessions</span>
            <span className="text-center">Category</span>
          </div>

          {/* Rows */}
          {apps.map((app, index) => {
            const barWidth = (app.totalSeconds / maxSeconds) * 100;
            const color =
              CATEGORY_COLORS[app.category as Category] || CATEGORY_COLORS.other;

            return (
              <div
                key={`${app.appName}-${index}`}
                className="group relative grid grid-cols-[1fr_100px_80px_60px_80px] gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-hover transition-colors items-center"
              >
                {/* Background progress bar with gradient fade */}
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${color}15, ${color}08, transparent)`,
                  }}
                />

                {/* App name */}
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-text-muted text-xs w-5 text-right">
                    {index + 1}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 6px ${color}50`,
                    }}
                  />
                  <span className="text-sm font-medium text-text-primary truncate">
                    {app.displayName}
                  </span>
                </div>

                {/* Time */}
                <span className="text-sm text-text-primary text-right relative z-10 font-mono">
                  {formatDuration(app.totalSeconds)}
                </span>

                {/* Percentage */}
                <span className="text-sm text-text-secondary text-right relative z-10">
                  {app.percentage.toFixed(1)}%
                </span>

                {/* Sessions */}
                <span className="text-sm text-text-muted text-center relative z-10">
                  {app.sessions}
                </span>

                {/* Category badge */}
                <div className="flex justify-center relative z-10">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getCategoryBadgeClass(
                      app.category
                    )}`}
                  >
                    {CATEGORY_LABELS[app.category as Category] || "Other"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
