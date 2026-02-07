import { Pool } from "pg";
import type { UserSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

// ─── Connection Pool ───

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  _pool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "usage_tracker",
    user: process.env.POSTGRES_USER || "tracker",
    password: process.env.POSTGRES_PASSWORD || "changeme",
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return _pool;
}

// ─── Query Helpers ───

/**
 * Get summary of usage for a given date.
 */
export async function getDailySummary(date: string) {
  const pool = getPool();

  const catResult = await pool.query(
    `SELECT category, SUM(duration_seconds) as total_seconds
     FROM focus_events
     WHERE date = $1 AND ended_at IS NOT NULL
     GROUP BY category`,
    [date]
  );

  const currentResult = await pool.query(
    `SELECT LOWER(app_name) as app_name, category, started_at
     FROM focus_events
     WHERE date = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [date]
  );

  const currentSession = currentResult.rows[0] || null;

  // Calculate active session duration
  let activeSeconds = 0;
  let activeCategory = "";
  if (currentSession) {
    const startedAt = new Date(currentSession.started_at).getTime();
    activeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    activeCategory = currentSession.category;
  }

  const categories: Record<string, number> = {
    productive: 0,
    communication: 0,
    browsing: 0,
    entertainment: 0,
    other: 0,
  };

  for (const row of catResult.rows) {
    if (row.category in categories) {
      categories[row.category] = parseInt(row.total_seconds, 10);
    }
  }

  // Add active session time to its category
  if (activeCategory && activeCategory in categories) {
    categories[activeCategory] += activeSeconds;
  }

  const totalSeconds = Object.values(categories).reduce((a, b) => a + b, 0);

  return {
    categories,
    totalSeconds,
    currentApp: currentSession?.app_name || null,
    currentCategory: currentSession?.category || null,
  };
}

/**
 * Get total seconds spent on productive apps (Brave + Cursor only) for a date.
 * Used to calculate the productivity score.
 */
export async function getProductiveAppSeconds(date: string): Promise<number> {
  const pool = getPool();

  const PRODUCTIVE_APPS = ["brave", "brave-browser", "cursor"];
  const placeholders = PRODUCTIVE_APPS.map((_, i) => `$${i + 2}`).join(", ");

  const result = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds), 0) as total
     FROM focus_events
     WHERE date = $1 AND ended_at IS NOT NULL
       AND LOWER(app_name) IN (${placeholders})`,
    [date, ...PRODUCTIVE_APPS]
  );

  const total = parseInt(result.rows[0]?.total || "0", 10);

  // Also include active session if it's a productive app
  const currentResult = await pool.query(
    `SELECT LOWER(app_name) as app_name, started_at
     FROM focus_events
     WHERE date = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [date]
  );

  const currentSession = currentResult.rows[0] || null;
  let activeSeconds = 0;
  if (
    currentSession &&
    PRODUCTIVE_APPS.includes(currentSession.app_name.toLowerCase())
  ) {
    activeSeconds = Math.floor(
      (Date.now() - new Date(currentSession.started_at).getTime()) / 1000
    );
  }

  return total + activeSeconds;
}

/**
 * Get per-app usage breakdown for a given date.
 */
export async function getAppUsage(date: string) {
  const pool = getPool();

  const result = await pool.query(
    `SELECT
       LOWER(app_name) as app_name,
       (array_agg(category ORDER BY duration_seconds DESC))[1] as category,
       SUM(duration_seconds) as total_seconds,
       COUNT(*) as sessions
     FROM focus_events
     WHERE date = $1 AND ended_at IS NOT NULL
     GROUP BY LOWER(app_name)
     ORDER BY total_seconds DESC`,
    [date]
  );

  const apps = result.rows.map((r) => ({
    app_name: r.app_name,
    category: r.category,
    total_seconds: parseInt(r.total_seconds, 10),
    sessions: parseInt(r.sessions, 10),
  }));

  // Check for active session
  const currentResult = await pool.query(
    `SELECT LOWER(app_name) as app_name, category, started_at
     FROM focus_events
     WHERE date = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [date]
  );

  const currentSession = currentResult.rows[0] || null;

  if (currentSession) {
    const activeSeconds = Math.floor(
      (Date.now() - new Date(currentSession.started_at).getTime()) / 1000
    );
    const existing = apps.find(
      (a) =>
        a.app_name.toLowerCase() === currentSession.app_name.toLowerCase()
    );
    if (existing) {
      existing.total_seconds += activeSeconds;
      existing.sessions += 1;
    } else {
      apps.push({
        app_name: currentSession.app_name,
        category: currentSession.category,
        total_seconds: activeSeconds,
        sessions: 1,
      });
    }
    // Re-sort
    apps.sort((a, b) => b.total_seconds - a.total_seconds);
  }

  return apps;
}

/**
 * Get daily category totals for a date range.
 * Used for multi-day timeline views (last 3 days, last week, last month).
 */
