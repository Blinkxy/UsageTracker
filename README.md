# Usage Tracker

A productivity monitoring dashboard for Linux. Tracks which application is in focus on your desktop and provides real-time analytics to help you stay productive and avoid distractions.

## Features

- **Real-time window tracking** — Monitors your active window every second
- **Smart categorization** — Automatically classifies apps as Productive, Communication, Browsing, Entertainment, or Other
- **Browser-aware** — Detects what you're doing inside browsers (YouTube = Entertainment, GitHub = Productive, etc.)
- **Productivity score** — Score (0–100) based on time spent in configurable productive apps
- **Interactive charts** — Category donut chart, top apps bar chart, hourly/daily activity timeline
- **Configurable settings** — Productivity thresholds, entertainment limits, daily goals, working hours, notification preferences
- **Distraction alerts** — Warns you when you exceed configurable time limits
- **Browser notifications** — Desktop notifications with cooldown support
- **Date navigation** — View historical data from any day
- **Multi-day timeline** — View activity over the last 3 days, 1 week, or 1 month
- **Dockerized** — Dashboard and PostgreSQL run in Docker; tracker runs natively on the host

## Architecture

```
┌─────────────────────────────────────────────┐
│  Host Machine (Linux Desktop)               │
│                                             │
│  tracker/index.ts (runs natively)           │
│    └── writes to PostgreSQL ──────────┐     │
│                                       │     │
│  ┌─ Docker Compose ─────────────────┐ │     │
│  │  PostgreSQL (port 5432)  ◄───────┘ │     │
│  │  Next.js Dashboard (port 3000)     │     │
│  └────────────────────────────────────┘     │
│                                             │
│  Browser → http://localhost:3000            │
└─────────────────────────────────────────────┘
```

The tracker **must** run on the host (it needs display server tools like `xdotool` to detect the active window). The dashboard and PostgreSQL run in Docker.

## Supported Environments

| Desktop | Tool Required |
|---------|--------------|
| X11 | `xdotool` |
| GNOME (Wayland) | `gdbus` (pre-installed) |
| KDE Plasma (Wayland) | `kdotool` |
| Hyprland | `hyprctl` (pre-installed) |
| Sway | `swaymsg` + `jq` |

## Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 20+** (for the tracker)
- **xdotool** (or the equivalent tool for your desktop — see table above)

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/Blinkxy/UsageTracker.git
cd UsageTracker
cp .env.example .env
```

Edit `.env` and set your PostgreSQL password:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=usage_tracker
POSTGRES_USER=tracker
POSTGRES_PASSWORD=your_secure_password
```

### 2. Start the Docker stack

```bash
docker compose up -d
```

This starts PostgreSQL and the dashboard. The database schema is created automatically on first run.

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Install tracker dependencies

```bash
npm install
```

### 4. Install system dependencies

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

### 5. Start the tracker

```bash
npm run tracker
```

This runs the background window monitor. It logs every focus change and writes to PostgreSQL. Press `Ctrl+C` to stop.

To run it in the background:
```bash
npm run tracker:bg
```

## Docker Commands

```bash
docker compose up -d       # Start PostgreSQL + dashboard
docker compose down        # Stop everything
docker compose logs -f     # View logs
```

Or use the npm shortcuts:
```bash
npm run docker:up
npm run docker:down
npm run docker:logs
```

## Project Structure

```
UsageTracker/
├── tracker/
│   └── index.ts              # Background window tracking script
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Dashboard page
│   │   ├── globals.css       # Styles (Tailwind v4)
│   │   └── api/
│   │       ├── summary/      # Daily summary endpoint
│   │       ├── usage/        # Per-app usage endpoint
│   │       ├── timeline/     # Hourly/daily timeline endpoint
│   │       └── settings/     # User settings endpoint
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── StatCard.tsx           # Stat cards
│   │   ├── ProductivityScore.tsx  # Circular progress score
│   │   ├── CategoryChart.tsx      # Donut chart
│   │   ├── TopAppsChart.tsx       # Horizontal bar chart
│   │   ├── TimelineChart.tsx      # Stacked area chart
│   │   ├── AppUsageList.tsx       # Full app list table
│   │   ├── DistractionAlerts.tsx  # Smart alerts
│   │   ├── SettingsModal.tsx      # Settings panel
│   │   ├── SettingsContext.tsx     # Settings state provider
│   │   └── useNotifications.ts    # Browser notification hook
│   ├── lib/
│   │   ├── db.ts             # PostgreSQL database helpers
│   │   ├── categories.ts     # App classification logic
│   │   └── utils.ts          # Formatting utilities
│   └── types/
│       └── index.ts          # TypeScript types
├── scripts/
│   └── init.sql              # PostgreSQL schema
├── .env.example              # Environment config template
├── Dockerfile                # Multi-stage Next.js build
├── docker-compose.yml        # PostgreSQL + dashboard services
└── package.json
```

## Tech Stack

- **Next.js 15** (App Router, standalone output)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL 16** (via Docker)
- **node-postgres (pg)** (database driver)
- **Recharts** (charts)
- **date-fns** (date utilities)
- **Docker** (containerized deployment)
