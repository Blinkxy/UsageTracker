# Usage Tracker

A productivity monitoring dashboard for Linux. Tracks which application is in focus on your desktop and provides real-time analytics to help you stay productive and avoid distractions.

## Features

- **Real-time window tracking** — Monitors your active window every second
- **Smart categorization** — Automatically classifies apps as Productive, Communication, Browsing, Entertainment, or Other
- **Browser-aware** — Detects what you're doing inside browsers (YouTube = Entertainment, GitHub = Productive, etc.)
- **Productivity score** — Weighted score (0–100) based on your activity categories
- **Interactive charts** — Category donut chart, top apps bar chart, and hourly activity timeline
- **Distraction alerts** — Warns you when you spend too much time on entertainment
- **Date navigation** — View historical data from any day
- **Auto-refresh** — Dashboard updates every 5 seconds when viewing today

## Supported Environments

| Desktop | Tool Required |
|---------|--------------|
| X11 | `xdotool` |
| GNOME (Wayland) | `gdbus` (pre-installed) |
| KDE Plasma (Wayland) | `kdotool` |
| Hyprland | `hyprctl` (pre-installed) |
| Sway | `swaymsg` + `jq` |

## Setup

### 1. Install system dependencies

**Ubuntu/Debian (X11):**
```bash
sudo apt install xdotool
```

**Arch Linux (X11):**
```bash
sudo pacman -S xdotool
```

**Fedora (X11):**
```bash
sudo dnf install xdotool
```

> For Wayland desktops, the required tools are usually pre-installed with your compositor.

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Initialize the data directory

```bash
npm run setup
```

## Usage

You need **two terminals** — one for the tracker, one for the dashboard.

### Terminal 1: Start the tracker

```bash
npm run tracker
```

This runs the background window monitor. It will log every focus change to the terminal and write to the SQLite database. Press `Ctrl+C` to stop.

To run it in the background:
```bash
npm run tracker:bg
```

### Terminal 2: Start the dashboard

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
UsageTracker/
├── tracker/
│   └── index.ts          # Background window tracking script
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Dashboard page
│   │   ├── globals.css    # Styles (Tailwind v4)
│   │   └── api/
│   │       ├── summary/   # Daily summary endpoint
│   │       ├── usage/     # Per-app usage endpoint
│   │       └── timeline/  # Hourly timeline endpoint
│   ├── components/
│   │   ├── Dashboard.tsx         # Main dashboard (client component)
│   │   ├── StatCard.tsx          # Stat cards
│   │   ├── ProductivityScore.tsx # Circular progress score
│   │   ├── CategoryChart.tsx     # Donut chart
│   │   ├── TopAppsChart.tsx      # Horizontal bar chart
│   │   ├── TimelineChart.tsx     # Stacked area chart
│   │   ├── AppUsageList.tsx      # Full app list table
│   │   └── DistractionAlerts.tsx # Smart alerts
│   ├── lib/
│   │   ├── db.ts          # SQLite database helpers
│   │   ├── categories.ts  # App classification logic
│   │   └── utils.ts       # Formatting utilities
│   └── types/
│       └── index.ts       # TypeScript types
├── data/
│   └── usage.db           # SQLite database (auto-created)
└── package.json
```

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **better-sqlite3** (database)
- **Recharts** (charts)
- **date-fns** (date utilities)