export async function getDailyTimeline(startDate: string, endDate: string) {
  const pool = getPool();

  const result = await pool.query(
    `SELECT date::text, category, SUM(duration_seconds) as total_seconds
     FROM focus_events
     WHERE date >= $1 AND date <= $2 AND ended_at IS NOT NULL
     GROUP BY date, category
     ORDER BY date`,
    [startDate, endDate]
  );

  // Build a map of date -> category totals
  const dayMap: Record<
    string,
    {
      productive: number;
      communication: number;
      browsing: number;
      entertainment: number;
      other: number;
    }
  > = {};

  // Initialize all dates in range
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    dayMap[key] = {
      productive: 0,
      communication: 0,
      browsing: 0,
      entertainment: 0,
      other: 0,
    };
  }

  // Fill in data
  for (const row of result.rows) {
    const dateKey = row.date;
    if (dayMap[dateKey] && row.category in dayMap[dateKey]) {
      dayMap[dateKey][row.category as keyof (typeof dayMap)[string]] =
        parseInt(row.total_seconds, 10);
    }
  }

  // Include active session for today if it falls within range
  const todayStr = new Date().toISOString().split("T")[0];
  if (dayMap[todayStr]) {
    const currentResult = await pool.query(
      `SELECT category, started_at
       FROM focus_events
       WHERE date = $1 AND ended_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [todayStr]
    );

    const currentSession = currentResult.rows[0] || null;
    if (currentSession) {
      const cat = currentSession.category as keyof (typeof dayMap)[string];
      if (cat in dayMap[todayStr]) {
        const activeSeconds = Math.floor(
          (Date.now() - new Date(currentSession.started_at).getTime()) / 1000
        );
        dayMap[todayStr][cat] += activeSeconds;
      }
    }
  }

  return dayMap;
}

/**
 * Get hourly timeline data for a given date.
 */
export async function getHourlyTimeline(date: string) {
  const pool = getPool();

  // Get all completed events for the date
  const result = await pool.query(
    `SELECT category, started_at, ended_at, duration_seconds
     FROM focus_events
     WHERE date = $1 AND ended_at IS NOT NULL
     ORDER BY started_at`,
    [date]
  );

  // Initialize hourly buckets (0-23)
  const hours: Record<
    number,
    {
      productive: number;
      communication: number;
      browsing: number;
      entertainment: number;
      other: number;
    }
  > = {};

  for (let h = 0; h < 24; h++) {
    hours[h] = {
      productive: 0,
      communication: 0,
      browsing: 0,
      entertainment: 0,
      other: 0,
    };
  }

  // Distribute event durations across hours
  for (const event of result.rows) {
    const start = new Date(event.started_at);
    const end = new Date(event.ended_at);
    const cat = event.category as keyof (typeof hours)[0];

    if (!(cat in hours[0])) continue;

    // Handle events spanning multiple hours
    let current = new Date(start);
    while (current < end) {
      const hour = current.getHours();
      const nextHour = new Date(current);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(hour + 1);

      const segmentEnd = nextHour < end ? nextHour : end;
      const segmentSeconds = Math.floor(
        (segmentEnd.getTime() - current.getTime()) / 1000
      );

      hours[hour][cat] += segmentSeconds;
      current = segmentEnd;
    }
  }

  // Also include active session
  const currentResult = await pool.query(
    `SELECT category, started_at
     FROM focus_events
     WHERE date = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [date]
  );

  const currentSession = currentResult.rows[0] || null;

  if (currentSession) {
    const start = new Date(currentSession.started_at);
    const end = new Date();
    const cat = currentSession.category as keyof (typeof hours)[0];

    if (cat in hours[0]) {
      let current = new Date(start);
      while (current < end) {
        const hour = current.getHours();
        const nextHour = new Date(current);
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(hour + 1);

        const segmentEnd = nextHour < end ? nextHour : end;
        const segmentSeconds = Math.floor(
          (segmentEnd.getTime() - current.getTime()) / 1000
        );

        hours[hour][cat] += segmentSeconds;
        current = segmentEnd;
      }
    }
  }

  return hours;
}

// ─── Settings Helpers ───

/**
 * Get all user settings, merged with defaults.
 */
export async function getSettings(): Promise<UserSettings> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT value FROM user_settings WHERE key = 'settings'`
  );

  const row = result.rows[0];
  if (!row) return { ...DEFAULT_SETTINGS };

  try {
    const saved = JSON.parse(row.value);
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save user settings (partial update, merged with existing).
 */
export async function saveSettings(
  updates: Partial<UserSettings>
): Promise<UserSettings> {
  const pool = getPool();
  const current = await getSettings();
  const merged = { ...current, ...updates };
  const json = JSON.stringify(merged);

  await pool.query(
    `INSERT INTO user_settings (key, value) VALUES ('settings', $1)
     ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`,
    [json]
  );

  return merged;
}

/**
 * Get productive app seconds using the configurable productive apps list.
 */
export async function getProductiveAppSecondsFromSettings(
  date: string,
  productiveApps: string[]
): Promise<number> {
  const pool = getPool();

  if (productiveApps.length === 0) return 0;

  const placeholders = productiveApps
    .map((_, i) => `$${i + 2}`)
    .join(", ");

  const result = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds), 0) as total
     FROM focus_events
     WHERE date = $1 AND ended_at IS NOT NULL
       AND LOWER(app_name) IN (${placeholders})`,
    [date, ...productiveApps]
  );

  const total = parseInt(result.rows[0]?.total || "0", 10);

  // Also include active session if it's a productive app
  const currentResult = await pool.query(
    `SELECT LOWER(app_name) as app_name, started_at
     FROM focus_events
     WHERE date = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [date]
  );

  const currentSession = currentResult.rows[0] || null;
  let activeSeconds = 0;
  if (
    currentSession &&
    productiveApps.includes(currentSession.app_name.toLowerCase())
  ) {
    activeSeconds = Math.floor(
      (Date.now() - new Date(currentSession.started_at).getTime()) / 1000
    );
  }

  return total + activeSeconds;
}
