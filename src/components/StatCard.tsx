"use client";

import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  glowClass?: string;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  glowClass = "",
  accentColor = "text-accent",
}: StatCardProps) {
  return (
    <Card className={cn("h-full group p-5", glowClass)}>
      <div className="flex flex-col items-center text-center">
        <span
          className={`${accentColor} mb-2 transition-transform duration-300 group-hover:scale-110`}
          style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
        >
          {icon}
        </span>
        <span className="text-text-primary text-xs font-bold mb-1">
          {title}
        </span>
        <div
          className="text-2xl font-bold tracking-tight"
          style={{ textShadow: "0 0 20px rgba(255,255,255,0.05)" }}
        >
          {value}
        </div>
        {subtitle && (
          <div className="text-text-muted text-xs mt-1">{subtitle}</div>
        )}
      </div>
    </Card>
  );
}
