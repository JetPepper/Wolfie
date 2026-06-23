import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wolfie Trading",
  description: "The first commercial Agentic Trade platform specifically for RobinHood Trading."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
