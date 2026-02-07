import type { Category } from "@/types";

// ─── App Classification Rules ───
// Maps known application class names (lowercase) to productivity categories.

const APP_CATEGORIES: Record<string, Category> = {
  // ── Productive ──
  code: "productive",
  "code-oss": "productive",
  cursor: "productive",
  vscodium: "productive",
  "visual studio code": "productive",
  vim: "productive",
  nvim: "productive",
  neovim: "productive",
  emacs: "productive",
  "sublime_text": "productive",
  "sublime-text": "productive",
  atom: "productive",
  "jetbrains-idea": "productive",
  "jetbrains-webstorm": "productive",
  "jetbrains-pycharm": "productive",
  "jetbrains-clion": "productive",
  "jetbrains-goland": "productive",
  "jetbrains-rider": "productive",
  "jetbrains-datagrip": "productive",
  "jetbrains-rubymine": "productive",
  "jetbrains-phpstorm": "productive",
  obsidian: "productive",
  notion: "productive",
  logseq: "productive",
  zettlr: "productive",
  libreoffice: "productive",
  "libreoffice-writer": "productive",
  "libreoffice-calc": "productive",
  "libreoffice-impress": "productive",
  soffice: "productive",
  gimp: "productive",
  inkscape: "productive",
  blender: "productive",
  figma: "productive",
  "figma-linux": "productive",
  krita: "productive",
  kdenlive: "productive",
  postman: "productive",
  insomnia: "productive",
  dbeaver: "productive",
  pgadmin: "productive",
  docker: "productive",
  "docker-desktop": "productive",

  // ── Terminals (productive) ──
  "gnome-terminal": "productive",
  konsole: "productive",
  alacritty: "productive",
  kitty: "productive",
  wezterm: "productive",
  terminator: "productive",
  tilix: "productive",
  xterm: "productive",
  "xfce4-terminal": "productive",
  foot: "productive",
  st: "productive",
  sakura: "productive",
  urxvt: "productive",
  "mate-terminal": "productive",
  terminology: "productive",
  warp: "productive",
  tabby: "productive",
  hyper: "productive",
  ghostty: "productive",

  // ── Communication ──
  discord: "communication",
  slack: "communication",
  telegram: "communication",
  "telegram-desktop": "communication",
  signal: "communication",
  element: "communication",
  "microsoft teams": "communication",
  teams: "communication",
  zoom: "communication",
  "zoom.real": "communication",
  skype: "communication",
  thunderbird: "communication",
  evolution: "communication",
  geary: "communication",
  mailspring: "communication",
  betterbird: "communication",
  matrix: "communication",
  revolt: "communication",
  hexchat: "communication",
  irssi: "communication",
  weechat: "communication",

  // ── Browsing (neutral) ──
  "brave-browser": "browsing",
  brave: "browsing",
  firefox: "browsing",
  "firefox-esr": "browsing",
  librewolf: "browsing",
  chromium: "browsing",
  "chromium-browser": "browsing",
  "google-chrome": "browsing",
  chrome: "browsing",
  vivaldi: "browsing",
  "vivaldi-stable": "browsing",
  opera: "browsing",
  "microsoft-edge": "browsing",
  epiphany: "browsing",
  midori: "browsing",
  qutebrowser: "browsing",
  "zen-browser": "browsing",
  tor: "browsing",
  floorp: "browsing",

  // ── Entertainment ──
  spotify: "entertainment",
  vlc: "entertainment",
  mpv: "entertainment",
  celluloid: "entertainment",
  totem: "entertainment",
  rhythmbox: "entertainment",
  steam: "entertainment",
  lutris: "entertainment",
  heroic: "entertainment",
  "heroic games launcher": "entertainment",
  minecraft: "entertainment",
  "prismlauncher": "entertainment",
  retroarch: "entertainment",
  obs: "entertainment",
  "obs-studio": "entertainment",
  stremio: "entertainment",
  kodi: "entertainment",
  "elisa": "entertainment",
  lollypop: "entertainment",
  amberol: "entertainment",

  // ── File managers / system (other) ──
  nautilus: "other",
  dolphin: "other",
  thunar: "other",
  nemo: "other",
  pcmanfm: "other",
  caja: "other",
  "gnome-files": "other",
  "org.gnome.nautilus": "other",
  "gnome-settings": "other",
  "gnome-control-center": "other",
  systemsettings: "other",
};

// ─── Browser Title-Based Overrides ───
// When a browser is detected, check the window title for these patterns
// to reclassify the activity.

interface TitleRule {
  patterns: string[];
  category: Category;
}

