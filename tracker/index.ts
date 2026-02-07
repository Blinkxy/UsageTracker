/**
 * Usage Tracker - Background Window Monitor
 *
 * This script runs continuously in the background, polling the active window
 * every second and recording focus changes to the PostgreSQL database.
 *
 * Supports:
 *   - X11 (via xdotool)
 *   - GNOME Wayland (via gdbus)
 *   - Hyprland (via hyprctl)
 *   - Sway (via swaymsg + jq)
 *   - KDE Plasma Wayland (via kdotool)
 *
 * Usage:
 *   npm run tracker        # foreground
 *   npm run tracker:bg     # background (logs to tracker.log)
 */

import { execSync } from "child_process";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// ─── Configuration ───
const POLL_INTERVAL_MS = 1000; // Poll every 1 second

// ─── Types ───
interface WindowInfo {
  appName: string;
  windowTitle: string;
}

type Backend = "x11" | "gnome-wayland" | "hyprland" | "sway" | "kde-wayland";

// ─── Category Classification (duplicated from src for standalone use) ───

const APP_CATEGORIES: Record<string, string> = {
  code: "productive", "code-oss": "productive", cursor: "productive",
  vscodium: "productive", vim: "productive", nvim: "productive",
  neovim: "productive", emacs: "productive", sublime_text: "productive",
  atom: "productive", obsidian: "productive", notion: "productive",
  logseq: "productive", libreoffice: "productive", soffice: "productive",
  gimp: "productive", inkscape: "productive", blender: "productive",
  figma: "productive", krita: "productive", postman: "productive",
  dbeaver: "productive", docker: "productive", ghostty: "productive",
  "gnome-terminal": "productive", konsole: "productive",
  alacritty: "productive", kitty: "productive", wezterm: "productive",
  terminator: "productive", tilix: "productive", xterm: "productive",
  "xfce4-terminal": "productive", foot: "productive", st: "productive",
  urxvt: "productive", hyper: "productive", tabby: "productive", warp: "productive",
  discord: "communication", slack: "communication",
  telegram: "communication", "telegram-desktop": "communication",
  signal: "communication", element: "communication", teams: "communication",
  zoom: "communication", thunderbird: "communication",
  "brave-browser": "browsing", brave: "browsing", firefox: "browsing",
  "firefox-esr": "browsing", librewolf: "browsing", chromium: "browsing",
  "google-chrome": "browsing", chrome: "browsing", vivaldi: "browsing",
  "vivaldi-stable": "browsing", opera: "browsing", "zen-browser": "browsing",
  "microsoft-edge": "browsing", epiphany: "browsing", floorp: "browsing",
  spotify: "entertainment", vlc: "entertainment", mpv: "entertainment",
  steam: "entertainment", lutris: "entertainment", heroic: "entertainment",
  "obs-studio": "entertainment", stremio: "entertainment",
  nautilus: "other", dolphin: "other", thunar: "other", nemo: "other",
};

const BROWSER_TITLE_ENTERTAINMENT = [
  "youtube", "twitch", "netflix", "disney+", "reddit", "9gag",
  "tiktok", "instagram", "facebook", "twitter", "x.com",
];

const BROWSER_TITLE_PRODUCTIVE = [
  "github", "gitlab", "stackoverflow", "stack overflow", "documentation",
  "docs", "mdn", "google docs", "google sheets", "notion", "figma",
  "vercel", "aws console", "jira", "linear", "trello", "npm", "leetcode",
  "coursera", "udemy", "chatgpt", "claude",
];

const BROWSER_TITLE_COMMUNICATION = [
  "gmail", "outlook", "protonmail", "slack", "discord",
  "whatsapp", "messenger", "google meet",
];

function classifyApp(appName: string, windowTitle: string): string {
  const app = appName.toLowerCase().trim();
  const title = windowTitle.toLowerCase().trim();

  const direct = APP_CATEGORIES[app];
  if (direct && direct !== "browsing") return direct;

  const isBrowser = direct === "browsing" ||
    ["brave", "firefox", "chrome", "chromium", "vivaldi", "opera", "edge", "librewolf", "zen", "floorp", "epiphany"]
      .some(b => app.includes(b));

  if (isBrowser) {
    if (BROWSER_TITLE_ENTERTAINMENT.some(p => title.includes(p))) return "entertainment";
    if (BROWSER_TITLE_PRODUCTIVE.some(p => title.includes(p))) return "productive";
    if (BROWSER_TITLE_COMMUNICATION.some(p => title.includes(p))) return "communication";
    return "browsing";
  }

  for (const [known, cat] of Object.entries(APP_CATEGORIES)) {
    if (app.includes(known) || known.includes(app)) return cat;
  }

  return "other";
}

// ─── Backend Detection ───

