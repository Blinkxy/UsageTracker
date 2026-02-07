"use client";

import { getProductivityLevel } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface ProductivityScoreProps {
  score: number;
}

export default function ProductivityScore({ score }: ProductivityScoreProps) {
  const level = getProductivityLevel(score);

  // SVG circular progress
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="h-full flex flex-col items-center justify-center py-6">
      <CardHeader className="pb-4">
        <CardTitle>Productivity Score</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        <div className="relative w-36 h-36">
          {/* Outer glow behind the ring */}
          <div
            className="absolute inset-0 rounded-full opacity-30 blur-xl"
            style={{ backgroundColor: level.color }}
          />

          <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 128 128">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={level.color} stopOpacity="1" />
                <stop offset="100%" stopColor={level.color} stopOpacity="0.5" />
              </linearGradient>
              <filter id="scoreGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-border"
            />
            {/* Progress circle with gradient and glow */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              filter="url(#scoreGlow)"
              style={{
                transition: "stroke-dashoffset 1s ease-in-out",
              }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold"
              style={{
                color: level.color,
                textShadow: `0 0 20px ${level.color}40`,
              }}
            >
              {score}
            </span>
            <span className="text-text-muted text-xs">/ 100</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span
            className="text-sm font-semibold"
            style={{
              color: level.color,
              textShadow: `0 0 12px ${level.color}30`,
            }}
          >
            {level.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
