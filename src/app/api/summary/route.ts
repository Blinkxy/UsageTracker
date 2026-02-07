import { NextRequest, NextResponse } from "next/server";
import {
  getDailySummary,
  getProductiveAppSecondsFromSettings,
  getSettings,
} from "@/lib/db";
import { calculateProductivityScore, getTodayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || getTodayDate();

    const settings = await getSettings();
    const summary = await getDailySummary(date);
    const productiveSeconds = await getProductiveAppSecondsFromSettings(
      date,
      settings.productiveApps
    );
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
