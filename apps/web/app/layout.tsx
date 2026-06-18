import type { Metadata } from "next";
import "./globals.css";
import "./wolfie-recovery.css";

export const metadata: Metadata = {
  title: "Wolfie Trading Bot",
  description: "Wolfie agentic trading command center"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
