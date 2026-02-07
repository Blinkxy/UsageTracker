"use client";

import { useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";
import type { TimelineRange } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

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

// ─── Main Component ───

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [productiveAppsInput, setProductiveAppsInput] = useState("");

  useEffect(() => {
    setProductiveAppsInput(settings.productiveApps.join(", "));
  }, [settings.productiveApps]);

  const handleProductiveAppsBlur = () => {
    const apps = productiveAppsInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    updateSettings({ productiveApps: apps });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-8">
          {/* ── Alerts & Thresholds ── */}
          <section>
            <SectionTitle>Alerts &amp; Thresholds</SectionTitle>
            <div className="space-y-1 divide-y divide-border/50">
              <SettingRow
                label="Productivity score alert"
                description="Warn when your score drops below this level"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-accent font-mono min-w-[50px] text-right">
                    {settings.productivityScoreThreshold}%
                  </span>
                  <Slider
                    value={[settings.productivityScoreThreshold]}
                    onValueChange={([v]) =>
                      updateSettings({ productivityScoreThreshold: v })
                    }
                    min={10}
                    max={90}
                    step={5}
                    className="w-32"
                  />
                </div>
              </SettingRow>

              <SettingRow
                label="Entertainment time limit"
                description="Daily max before you get a warning"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-accent font-mono min-w-[50px] text-right">
                    {formatTime(settings.entertainmentTimeLimit)}
                  </span>
                  <Slider
                    value={[settings.entertainmentTimeLimit]}
                    onValueChange={([v]) =>
                      updateSettings({ entertainmentTimeLimit: v })
                    }
                    min={900}
                    max={14400}
                    step={900}
                    className="w-32"
                  />
                </div>
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
                <div className="flex items-center gap-3">
                  <span className="text-xs text-accent font-mono min-w-[50px] text-right">
                    {formatTime(settings.dailyProductiveGoal)}
                  </span>
                  <Slider
                    value={[settings.dailyProductiveGoal]}
                    onValueChange={([v]) =>
                      updateSettings({ dailyProductiveGoal: v })
                    }
                    min={3600}
                    max={43200}
                    step={1800}
                    className="w-32"
                  />
                </div>
              </SettingRow>

              <SettingRow
                label="Screen time cap"
                description="Max total screen time per day"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-accent font-mono min-w-[50px] text-right">
                    {formatTime(settings.dailyScreenTimeCap)}
                  </span>
                  <Slider
                    value={[settings.dailyScreenTimeCap]}
                    onValueChange={([v]) =>
                      updateSettings({ dailyScreenTimeCap: v })
                    }
                    min={7200}
                    max={57600}
                    step={1800}
                    className="w-32"
                  />
                </div>
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
                <Switch
                  checked={settings.workingHoursEnabled}
                  onCheckedChange={(v) =>
                    updateSettings({ workingHoursEnabled: v })
                  }
                />
              </SettingRow>

              {settings.workingHoursEnabled && (
                <SettingRow label="Hours range">
                  <div className="flex items-center gap-2 text-sm">
                    <Select
                      value={String(settings.workingHoursStart)}
                      onValueChange={(v) =>
                        updateSettings({ workingHoursStart: Number(v) })
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i === 0
                              ? "12"
                              : i > 12
                                ? String(i - 12)
                                : String(i)}{" "}
                            {i < 12 ? "AM" : "PM"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-text-muted">to</span>
                    <Select
                      value={String(settings.workingHoursEnd)}
                      onValueChange={(v) =>
                        updateSettings({ workingHoursEnd: Number(v) })
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i === 0
                              ? "12"
                              : i > 12
                                ? String(i - 12)
                                : String(i)}{" "}
                            {i < 12 ? "AM" : "PM"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <Switch
                  checked={settings.browserNotifications}
                  onCheckedChange={(v) =>
                    updateSettings({ browserNotifications: v })
                  }
                />
              </SettingRow>

              <SettingRow
                label="Sound alerts"
                description="Play a sound when critical alerts fire"
              >
                <Switch
                  checked={settings.soundAlerts}
                  onCheckedChange={(v) => updateSettings({ soundAlerts: v })}
                />
              </SettingRow>

              <SettingRow
                label="Notification cooldown"
                description="Minimum time between repeated alerts"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-accent font-mono min-w-[50px] text-right">
                    {formatTime(settings.notificationCooldown)}
                  </span>
                  <Slider
                    value={[settings.notificationCooldown]}
                    onValueChange={([v]) =>
                      updateSettings({ notificationCooldown: v })
                    }
                    min={300}
                    max={3600}
                    step={300}
                    className="w-32"
                  />
                </div>
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
                <Select
                  value={String(settings.refreshRate)}
                  onValueChange={(v) =>
                    updateSettings({ refreshRate: Number(v) })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3000">3 seconds</SelectItem>
                    <SelectItem value="5000">5 seconds</SelectItem>
                    <SelectItem value="10000">10 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label="Default timeline range"
                description="Which range to show when the dashboard loads"
              >
                <Select
                  value={settings.defaultTimelineRange}
                  onValueChange={(v) =>
                    updateSettings({
                      defaultTimelineRange: v as TimelineRange,
                    })
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="3d">Last 3 Days</SelectItem>
                    <SelectItem value="1w">Last Week</SelectItem>
                    <SelectItem value="1m">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
