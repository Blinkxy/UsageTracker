import { NextRequest, NextResponse } from "next/server";
import { getDailySummary } from "@/lib/db";
import { calculateProductivityScore, getTodayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDate();

    const summary = await getDailySummary(date);

    // Productivity score is now based on the "productive" category
    // (classified by window title content, not app name)
    const productiveSeconds = summary.categories.productive || 0;
    const productivityScore = calculateProductivityScore(
      productiveSeconds,
      summary.totalSeconds
    );

    return NextResponse.json({
      date,
      totalSeconds: summary.totalSeconds,
      categories: summary.categories,
      productivityScore,
      currentApp: summary.currentApp,
      currentCategory: summary.currentCategory,
    });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
