import { NextRequest, NextResponse } from "next/server";
import { getAppUsage } from "@/lib/db";
import { getDisplayName } from "@/lib/categories";
import { getTodayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDate();

    const apps = await getAppUsage(date);

    const totalSeconds = apps.reduce((sum, a) => sum + a.total_seconds, 0);

    const response = {
      date,
      apps: apps.map((app) => ({
        appName: app.app_name,
        displayName: getDisplayName(app.app_name),
        category: app.category,
        totalSeconds: app.total_seconds,
        percentage: totalSeconds > 0
          ? Math.round((app.total_seconds / totalSeconds) * 1000) / 10
          : 0,
        sessions: app.sessions,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
