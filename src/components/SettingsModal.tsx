"use client";

import { useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";
import type { TimelineRange } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ───

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
      {children}
    </h3>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary">{label}</div>
        {description && (
          <div className="text-xs text-text-muted mt-0.5">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all duration-200"
      style={{
        background: checked
          ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
          : "rgba(38, 38, 64, 0.8)",
        boxShadow: checked
          ? "0 0 12px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "inset 0 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          left: checked ? "22px" : "2px",
          background: "linear-gradient(180deg, #fff, #e4e4e7)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
  formatLabel,
}: {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  formatLabel?: (val: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-accent font-mono min-w-[50px] text-right">
        {formatLabel ? formatLabel(value) : value}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-accent"
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface-hover text-text-primary focus:outline-none focus:border-accent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── Main Component ───

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [productiveAppsInput, setProductiveAppsInput] = useState("");

  useEffect(() => {
    setProductiveAppsInput(settings.productiveApps.join(", "));
  }, [settings.productiveApps]);

  if (!isOpen) return null;

  const handleProductiveAppsBlur = () => {
    const apps = productiveAppsInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    updateSettings({ productiveApps: apps });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(145deg, rgba(18,18,26,0.98), rgba(26,26,46,0.95))",
          border: "1px solid var(--color-border)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border"
          style={{
            background: "linear-gradient(145deg, rgba(18,18,26,0.98), rgba(26,26,46,0.95))",
          }}
        >
          <h2 className="text-lg font-bold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text-primary"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-8">
          {/* ── Alerts & Thresholds ── */}
          <section>
            <SectionTitle>Alerts &amp; Thresholds</SectionTitle>
            <div className="space-y-1 divide-y divide-border/50">
              <SettingRow
                label="Productivity score alert"
                description="Warn when your score drops below this level"
              >
                <SliderInput
                  value={settings.productivityScoreThreshold}
                  onChange={(v) =>
                    updateSettings({ productivityScoreThreshold: v })
                  }
                  min={10}
                  max={90}
                  step={5}
                  formatLabel={(v) => `${v}%`}
                />
              </SettingRow>

              <SettingRow
                label="Entertainment time limit"
                description="Daily max before you get a warning"
              >
                <SliderInput
                  value={settings.entertainmentTimeLimit}
                  onChange={(v) =>
                    updateSettings({ entertainmentTimeLimit: v })
                  }
                  min={900}
                  max={14400}
                  step={900}
                  formatLabel={formatTime}
                />
              </SettingRow>
            </div>
          </section>

          {/* ── Goals ── */}
          <section>
            <SectionTitle>Daily Goals</SectionTitle>
            <div className="space-y-1 divide-y divide-border/50">
              <SettingRow
                label="Productive time goal"
                description="Target hours of productive work per day"
              >
                <SliderInput
                  value={settings.dailyProductiveGoal}
                  onChange={(v) =>
                    updateSettings({ dailyProductiveGoal: v })
                  }
                  min={3600}
                  max={43200}
                  step={1800}
                  formatLabel={formatTime}
                />
              </SettingRow>

              <SettingRow
                label="Screen time cap"
                description="Max total screen time per day"
              >
                <SliderInput
                  value={settings.dailyScreenTimeCap}
                  onChange={(v) =>
                    updateSettings({ dailyScreenTimeCap: v })
                  }
                  min={7200}
                  max={57600}
                  step={1800}
                  formatLabel={formatTime}
                />
              </SettingRow>
            </div>
          </section>

          {/* ── Productivity Rules ── */}
          <section>
            <SectionTitle>Productivity Rules</SectionTitle>
            <div className="space-y-1 divide-y divide-border/50">
              <div className="py-3">
                <div className="text-sm text-text-primary mb-1">
                  Productive apps
                </div>
                <div className="text-xs text-text-muted mb-2">
                  Comma-separated app names that count toward your productivity
                  score
                </div>
                <input
                  type="text"
                  value={productiveAppsInput}
                  onChange={(e) => setProductiveAppsInput(e.target.value)}
                  onBlur={handleProductiveAppsBlur}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-surface-hover text-text-primary focus:outline-none focus:border-accent placeholder:text-text-muted"
                  placeholder="brave, brave-browser, cursor"
                />
              </div>

              <SettingRow
                label="Working hours"
                description="Only count activity within these hours for scoring"
              >
                <Toggle
                  checked={settings.workingHoursEnabled}
                  onChange={(v) =>
                    updateSettings({ workingHoursEnabled: v })
                  }
                />
              </SettingRow>

              {settings.workingHoursEnabled && (
                <SettingRow label="Hours range">
                  <div className="flex items-center gap-2 text-sm">
                    <SelectInput
                      value={String(settings.workingHoursStart)}
                      onChange={(v) =>
                        updateSettings({ workingHoursStart: Number(v) })
                      }
                      options={Array.from({ length: 24 }, (_, i) => ({
                        value: String(i),
                        label: `${i === 0 ? "12" : i > 12 ? String(i - 12) : String(i)} ${i < 12 ? "AM" : "PM"}`,
                      }))}
                    />
                    <span className="text-text-muted">to</span>
                    <SelectInput
                      value={String(settings.workingHoursEnd)}
                      onChange={(v) =>
                        updateSettings({ workingHoursEnd: Number(v) })
                      }
                      options={Array.from({ length: 24 }, (_, i) => ({
                        value: String(i),
                        label: `${i === 0 ? "12" : i > 12 ? String(i - 12) : String(i)} ${i < 12 ? "AM" : "PM"}`,
                      }))}
                    />
                  </div>
                </SettingRow>
              )}
            </div>
          </section>

          {/* ── Notifications ── */}
          <section>
            <SectionTitle>Notifications</SectionTitle>
            <div className="space-y-1 divide-y divide-border/50">
              <SettingRow
                label="Browser notifications"
                description="Show desktop notifications for alerts"
              >
                <Toggle
                  checked={settings.browserNotifications}
                  onChange={(v) =>
                    updateSettings({ browserNotifications: v })
                  }
                />
              </SettingRow>

              <SettingRow
                label="Sound alerts"
                description="Play a sound when critical alerts fire"
              >
                <Toggle
                  checked={settings.soundAlerts}
                  onChange={(v) => updateSettings({ soundAlerts: v })}
                />
              </SettingRow>

              <SettingRow
                label="Notification cooldown"
                description="Minimum time between repeated alerts"
              >
                <SliderInput
                  value={settings.notificationCooldown}
                  onChange={(v) =>
                    updateSettings({ notificationCooldown: v })
                  }
                  min={300}
                  max={3600}
                  step={300}
                  formatLabel={formatTime}
                />
              </SettingRow>
            </div>
          </section>

          {/* ── Display ── */}
          <section>
            <SectionTitle>Display Preferences</SectionTitle>
            <div className="space-y-1 divide-y divide-border/50">
              <SettingRow
                label="Dashboard refresh rate"
                description="How often the dashboard fetches new data"
              >
                <SelectInput
                  value={String(settings.refreshRate)}
                  onChange={(v) =>
                    updateSettings({ refreshRate: Number(v) })
                  }
                  options={[
                    { value: "3000", label: "3 seconds" },
                    { value: "5000", label: "5 seconds" },
                    { value: "10000", label: "10 seconds" },
                    { value: "30000", label: "30 seconds" },
                    { value: "60000", label: "1 minute" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                label="Default timeline range"
                description="Which range to show when the dashboard loads"
              >
                <SelectInput
                  value={settings.defaultTimelineRange}
                  onChange={(v) =>
                    updateSettings({
                      defaultTimelineRange: v as TimelineRange,
                    })
                  }
                  options={[
                    { value: "today", label: "Today" },
                    { value: "3d", label: "Last 3 Days" },
                    { value: "1w", label: "Last Week" },
                    { value: "1m", label: "Last Month" },
                  ]}
                />
              </SettingRow>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
