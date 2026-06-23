import Link from "next/link";

const features = [
  "Agentic Intelligence",
  "Self-Healing By Design",
  "User Authority Always",
  "Local-First By Design",
  "Enterprise-grade by design"
];

export default function Home() {
  return (
    <main className="public-page landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="eyebrow">Wolfie Trading</p>
          <h1 id="landing-title">
            The first commercial Agentic Trade platform specifically for RobinHood Trading
          </h1>
          <p className="support-line">Build the agents. Set the rules. Let Wolfie hunt.</p>
          <p className="body-copy">
            Design, configure, and deploy intelligent trading agents that analyze real-world signals and
            execute with discipline under your authority.
          </p>
          <Link className="primary-link" href="/waitlist">
            Join The Waitlist
          </Link>
        </div>

        <div className="laptop-visual" aria-label="Wolfie trading dashboard visual">
          <div className="laptop-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="dashboard-grid">
            <section className="dashboard-panel signal-panel">
              <p>Agent Signal</p>
              <strong>Discipline Active</strong>
              <div className="signal-lines">
                <span />
                <span />
                <span />
              </div>
            </section>
            <section className="dashboard-panel">
              <p>Authority</p>
              <strong>User governed</strong>
            </section>
            <section className="dashboard-panel">
              <p>Runtime</p>
              <strong>Local-first</strong>
            </section>
            <section className="dashboard-panel wide-panel">
              <p>Execution Rules</p>
              <div className="rule-row">
                <span>Risk</span>
                <b>Bounded</b>
              </div>
              <div className="rule-row">
                <span>Broker action</span>
                <b>Authorized</b>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="Wolfie feature highlights">
        {features.map((feature) => (
          <article key={feature}>
            <span />
            <p>{feature}</p>
          </article>
        ))}
      </section>

      <p className="robinhood-disclaimer">
        Robinhood is a registered trademark of Robinhood Markets, Inc. Wolfie Trading is not affiliated
        with, sponsored by, endorsed by, or otherwise associated with Robinhood Markets, Inc. or any of
        its affiliates.
      </p>
    </main>
  );
}
