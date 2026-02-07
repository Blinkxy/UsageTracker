"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AppUsage, Category } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { formatDuration } from "@/lib/utils";

interface TopAppsChartProps {
  apps: AppUsage[];
}

export default function TopAppsChart({ apps }: TopAppsChartProps) {
  // Show top 8 apps
  const topApps = apps.slice(0, 8).map((app) => ({
    name: app.displayName,
    seconds: app.totalSeconds,
    color: CATEGORY_COLORS[app.category as Category] || CATEGORY_COLORS.other,
    category: app.category,
  }));

  if (topApps.length === 0) {
    return (
      <div className="card h-full">
        <h3 className="text-text-secondary text-sm font-medium mb-4">
          Top Applications
        </h3>
        <div className="flex items-center justify-center h-48 text-text-muted text-sm">
          No data yet — start the tracker to see your top apps.
        </div>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: { name: string; seconds: number; color: string; category: string };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="text-sm font-medium" style={{ color: item.color }}>
            {item.name}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            {formatDuration(item.seconds)}
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 3600) return `${Math.floor(value / 3600)}h`;
    if (value >= 60) return `${Math.floor(value / 60)}m`;
    return `${value}s`;
  };

  return (
    <div className="card h-full">
      <h3 className="text-text-secondary text-sm font-medium mb-4">
        Top Applications
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topApps}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={20}
          >
            <XAxis
              type="number"
              tickFormatter={formatYAxis}
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <defs>
              {topApps.map((entry, index) => (
                <linearGradient
                  key={`barGrad-${index}`}
                  id={`barGrad-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.9} />
                </linearGradient>
              ))}
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Bar dataKey="seconds" radius={[0, 6, 6, 0]} filter="url(#barGlow)">
              {topApps.map((entry, index) => (
                <Cell key={index} fill={`url(#barGrad-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
