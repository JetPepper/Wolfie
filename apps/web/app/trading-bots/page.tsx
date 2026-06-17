const bots = [
  ["/wolfie-shield-conservative.svg", "Wolfie Shield", "Conservative", "Cautious capital protection", "$2,500"],
  ["/wolfie-compass-balanced.svg", "Wolfie Compass", "Balanced", "Adaptive steady allocation", "25%"],
  ["/wolfie-surge-aggressive.svg", "Wolfie Surge", "Aggressive", "Fast momentum with guardrails", "$1,500"],
  ["/wolfie-politician-public-disclosure.svg", "Public Disclosure", "Politician", "Public filing follow-through", "Watching"]
];

export default function TradingBots() {
  return (
    <main className="page">
      <div className="shell">
        <nav className="nav">
          <a className="brand" href="/Wolfie/">
            <img className="logo" src="/Wolfie/wolfie-logo.svg" alt="Wolfie Logo" />
            <div><div>Wolfie</div><small>Trading Bots</small></div>
          </a>
          <div className="tabs"><a className="tab" href="/Wolfie/">Overview</a><a className="tab" href="/Wolfie/trading-bots/">Trading Bots</a></div>
        </nav>
        <section className="hero">
          <div className="eyebrow">Real avatar assets</div>
          <h1>Trading Bots</h1>
          <p className="lede">This preview uses actual Wolfie SVG avatars instead of initials. Allocation controls are staged visually so the deployed URL can be reviewed before deeper wiring continues.</p>
          <div className="grid">
            {bots.map(([src, name, style, desc, cap]) => (
              <article className="card" key={name}>
                <div className="bot">
                  <img className="avatar" src={`/Wolfie${src}`} alt={`${name} avatar`} />
                  <div><strong>{name}</strong><span>{style}</span></div>
                </div>
                <p>{desc}</p>
                <div className="label">Allocation</div>
                <div className="metric">{cap}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
