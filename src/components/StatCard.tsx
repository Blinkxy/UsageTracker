"use client";

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
    <div className={`card h-full ${glowClass} group`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-secondary text-sm font-medium">{title}</span>
        <span
          className={`${accentColor} transition-transform duration-300 group-hover:scale-110`}
          style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
        >
          {icon}
        </span>
      </div>
      <div
        className="text-2xl font-bold tracking-tight"
        style={{ textShadow: "0 0 20px rgba(255,255,255,0.05)" }}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-text-muted text-sm mt-1">{subtitle}</div>
      )}
    </div>
  );
}
