import type { Metadata } from "next";
import "./globals.css";
import "./wolfie-recovery.css";

const title = "Wolfie Trading";
const description =
  "Wolfie is a commercial agentic trade platform for Robinhood Trading, built to help users design, configure, and deploy intelligent trading agents with disciplined oversight.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wolfietrade.com"),
  title,
  description,
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title,
    description: "The first commercial Agentic Trade platform specifically for RobinHood Trading.",
    url: "https://www.wolfietrade.com",
    siteName: "Wolfie Trading",
    images: [
      {
        url: "/wolfie-logo.png",
        width: 512,
        height: 512,
        alt: "Wolfie Trading"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "The first commercial Agentic Trade platform specifically for RobinHood Trading.",
    images: ["/wolfie-logo.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
