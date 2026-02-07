import { NextRequest, NextResponse } from "next/server";
import { getHourlyTimeline, getDailyTimeline } from "@/lib/db";
import { getTodayDate, getHourLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDate();
    const range = searchParams.get("range") || "today";

    // Multi-day ranges
    if (range === "3d" || range === "1w" || range === "1m") {
      const daysBack = range === "3d" ? 2 : range === "1w" ? 6 : 29;
      const startDate = getDateNDaysAgo(daysBack);
      const endDate = getTodayDate();

      const dayMap = await getDailyTimeline(startDate, endDate);

      const days = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, data]) => ({
          date: dateKey,
          label: formatDayLabel(dateKey),
          ...data,
          total:
            data.productive +
            data.communication +
            data.browsing +
            data.entertainment +
            data.other,
        }));

      return NextResponse.json({ range, days });
    }

    // Default: hourly view for a single day
    const hours = await getHourlyTimeline(date);

    const response = {
      date,
      range: "today",
      hours: Object.entries(hours).map(([hour, data]) => ({
        hour: parseInt(hour),
        label: getHourLabel(parseInt(hour)),
        ...data,
        total:
          data.productive +
          data.communication +
          data.browsing +
          data.entertainment +
          data.other,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline data" },
      { status: 500 }
    );
  }
}