function detectBackend(): Backend {
  const sessionType = process.env.XDG_SESSION_TYPE || "";
  const desktop = (process.env.XDG_CURRENT_DESKTOP || "").toLowerCase();
  const hyprSignature = process.env.HYPRLAND_INSTANCE_SIGNATURE;
  const swaySock = process.env.SWAYSOCK;

  if (sessionType === "x11" || (!sessionType && hasCommand("xdotool"))) {
    return "x11";
  }

  if (hyprSignature) return "hyprland";
  if (swaySock) return "sway";
  if (desktop.includes("gnome") || desktop.includes("unity")) return "gnome-wayland";
  if (desktop.includes("kde") || desktop.includes("plasma")) return "kde-wayland";

  // Fallback: try x11 if xdotool works (XWayland)
  if (hasCommand("xdotool")) return "x11";

  console.error("Could not detect display backend.");
  console.error("   Supported: X11, GNOME Wayland, KDE Wayland, Hyprland, Sway");
  console.error(`   XDG_SESSION_TYPE=${sessionType}`);
  console.error(`   XDG_CURRENT_DESKTOP=${desktop}`);
  process.exit(1);
}

function hasCommand(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// ─── Window Info Getters ───

function getWindowInfo_X11(): WindowInfo | null {
  try {
    const windowId = execSync("xdotool getactivewindow", {
      timeout: 2000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (!windowId) return null;

    const windowTitle = execSync(
      `xdotool getactivewindow getwindowname`,
      { timeout: 2000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    let appName: string;
    try {
      const xprop = execSync(`xprop -id ${windowId} WM_CLASS`, {
        timeout: 2000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const match = xprop.match(/= "([^"]+)", "([^"]+)"/);
      appName = match ? match[1].toLowerCase() : "unknown";
    } catch {
      appName = "unknown";
    }

    return { appName, windowTitle };
  } catch {
    return null; // No active window (screen locked, desktop focused, etc.)
  }
}

function getWindowInfo_GnomeWayland(): WindowInfo | null {
  try {
    const result = execSync(
      `gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "
        const w = global.display.focus_window;
        JSON.stringify({
          title: w ? w.get_title() : '',
          wmClass: w ? w.get_wm_class() : ''
        })
      "`,
      { timeout: 3000, encoding: "utf-8" }
    ).trim();

    // Parse: (true, '{"title":"...","wmClass":"..."}')
    const jsonMatch = result.match(/'(\{.*\})'/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[1]);
    if (!parsed.wmClass) return null;

    return {
      appName: parsed.wmClass,
      windowTitle: parsed.title || "",
    };
  } catch {
    return null;
  }
}

function getWindowInfo_Hyprland(): WindowInfo | null {
  try {
    const result = execSync("hyprctl activewindow -j", {
      timeout: 2000,
      encoding: "utf-8",
    }).trim();

    const parsed = JSON.parse(result);
    if (!parsed.class) return null;

    return {
      appName: parsed.class,
      windowTitle: parsed.title || "",
    };
  } catch {
    return null;
  }
}

function getWindowInfo_Sway(): WindowInfo | null {
  try {
    const result = execSync(
      `swaymsg -t get_tree -r | jq -r '.. | select(.focused? == true) | {app_id, name} | @json'`,
      { timeout: 2000, encoding: "utf-8", shell: "/bin/bash" }
    ).trim();

    if (!result) return null;

    // May return multiple lines; take the first
    const firstLine = result.split("\n")[0];
    const parsed = JSON.parse(firstLine);

    return {
      appName: parsed.app_id || "unknown",
      windowTitle: parsed.name || "",
    };
  } catch {
    return null;
  }
}

function getWindowInfo_KdeWayland(): WindowInfo | null {
  try {
    // Try kdotool first
    if (hasCommand("kdotool")) {
      const windowId = execSync("kdotool getactivewindow", {
        timeout: 2000,
        encoding: "utf-8",
      }).trim();

      const title = execSync(`kdotool getactivewindow getwindowname`, {
        timeout: 2000,
        encoding: "utf-8",
      }).trim();

      const appName = execSync(`kdotool getactivewindow getwindowclassname`, {
        timeout: 2000,
        encoding: "utf-8",
      }).trim();

      return { appName: appName || windowId, windowTitle: title };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Database Setup ───

function createPool(): Pool {
  return new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "usage_tracker",
    user: process.env.POSTGRES_USER || "tracker",
    password: process.env.POSTGRES_PASSWORD || "changeme",
    max: 3,
    idleTimeoutMillis: 30000,
  });
}

// ─── Main Tracker Loop ───

async function main() {
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║       Usage Tracker - Window Monitor      ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log();

  const backend = detectBackend();
  console.log(`✓ Display backend: ${backend}`);

  const pool = createPool();

  // Test connection
  try {
    await pool.query("SELECT 1");
    console.log(
      `✓ Database: PostgreSQL @ ${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "usage_tracker"}`
    );
  } catch (err) {
    console.error("❌ Cannot connect to PostgreSQL. Is it running?");
    console.error(`   Host: ${process.env.POSTGRES_HOST || "localhost"}`);
    console.error(`   Port: ${process.env.POSTGRES_PORT || "5432"}`);
    console.error(`   Database: ${process.env.POSTGRES_DB || "usage_tracker"}`);
    console.error(`   User: ${process.env.POSTGRES_USER || "tracker"}`);
    console.error(`   Error: ${err}`);
    process.exit(1);
  }

  // Select the appropriate getter function
  const getWindowInfo = {
    "x11": getWindowInfo_X11,
    "gnome-wayland": getWindowInfo_GnomeWayland,
    "hyprland": getWindowInfo_Hyprland,
    "sway": getWindowInfo_Sway,
    "kde-wayland": getWindowInfo_KdeWayland,
  }[backend];

  // Check required tools
  const toolChecks: Record<string, string[]> = {
    "x11": ["xdotool"],
    "gnome-wayland": ["gdbus"],
    "hyprland": ["hyprctl"],
    "sway": ["swaymsg", "jq"],
    "kde-wayland": ["kdotool"],
  };

  for (const tool of toolChecks[backend]) {
    if (!hasCommand(tool)) {
      console.error(`❌ Required tool not found: ${tool}`);
      console.error(`   Install it with your package manager.`);
      if (tool === "xdotool") {
        console.error(`   e.g., sudo apt install xdotool`);
        console.error(`         sudo pacman -S xdotool`);
        console.error(`         sudo dnf install xdotool`);
      }
      process.exit(1);
    }
  }

  console.log(`✓ Required tools available`);
  console.log();
  console.log("Tracking started. Press Ctrl+C to stop.\n");

  // State
  let currentSessionId: number | null = null;
  let currentApp: string = "";
  let currentTitle: string = "";
  let sessionStart: number = 0;
  let idleCount = 0;

  async function closeCurrentSession() {
    if (currentSessionId !== null) {
      const now = new Date().toISOString();
      const duration = Math.floor((Date.now() - sessionStart) / 1000);
      await pool.query(
        `UPDATE focus_events SET ended_at = $1, duration_seconds = $2 WHERE id = $3`,
        [now, duration, currentSessionId]
      );
      const padApp = currentApp.padEnd(20);
      console.log(`  ← ${padApp} (${formatDuration(duration)})`);
    }
    currentSessionId = null;
    currentApp = "";
    currentTitle = "";
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }

  // Close any unclosed sessions from a crash
  const unclosedResult = await pool.query(
    `SELECT id, started_at FROM focus_events WHERE ended_at IS NULL`
  );

  for (const row of unclosedResult.rows) {
    const started = new Date(row.started_at).getTime();
    const duration = Math.max(1, Math.floor((Date.now() - started) / 1000));
    await pool.query(
      `UPDATE focus_events SET ended_at = $1, duration_seconds = $2 WHERE id = $3`,
      [new Date().toISOString(), duration, row.id]
    );
  }

  if (unclosedResult.rows.length > 0) {
    console.log(
      `Closed ${unclosedResult.rows.length} unclosed session(s) from previous run.\n`
    );
  }

  // Graceful shutdown
  async function shutdown() {
    console.log("\n\nShutting down...");
    await closeCurrentSession();
    await pool.end();
    console.log("Goodbye!\n");
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  // Main polling loop
  async function poll() {
    const info = getWindowInfo();

    if (!info || !info.appName || info.appName === "unknown") {
      // No active window (idle/locked/desktop)
      idleCount++;
      if (idleCount >= 5 && currentSessionId !== null) {
        // After 5 seconds of no window, close the session
        await closeCurrentSession();
      }
      return;
    }

    idleCount = 0;
    const { appName, windowTitle } = info;

    // Check if the window changed
    if (appName !== currentApp || windowTitle !== currentTitle) {
      // Close previous session
      await closeCurrentSession();

      // Start new session
      const now = new Date();
      const isoNow = now.toISOString();
      const dateStr = isoNow.split("T")[0];
      const category = classifyApp(appName, windowTitle);

      const result = await pool.query(
        `INSERT INTO focus_events (app_name, window_title, category, started_at, date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [appName, windowTitle, category, isoNow, dateStr]
      );

      currentSessionId = result.rows[0].id;
      currentApp = appName;
      currentTitle = windowTitle;
      sessionStart = Date.now();

      const truncTitle =
        windowTitle.length > 50
          ? windowTitle.substring(0, 50) + "..."
          : windowTitle;
      const time = now.toLocaleTimeString();
      console.log(
        `→ [${time}] ${appName} — ${truncTitle} [${category}]`
      );
    }
  }

  // Start polling
  setInterval(() => void poll(), POLL_INTERVAL_MS);
  await poll(); // Initial poll
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
