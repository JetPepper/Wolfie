const bots = [
  ["/wolfie-shield-conservative.svg", "Wolfie Shield", "Conservative", "$2,500 fixed cap"],
  ["/wolfie-compass-balanced.svg", "Wolfie Compass", "Balanced", "25% relative cap"],
  ["/wolfie-surge-aggressive.svg", "Wolfie Surge", "Aggressive", "$1,500 surge cap"],
  ["/wolfie-politician-public-disclosure.svg", "Public Disclosure", "Politician", "Watching filings"]
];

export default function Home() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav">
          <a className="brand" href="/Wolfie/">
            <img className="logo" src="/Wolfie/wolfie-logo.svg" alt="Wolfie Logo" />
            <div>
              <div>Wolfie</div>
              <small>Trading Bot Preview</small>
            </div>
          </a>
          <div className="tabs">
            <a className="tab" href="/Wolfie/">Overview</a>
            <a className="tab" href="/Wolfie/trading-bots/">Trading Bots</a>
            <button className="tab">Simulated</button>
            <button className="tab" aria-label="Live">Live</button>
          </div>
        </nav>

        <section className="hero">
          <div className="eyebrow">Public preview connected</div>
          <h1>Wolfie is finally visible.</h1>
          <p className="lede">
            This deployed preview proves the GitHub Pages review loop is working. It uses the real Wolfie logo and bot avatar assets, avoids localhost-only review, and gives ChatGPT a URL to inspect before more UI work continues.
          </p>
          <div className="grid">
            <article className="card"><div className="label">Trading Balance</div><div className="metric">$25,000</div><p>Simulated starting capital for the current preview.</p></article>
            <article className="card"><div className="label">Available Capital</div><div className="metric">$18,500</div><p>Cash available for bots after allocations.</p></article>
            <article className="card"><div className="label">Bot Thought</div><div className="metric">Active</div><p>Wolfie signal intelligence is represented below.</p></article>
          </div>

          <div className="botrow">
            {bots.map(([src, name, style, cap]) => (
              <article className="card bot" key={name}>
                <img className="avatar" src={`/Wolfie${src}`} alt={`${name} avatar`} />
                <div><strong>{name}</strong><span>{style} · {cap}</span></div>
              </article>
            ))}
          </div>

          <section className="thought" data-testid="bot-thought-map">
            <div className="eyebrow">Bot Thought</div>
            <h2>What Wolfie is thinking</h2>
            <p className="lede">Signal nodes are staged here for review. The next pass can wire this into live app state once deployment is stable.</p>
            <i className="node" /><i className="node" /><i className="node" /><i className="node" />
          </section>
        </section>
      </div>
      <div className="ticker"><div className="ticker-inner"><span>Wolfie is scanning.</span><span>Trade activity and Bot Thought signals will appear here when available.</span><span>No fake Warren Buffett or Twinkies sample data.</span><span>Deployment preview active.</span></div></div>
    </main>
  );
}
