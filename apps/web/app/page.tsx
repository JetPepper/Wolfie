"use client";

import { useEffect, useMemo, useState } from "react";

const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

const botModels = [
  {
    src: "/wolfie-shield-conservative.svg",
    name: "Wolfie Shield",
    style: "Conservative",
    mode: "Fixed",
    amount: (capital: number) => Math.min(2500, Math.max(0, capital * 0.1)),
    note: "Capital protection and calmer entries"
  },
  {
    src: "/wolfie-compass-balanced.svg",
    name: "Wolfie Compass",
    style: "Balanced",
    mode: "Relative",
    amount: (capital: number) => capital * 0.25,
    note: "Steady allocation across stronger signals"
  },
  {
    src: "/wolfie-surge-aggressive.svg",
    name: "Wolfie Surge",
    style: "Aggressive",
    mode: "Fixed",
    amount: (capital: number) => Math.min(1500, Math.max(0, capital * 0.08)),
    note: "Momentum entries with tighter limits"
  },
  {
    src: "/wolfie-politician-public-disclosure.svg",
    name: "Public Disclosure",
    style: "Politician",
    mode: "Relative",
    amount: (capital: number) => capital * 0.1,
    note: "Tracks public filing follow-through"
  }
];

function dollars(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function Home() {
  const [capital, setCapital] = useState(25000);
  const [draftCapital, setDraftCapital] = useState("25000");
  const [hasChosenCapital, setHasChosenCapital] = useState(false);
  const [showCapitalEditor, setShowCapitalEditor] = useState(false);
  const [liveSelected, setLiveSelected] = useState(false);

  useEffect(() => {
    const savedCapital = window.localStorage.getItem("wolfie-simulated-capital");
    const savedChoice = window.localStorage.getItem("wolfie-capital-ready");
    if (savedCapital) {
      const parsed = Number(savedCapital);
      if (Number.isFinite(parsed) && parsed > 0) {
        setCapital(parsed);
        setDraftCapital(String(parsed));
      }
    }
    if (savedChoice === "true") setHasChosenCapital(true);
  }, []);

  const allocations = useMemo(() => botModels.map((bot) => ({ ...bot, allocation: bot.amount(capital) })), [capital]);
  const allocatedCapital = allocations.reduce((sum, bot) => sum + bot.allocation, 0);
  const availableCapital = Math.max(0, capital - allocatedCapital);

  function saveCapital() {
    const next = Math.max(100, Math.round(Number(draftCapital) || 0));
    setCapital(next);
    setDraftCapital(String(next));
    setHasChosenCapital(true);
    setShowCapitalEditor(false);
    window.localStorage.setItem("wolfie-simulated-capital", String(next));
    window.localStorage.setItem("wolfie-capital-ready", "true");
  }

  return (
    <main className="page">
      {(!hasChosenCapital || showCapitalEditor) && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="capital-title">
          <section className="capital-modal">
            <div className="eyebrow">Simulated capital</div>
            <h2 id="capital-title">How much do you want Wolfie to trade with?</h2>
            <p className="lede compact">This sets the simulated trading balance, available capital, and bot allocations across Wolfie.</p>
            <div className="amount-row">
              {quickAmounts.map((amount) => (
                <button className="amount-chip" key={amount} onClick={() => setDraftCapital(String(amount))}>
                  {dollars(amount)}
                </button>
              ))}
            </div>
            <label className="input-label" htmlFor="capital-input">Custom amount</label>
            <input
              id="capital-input"
              className="capital-input"
              inputMode="numeric"
              value={draftCapital}
              onChange={(event) => setDraftCapital(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="25000"
            />
            <div className="modal-actions">
              {hasChosenCapital && <button className="tab" onClick={() => setShowCapitalEditor(false)}>Cancel</button>}
              <button className="primary" onClick={saveCapital}>Set trading balance</button>
            </div>
          </section>
        </div>
      )}

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
            <div className="mode-toggle" aria-label="Trading mode">
              <button className={!liveSelected ? "mode active" : "mode"} onClick={() => setLiveSelected(false)}>Simulated</button>
              <button className={liveSelected ? "mode active" : "mode"} onClick={() => setLiveSelected(true)}>Live</button>
            </div>
          </div>
        </nav>

        {liveSelected && <div className="warning">Live trading setup is not connected yet. Wolfie is staying in review mode.</div>}

        <section className="hero overview-hero">
          <div className="hero-copy">
            <div className="eyebrow">Capital-aware review</div>
            <h1>Wolfie is ready to size the simulation.</h1>
            <p className="lede">
              Choose the trading balance once, then Wolfie recalculates available capital and bot allocation totals across the dashboard.
            </p>
          </div>

          <div className="capital-card">
            <div className="label">Trading Balance</div>
            <div className="metric">{dollars(capital)}</div>
            <p>Simulated capital available for Wolfie to manage.</p>
            <button className="primary" onClick={() => setShowCapitalEditor(true)}>Edit Capital</button>
          </div>

          <div className="grid">
            <article className="card"><div className="label">Available Capital</div><div className="metric">{dollars(availableCapital)}</div><p>Unallocated cash after bot limits.</p></article>
            <article className="card"><div className="label">Allocated to Bots</div><div className="metric">{dollars(allocatedCapital)}</div><p>Total capital currently assigned.</p></article>
            <article className="card"><div className="label">Bot Thought</div><div className="metric">Active</div><p>Signal intelligence is visible below.</p></article>
          </div>

          <section className="thought thought-prominent" data-testid="bot-thought-map">
            <div>
              <div className="eyebrow">Bot Thought</div>
              <h2>What Wolfie is thinking</h2>
              <p className="lede compact">Signal nodes are staged for review while real data connections are wired.</p>
              <div className="latest-thoughts">
                <strong>Latest Thoughts</strong>
                <span>Watching allocation drift after capital change.</span>
                <span>Waiting for verified market activity.</span>
                <span>Ready to compare bot confidence once feeds are connected.</span>
              </div>
            </div>
            <div className="mindmap" aria-hidden="true">
              <i className="node" /><i className="node" /><i className="node" /><i className="node" />
              <b className="core-node">CORE</b>
            </div>
          </section>

          <div className="botrow">
            {allocations.map((bot) => (
              <article className="card bot" key={bot.name}>
                <img className="avatar" src={`/Wolfie${bot.src}`} alt={`${bot.name} avatar`} />
                <div><strong>{bot.name}</strong><span>{bot.style} · {bot.mode} · {dollars(bot.allocation)}</span></div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className="ticker"><div className="ticker-inner"><span>Wolfie is scanning.</span><span>Trade activity and Bot Thought signals will appear here when available.</span><span>Deployment preview active.</span><span>Simulated capital can be edited anytime.</span></div></div>
    </main>
  );
}
