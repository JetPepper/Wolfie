import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wolfie",
  description: "Autonomous AI trading agents for Robinhood."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