const BROWSER_TITLE_RULES: TitleRule[] = [
  // Entertainment overrides
  {
    patterns: [
      "youtube",
      "twitch",
      "netflix",
      "disney+",
      "hulu",
      "crunchyroll",
      "reddit",
      "9gag",
      "imgur",
      "tiktok",
      "instagram",
      "facebook",
      "twitter",
      "x.com",
    ],
    category: "entertainment",
  },
  // Productive overrides
  {
    patterns: [
      "github",
      "gitlab",
      "bitbucket",
      "stackoverflow",
      "stack overflow",
      "documentation",
      "docs",
      "mdn web docs",
      "devdocs",
      "google docs",
      "google sheets",
      "google slides",
      "notion",
      "figma",
      "vercel",
      "netlify",
      "aws console",
      "azure portal",
      "jira",
      "linear",
      "trello",
      "asana",
      "confluence",
      "npm",
      "pypi",
      "crates.io",
      "leetcode",
      "hackerrank",
      "codewars",
      "coursera",
      "udemy",
      "pluralsight",
      "freecodecamp",
      "w3schools",
      "geeksforgeeks",
      "chatgpt",
      "claude",
      "copilot",
    ],
    category: "productive",
  },
  // Communication overrides
  {
    patterns: [
      "gmail",
      "outlook",
      "protonmail",
      "yahoo mail",
      "slack",
      "discord",
      "telegram",
      "whatsapp web",
      "messenger",
      "teams",
      "zoom",
      "google meet",
      "google chat",
    ],
    category: "communication",
  },
];

/**
 * Classify an application into a productivity category.
 * First checks the app_name against known apps, then for browsers,
 * examines the window title for more specific classification.
 */
export function classifyApp(appName: string, windowTitle: string): Category {
  const normalizedApp = appName.toLowerCase().trim();
  const normalizedTitle = windowTitle.toLowerCase().trim();

  // Direct app match
  const directMatch = APP_CATEGORIES[normalizedApp];

  if (directMatch && directMatch !== "browsing") {
    // If it's not a browser, return the direct match
    return directMatch;
  }

  // For browsers (or if direct match is "browsing"), check title rules
  if (directMatch === "browsing" || isBrowser(normalizedApp)) {
    for (const rule of BROWSER_TITLE_RULES) {
      for (const pattern of rule.patterns) {
        if (normalizedTitle.includes(pattern)) {
          return rule.category;
        }
      }
    }
    return "browsing";
  }

  // Check if the app name partially matches any known app
  for (const [known, category] of Object.entries(APP_CATEGORIES)) {
    if (normalizedApp.includes(known) || known.includes(normalizedApp)) {
      if (category === "browsing") {
        // Apply browser title rules
        for (const rule of BROWSER_TITLE_RULES) {
          for (const pattern of rule.patterns) {
            if (normalizedTitle.includes(pattern)) {
              return rule.category;
            }
          }
        }
        return "browsing";
      }
      return category;
    }
  }

  return "other";
}

function isBrowser(appName: string): boolean {
  const browsers = [
    "brave",
    "firefox",
    "chrome",
    "chromium",
    "vivaldi",
    "opera",
    "edge",
    "safari",
    "epiphany",
    "midori",
    "qutebrowser",
    "librewolf",
    "tor",
    "floorp",
    "zen",
  ];
  return browsers.some(
    (b) => appName.includes(b) || appName.startsWith(b)
  );
}

/**
 * Generate a human-readable display name from an app class name.
 */
export function getDisplayName(appName: string): string {
  const displayNames: Record<string, string> = {
    "brave-browser": "Brave",
    "google-chrome": "Chrome",
    "firefox": "Firefox",
    "firefox-esr": "Firefox ESR",
    "chromium-browser": "Chromium",
    "code": "VS Code",
    "code-oss": "VS Code OSS",
    "cursor": "Cursor",
    "gnome-terminal": "Terminal",
    "konsole": "Konsole",
    "alacritty": "Alacritty",
    "kitty": "Kitty",
    "wezterm": "WezTerm",
    "discord": "Discord",
    "slack": "Slack",
    "telegram-desktop": "Telegram",
    "spotify": "Spotify",
    "obs-studio": "OBS Studio",
    "nautilus": "Files",
    "dolphin": "Dolphin",
    "thunar": "Thunar",
    "steam": "Steam",
    "obsidian": "Obsidian",
    "thunderbird": "Thunderbird",
    "vlc": "VLC",
    "mpv": "mpv",
    "libreoffice-writer": "Writer",
    "libreoffice-calc": "Calc",
    "gimp": "GIMP",
    "inkscape": "Inkscape",
    "blender": "Blender",
    "ghostty": "Ghostty",
    "zen-browser": "Zen Browser",
    "vivaldi-stable": "Vivaldi",
  };

  const lower = appName.toLowerCase();
  if (displayNames[lower]) return displayNames[lower];

  // Capitalize first letter of each word, replace hyphens/underscores with spaces
  return appName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
