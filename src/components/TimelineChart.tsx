"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { HourlyData, DailyData, TimelineRange } from "@/types";
import { CATEGORY_COLORS } from "@/types";
import { formatDuration } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

interface TimelineChartProps {
  hours: HourlyData[];
  days: DailyData[];
  range: TimelineRange;
  onRangeChange: (range: TimelineRange) => void;
}

const RANGE_OPTIONS: { value: TimelineRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "3d", label: "3 Days" },
  { value: "1w", label: "Week" },
  { value: "1m", label: "Month" },
];

export default function TimelineChart({
  hours,
  days,
  range,
  onRangeChange,
}: TimelineChartProps) {
  const isDaily = range !== "today";

  const RangeSelector = () => (
    <Tabs value={range} onValueChange={(v) => onRangeChange(v as TimelineRange)}>
      <TabsList>
        {RANGE_OPTIONS.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value}>
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  // ── Empty state ──
  if (isDaily) {
    const hasData = days.length > 0 && days.some((d) => d.total > 0);
    if (!hasData) {
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Activity Timeline</CardTitle>
            <RangeSelector />
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48 text-text-muted text-sm">
            No activity recorded for this period.
          </CardContent>
        </Card>
      );
    }
  } else {
    const hasAnyData = hours.some((h) => h.total > 0);
    if (!hasAnyData) {
      return (
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Activity Timeline</CardTitle>
            <RangeSelector />
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48 text-text-muted text-sm">
            No activity recorded yet — timeline will appear as you use your
            computer.
          </CardContent>
        </Card>
      );
    }
  }

  // ── Tooltip ──
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const totalValue = payload.reduce((sum, p) => sum + p.value, 0);
      return (
        <div className="custom-tooltip">
          <p className="text-sm font-medium text-text-primary mb-2">{label}</p>
          {payload
            .filter((p) => p.value > 0)
            .reverse()
            .map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 text-xs mb-1"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-text-secondary capitalize">
                  {p.name}:
                </span>
                <span className="text-text-primary">
                  {isDaily
                    ? formatDuration(p.value)
                    : formatDuration(p.value * 60)}
                </span>
              </div>
            ))}
          <div className="border-t border-border mt-1.5 pt-1.5 text-xs text-text-muted">
            Total:{" "}
            {isDaily
              ? formatDuration(totalValue)
              : formatDuration(totalValue * 60)}
          </div>
        </div>
      );
    }
    return null;
  };

  // ── Daily (multi-day) view ──
  if (isDaily) {
    const formatYAxis = (value: number) => {
      if (value >= 3600) return `${Math.round(value / 3600)}h`;
      if (value >= 60) return `${Math.round(value / 60)}m`;
      return `${value}s`;
    };

    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Activity Timeline</CardTitle>
          <RangeSelector />
        </CardHeader>

        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={days}
                margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradDailyProductive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CATEGORY_COLORS.productive} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.productive} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradDailyCommunication" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CATEGORY_COLORS.communication} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.communication} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradDailyBrowsing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CATEGORY_COLORS.browsing} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.browsing} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradDailyEntertainment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CATEGORY_COLORS.entertainment} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.entertainment} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradDailyOther" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CATEGORY_COLORS.other} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CATEGORY_COLORS.other} stopOpacity={0.03} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(38,38,64,0.5)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="other" stackId="1" stroke={CATEGORY_COLORS.other} fill="url(#gradDailyOther)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="entertainment" stackId="1" stroke={CATEGORY_COLORS.entertainment} fill="url(#gradDailyEntertainment)" strokeWidth={2} filter="url(#glow)" />
                <Area type="monotone" dataKey="browsing" stackId="1" stroke={CATEGORY_COLORS.browsing} fill="url(#gradDailyBrowsing)" strokeWidth={2} filter="url(#glow)" />
                <Area type="monotone" dataKey="communication" stackId="1" stroke={CATEGORY_COLORS.communication} fill="url(#gradDailyCommunication)" strokeWidth={2} filter="url(#glow)" />
                <Area type="monotone" dataKey="productive" stackId="1" stroke={CATEGORY_COLORS.productive} fill="url(#gradDailyProductive)" strokeWidth={2} filter="url(#glow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Hourly (today) view ──
  // Find the range of hours to display: from earliest active hour (or 6 AM)
  // up to the current hour, whichever spans wider
  const currentHour = new Date().getHours();
  const hoursWithData = hours.filter((h) => h.total > 0);
  const firstActiveHour = hoursWithData.length > 0
    ? Math.min(...hoursWithData.map((h) => h.hour))
    : 6;
  const lastActiveHour = hoursWithData.length > 0
    ? Math.max(...hoursWithData.map((h) => h.hour))
    : currentHour;
  const rangeStart = Math.min(firstActiveHour, 6);
  const rangeEnd = Math.max(lastActiveHour, currentHour) + 1;

  const activeHours = hours.filter(
    (h) => h.hour >= rangeStart && h.hour <= rangeEnd
  );

  const chartData = activeHours.map((h) => ({
    ...h,
    productive: Math.round(h.productive / 60),
    communication: Math.round(h.communication / 60),
    browsing: Math.round(h.browsing / 60),
    entertainment: Math.round(h.entertainment / 60),
    other: Math.round(h.other / 60),
  }));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Activity Timeline</CardTitle>
        <RangeSelector />
      </CardHeader>

      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradProductive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORY_COLORS.productive} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS.productive} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradCommunication" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORY_COLORS.communication} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS.communication} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradBrowsing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORY_COLORS.browsing} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS.browsing} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradEntertainment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORY_COLORS.entertainment} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS.entertainment} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORY_COLORS.other} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS.other} stopOpacity={0.03} />
                </linearGradient>
                <filter id="glowToday">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(38,38,64,0.5)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="other" stackId="1" stroke={CATEGORY_COLORS.other} fill="url(#gradOther)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="entertainment" stackId="1" stroke={CATEGORY_COLORS.entertainment} fill="url(#gradEntertainment)" strokeWidth={2} filter="url(#glowToday)" />
              <Area type="monotone" dataKey="browsing" stackId="1" stroke={CATEGORY_COLORS.browsing} fill="url(#gradBrowsing)" strokeWidth={2} filter="url(#glowToday)" />
              <Area type="monotone" dataKey="communication" stackId="1" stroke={CATEGORY_COLORS.communication} fill="url(#gradCommunication)" strokeWidth={2} filter="url(#glowToday)" />
              <Area type="monotone" dataKey="productive" stackId="1" stroke={CATEGORY_COLORS.productive} fill="url(#gradProductive)" strokeWidth={2} filter="url(#glowToday)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
