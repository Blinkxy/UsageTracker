import Dashboard from "@/components/Dashboard";
import { SettingsProvider } from "@/components/SettingsContext";

export default function Home() {
  return (
    <SettingsProvider>
      <Dashboard />
    </SettingsProvider>
  );
}
