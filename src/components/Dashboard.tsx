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
import { Button } from "./ui/button";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

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

  const cats = summary?.categories || {
    productive: 0,
    communication: 0,
    browsing: 0,
    entertainment: 0,
    other: 0,
  };

  // Fire browser notifications based on settings (must be before any early return)
  useNotifications(settings, summary, cats);

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
              <Button
                variant="default"
                size="icon"
                onClick={goToPreviousDay}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                onClick={goToToday}
                className="min-w-[120px]"
              >
                {formatDateDisplay(date)}
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={goToNextDay}
                disabled={isToday}
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="text-text-secondary hover:text-accent"
            >
              <Settings className="h-6 w-6" />
            </Button>
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
          icon={<Clock className="h-5 w-5" />}
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
          icon={<CheckCircle2 className="h-5 w-5" />}
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
          icon={<AlertTriangle className="h-5 w-5" />}
          glowClass="glow-red"
          accentColor="text-entertainment"
        />
        <StatCard
          title="Apps Used"
          value={`${usage?.apps?.length || 0}`}
          subtitle={isToday ? "today" : formatDateDisplay(date)}
          icon={<Monitor className="h-5 w-5" />}
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
