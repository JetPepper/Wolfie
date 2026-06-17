import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolfie Trading Bot",
  description: "Local simulated Robinhood-compatible paper trading beta"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

