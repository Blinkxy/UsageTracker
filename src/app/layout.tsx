import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity Tracker — Productivity Dashboard",
  description:
    "Monitor your computer usage, track productivity, and stay focused.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
