"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdown, Category } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import { formatDuration } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface CategoryChartProps {
  categories: CategoryBreakdown;
}

export default function CategoryChart({ categories }: CategoryChartProps) {
  const data = Object.entries(categories)
    .filter(([, seconds]) => seconds > 0)
    .map(([key, seconds]) => ({
      name: CATEGORY_LABELS[key as Category],
      value: seconds,
      color: CATEGORY_COLORS[key as Category],
      key,
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-center">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-text-muted text-sm">
          No data yet — start the tracker to see your categories.
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; color: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="custom-tooltip">
          <p className="text-sm font-medium" style={{ color: item.color }}>
            {item.name}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            {formatDuration(item.value)} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-center">Category Breakdown</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-5">
          <div className="w-32 h-32 flex-shrink-0 relative">
            {/* Glow behind the donut */}
            <div
              className="absolute inset-4 rounded-full blur-2xl opacity-20"
              style={{
                background: `conic-gradient(${data.map((d, i) => `${d.color} ${(i / data.length) * 360}deg ${((i + 1) / data.length) * 360}deg`).join(", ")})`,
              }}
            />
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {data.map((entry, index) => (
                    <radialGradient
                      key={`pieGrad-${index}`}
                      id={`pieGrad-${index}`}
                      cx="50%"
                      cy="50%"
                      r="70%"
                    >
                      <stop offset="30%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                    </radialGradient>
                  ))}
                  <filter id="pieGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="rgba(0,0,0,0.3)"
                  filter="url(#pieGlow)"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={`url(#pieGrad-${index})`} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-40 space-y-2 min-w-0">
            {data.map((item) => {
              const pct = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={item.key}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: `0 0 6px ${item.color}60`,
                      }}
                    />
                    <span className="text-xs text-text-primary truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 rounded-full animate-grow"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                        boxShadow: `0 0 8px ${item.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      }}
                    />
                    <span className="text-[10px] text-text-muted flex-shrink-0">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
