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
import {
  AlertTriangle,
  Target,
  Briefcase,
  Bell,
  Monitor,
} from "lucide-react";

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

function SectionCard({
  icon,
  title,
  accentColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl border border-border/60 px-5 pt-5 pb-6"
      style={{
        background:
          "linear-gradient(145deg, rgba(18,18,26,0.7) 0%, rgba(26,26,46,0.4) 100%)",
        boxShadow: `0 2px 16px rgba(0,0,0,0.2), 0 0 20px ${accentColor}06, inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="p-1.5 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
            boxShadow: `0 0 10px ${accentColor}15`,
          }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
        <h3
          className="text-sm font-bold"
          style={{ color: accentColor }}
        >
          {title}
        </h3>
      </div>
      <div className="space-y-0.5 divide-y divide-border/30">
        {children}
      </div>
    </section>
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
        <div className="text-sm text-text-primary font-medium">{label}</div>
        {description && (
          <div className="text-[11px] text-text-secondary mt-0.5">{description}</div>
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

        <div className="px-6 py-6 space-y-14">
          {/* ── Alerts & Thresholds ── */}
          <SectionCard
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Alerts & Thresholds"
            accentColor="#ef4444"
          >
            <SettingRow
              label="Productivity score alert"
              description="Warn when your score drops below this level"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono min-w-[44px] text-right px-2 py-0.5 rounded-md bg-accent/10 text-accent">
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
                  className="w-28"
                />
              </div>
            </SettingRow>

            <SettingRow
              label="Entertainment time limit"
              description="Daily max before you get a warning"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono min-w-[44px] text-right px-2 py-0.5 rounded-md bg-accent/10 text-accent">
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
                  className="w-28"
                />
              </div>
            </SettingRow>
          </SectionCard>

          {/* ── Goals ── */}
          <SectionCard
            icon={<Target className="h-4 w-4" />}
            title="Daily Goals"
            accentColor="#22c55e"
          >
            <SettingRow
              label="Productive time goal"
              description="Target hours of productive work per day"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono min-w-[44px] text-right px-2 py-0.5 rounded-md bg-productive/10 text-productive">
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
                  className="w-28"
                />
              </div>
            </SettingRow>

            <SettingRow
              label="Screen time cap"
              description="Max total screen time per day"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono min-w-[44px] text-right px-2 py-0.5 rounded-md bg-productive/10 text-productive">
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
                  className="w-28"
                />
              </div>
            </SettingRow>
          </SectionCard>

          {/* ── Productivity Rules ── */}
          <SectionCard
            icon={<Briefcase className="h-4 w-4" />}
            title="Productivity Rules"
            accentColor="#8b5cf6"
          >
            <div className="py-3">
              <div className="text-sm text-text-primary font-medium mb-1">
                Productive apps
              </div>
              <div className="text-[11px] text-text-secondary mb-2">
                Comma-separated app names always classified as productive
                (score is based on content category, not app name)
              </div>
              <input
                type="text"
                value={productiveAppsInput}
                onChange={(e) => setProductiveAppsInput(e.target.value)}
                onBlur={handleProductiveAppsBlur}
                className="w-full px-3 py-2 rounded-lg text-sm border border-border/60 text-text-primary transition-all focus:outline-none focus:border-accent focus:shadow-[0_0_12px_rgba(139,92,246,0.15)] placeholder:text-text-muted"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(12,12,18,0.8), rgba(20,20,34,0.6))",
                }}
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
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionCard
            icon={<Bell className="h-4 w-4" />}
            title="Notifications"
            accentColor="#f59e0b"
          >
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
                <span className="text-xs font-bold font-mono min-w-[44px] text-right px-2 py-0.5 rounded-md bg-browsing/10 text-browsing">
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
                  className="w-28"
                />
              </div>
            </SettingRow>
          </SectionCard>

          {/* ── Display ── */}
          <SectionCard
            icon={<Monitor className="h-4 w-4" />}
            title="Display Preferences"
            accentColor="#3b82f6"
          >
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
          </SectionCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
