"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { UserSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      const optimistic = { ...settings, ...updates };
      setSettings(optimistic);

      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const saved = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...saved });
      } catch {
        // Revert on failure
        setSettings(settings);
      }
    },
    [settings]
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
