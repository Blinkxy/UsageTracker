"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SummaryResponse,
  UsageResponse,
  TimelineResponse,
  DailyData,
  TimelineRange,
} from "@/types";
import { formatDuration, formatDurationPrecise } from "@/lib/utils";
import { useSettings } from "./SettingsContext";
import StatCard from "./StatCard";
import ProductivityScore from "./ProductivityScore";
import CategoryChart from "./CategoryChart";
import TopAppsChart from "./TopAppsChart";
import TimelineChart from "./TimelineChart";
import AppUsageList from "./AppUsageList";
import DistractionAlerts from "./DistractionAlerts";
import SettingsModal from "./SettingsModal";
import { useNotifications } from "./useNotifications";

// Icons as inline SVG components
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const MonitorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const todayStr = getDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const { settings, isLoaded } = useSettings();
  const [date, setDate] = useState<string>(getDateString(new Date()));
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [timelineRange, setTimelineRange] = useState<TimelineRange | null>(
    null
  );
  const [timelineDays, setTimelineDays] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Set default timeline range from settings once loaded
  useEffect(() => {
    if (isLoaded && timelineRange === null) {
      setTimelineRange(settings.defaultTimelineRange);
    }
  }, [isLoaded, settings.defaultTimelineRange, timelineRange]);

  const isToday = date === getDateString(new Date());
  const activeRange = timelineRange || "today";

  const fetchData = useCallback(async () => {
    try {
      const timelineUrl =
        activeRange === "today"
          ? `/api/timeline?date=${date}&range=today`
          : `/api/timeline?range=${activeRange}`;

      const [summaryRes, usageRes, timelineRes] = await Promise.all([
        fetch(`/api/summary?date=${date}`),
        fetch(`/api/usage?date=${date}`),
        fetch(timelineUrl),
      ]);

      const [summaryData, usageData, timelineData] = await Promise.all([
        summaryRes.json(),
        usageRes.json(),
        timelineRes.json(),
      ]);

      setSummary(summaryData);
      setUsage(usageData);

      if (activeRange === "today") {
        setTimeline(timelineData);
        setTimelineDays([]);
      } else {
        setTimeline(null);
        setTimelineDays(timelineData.days || []);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [date, activeRange]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();

    // Auto-refresh only for today, using configurable rate
    if (isToday) {
      const interval = setInterval(fetchData, settings.refreshRate);
      return () => clearInterval(interval);
    }
  }, [fetchData, isToday, settings.refreshRate]);

  const goToPreviousDay = () => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setDate(getDateString(d));
  };

  const goToNextDay = () => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + 1);
    const today = getDateString(new Date());
    const next = getDateString(d);
    if (next <= today) {
      setDate(next);
    }
  };

  const goToToday = () => {
    setDate(getDateString(new Date()));
  };

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const cats = summary?.categories || {
    productive: 0,
    communication: 0,
    browsing: 0,
    entertainment: 0,
    other: 0,
  };

  // Fire browser notifications based on settings
  useNotifications(settings, summary, cats);

  return (
    <div className="min-h-screen" style={{ padding: "2rem 6vw" }}>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-accent to-productive bg-clip-text text-transparent">
                Usage Tracker
              </span>
              {isToday && (
                <span className="flex items-center gap-1.5 text-xs font-normal text-productive">
                  <span className="w-2 h-2 bg-productive rounded-full animate-pulse-dot" />
                  Live
                </span>
              )}
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Monitor your productivity and stay focused.
            </p>
          </div>

          {/* Date navigation + Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 rounded-lg bg-surface border border-border hover:border-border-light transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeftIcon />
              </button>

              <button
                onClick={goToToday}
                className="px-4 py-2 rounded-lg bg-surface border border-border hover:border-border-light transition-colors text-sm font-medium min-w-[120px] text-center"
              >
                {formatDateDisplay(date)}
              </button>

              <button
                onClick={goToNextDay}
                disabled={isToday}
                className="p-2 rounded-lg bg-surface border border-border hover:border-border-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next day"
              >
                <ChevronRightIcon />
              </button>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-lg border transition-all hover:scale-105"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,26,46,0.8), rgba(18,18,26,0.9))",
                borderColor: "var(--color-border)",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>

        {/* Last updated */}
        {isToday && (
          <div className="text-text-muted text-xs mt-3">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {summary?.currentApp && (
              <span className="ml-3 text-text-secondary">
                Currently focused:{" "}
                <span className="text-text-primary font-medium">
                  {summary.currentApp}
                </span>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Stat cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        style={{ marginBottom: "3.5rem" }}
      >
        <StatCard
          title="Total Screen Time"
          value={formatDuration(summary?.totalSeconds || 0)}
          subtitle={formatDurationPrecise(summary?.totalSeconds || 0)}
          icon={<ClockIcon />}
          glowClass="glow-purple"
          accentColor="text-accent"
        />
        <StatCard
          title="Productive Time"
          value={formatDuration(cats.productive)}
          subtitle={`${
            summary?.totalSeconds
              ? Math.round((cats.productive / summary.totalSeconds) * 100)
              : 0
          }% of total`}
          icon={<CheckIcon />}
          glowClass="glow-green"
          accentColor="text-productive"
        />
        <StatCard
          title="Entertainment Time"
          value={formatDuration(cats.entertainment)}
          subtitle={`${
            summary?.totalSeconds
              ? Math.round((cats.entertainment / summary.totalSeconds) * 100)
              : 0
          }% of total`}
          icon={<AlertIcon />}
          glowClass="glow-red"
          accentColor="text-entertainment"
        />
        <StatCard
          title="Apps Used"
          value={`${usage?.apps?.length || 0}`}
          subtitle={isToday ? "today" : formatDateDisplay(date)}
          icon={<MonitorIcon />}
          glowClass="glow-blue"
          accentColor="text-communication"
        />
      </div>

      {/* Main grid: Score + Category + Top Apps */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        style={{ marginBottom: "3.5rem" }}
      >
        <div className="lg:col-span-3">
          <ProductivityScore score={summary?.productivityScore || 0} />
        </div>
        <div className="lg:col-span-4">
          <CategoryChart categories={cats} />
        </div>
        <div className="lg:col-span-5">
          <TopAppsChart apps={usage?.apps || []} />
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: "3.5rem" }}>
        <TimelineChart
          hours={timeline?.hours || []}
          days={timelineDays}
          range={activeRange}
          onRangeChange={setTimelineRange}
        />
      </div>

      {/* Alerts + App list */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ marginBottom: "3.5rem" }}
      >
        <div className="lg:col-span-1">
          <DistractionAlerts
            apps={usage?.apps || []}
            categories={cats}
            currentApp={summary?.currentApp || null}
            currentCategory={summary?.currentCategory || null}
            productivityScore={summary?.productivityScore || 0}
            totalSeconds={summary?.totalSeconds || 0}
            settings={settings}
          />
        </div>
        <div className="lg:col-span-2">
          <AppUsageList apps={usage?.apps || []} />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-text-muted text-xs py-4 border-t border-border">
        Usage Tracker — Productivity monitoring for Linux
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
