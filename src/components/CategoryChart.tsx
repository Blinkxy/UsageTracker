"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdown, Category } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import { formatDuration } from "@/lib/utils";

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
      <div className="card h-full">
        <h3 className="text-text-secondary text-sm font-medium mb-4">
          Category Breakdown
        </h3>
        <div className="flex items-center justify-center h-48 text-text-muted text-sm">
          No data yet — start the tracker to see your categories.
        </div>
      </div>
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
    <div className="card h-full">
      <h3 className="text-text-secondary text-sm font-medium mb-4">
        Category Breakdown
      </h3>

      <div className="flex items-center gap-4">
        <div className="w-44 h-44 flex-shrink-0 relative">
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
                    <stop
                      offset="30%"
                      stopColor={entry.color}
                      stopOpacity={1}
                    />
                    <stop
                      offset="100%"
                      stopColor={entry.color}
                      stopOpacity={0.6}
                    />
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
                innerRadius={45}
                outerRadius={70}
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

        <div className="flex-1 space-y-2.5">
          {data.map((item) => {
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.key} className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}60`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-primary truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-text-muted ml-2 flex-shrink-0">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border/50 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full animate-grow"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                        boxShadow: `0 0 10px ${item.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
