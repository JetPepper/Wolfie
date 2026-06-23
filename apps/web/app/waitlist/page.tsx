import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";

export const metadata = {
  title: "Join The Wolfie Waitlist",
  description: "Request early access to Wolfie Trading."
};

export default function WaitlistPage() {
  return (
    <main className="public-page waitlist-page">
      <section className="waitlist-card" aria-labelledby="waitlist-title">
        <Link className="waitlist-close" href="/" aria-label="Return to landing page" />
        <div className="waitlist-brand">
          <span className="waitlist-logo" aria-hidden="true">
            W
          </span>
          <strong>WOLFIE</strong>
          <em>TRADING</em>
        </div>
        <h1 id="waitlist-title">Join The Waitlist</h1>
        <div className="waitlist-rule" aria-hidden="true">
          <span />
        </div>
        <p className="waitlist-intro">
          Tell us where you fit in the pack and how Wolfie should reach you.
        </p>
        <WaitlistForm />
      </section>
    </main>
  );
}
