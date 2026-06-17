import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolfie Trading Bot",
  description: "Wolfie trading bot preview"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
