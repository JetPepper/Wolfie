"use client";

import { useEffect, useMemo, useState } from "react";

const bots = [
  { src: "/wolfie-shield-conservative.svg", name: "Wolfie Shield", style: "Conservative", desc: "Cautious capital protection", mode: "Fixed", amount: (capital: number) => Math.min(2500, Math.max(0, capital * 0.1)) },
  { src: "/wolfie-compass-balanced.svg", name: "Wolfie Compass", style: "Balanced", desc: "Adaptive steady allocation", mode: "Relative", amount: (capital: number) => capital * 0.25 },
  { src: "/wolfie-surge-aggressive.svg", name: "Wolfie Surge", style: "Aggressive", desc: "Fast momentum with guardrails", mode: "Fixed", amount: (capital: number) => Math.min(1500, Math.max(0, capital * 0.08)) },
  { src: "/wolfie-politician-public-disclosure.svg", name: "Public Disclosure", style: "Disclosure", desc: "Public filing follow-through", mode: "Relative", amount: (capital: number) => capital * 0.1 }
];

function dollars(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function TradingBots() {
  const [capital, setCapital] = useState(25000);

  useEffect(() => {
    const savedCapital = window.localStorage.getItem("wolfie-simulated-capital");
    if (savedCapital) {
      const parsed = Number(savedCapital);
      if (Number.isFinite(parsed) && parsed > 0) setCapital(parsed);
    }
  }, []);

  const botAllocations = useMemo(() => bots.map((bot) => ({ ...bot, allocation: bot.amount(capital) })), [capital]);
  const totalAllocated = botAllocations.reduce((sum, bot) => sum + bot.allocation, 0);

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
          <div className="eyebrow">Capital-linked allocations</div>
          <h1>Trading Bots</h1>
          <p className="lede">Bot limits now respond to the simulated trading balance set on the Overview page.</p>
          <div className="grid">
            <article className="card"><div className="label">Trading Balance</div><div className="metric">{dollars(capital)}</div><p>Edit this from Overview.</p></article>
            <article className="card"><div className="label">Allocated</div><div className="metric">{dollars(totalAllocated)}</div><p>Total assigned across active bots.</p></article>
            <article className="card"><div className="label">Available</div><div className="metric">{dollars(Math.max(0, capital - totalAllocated))}</div><p>Unallocated simulated cash.</p></article>
          </div>
          <div className="grid bot-grid">
            {botAllocations.map((bot) => (
              <article className="card" key={bot.name}>
                <div className="bot">
                  <img className="avatar" src={`/Wolfie${bot.src}`} alt={`${bot.name} avatar`} />
                  <div><strong>{bot.name}</strong><span>{bot.style}</span></div>
                </div>
                <p>{bot.desc}</p>
                <div className="label">Allocation</div>
                <div className="metric">{dollars(bot.allocation)}</div>
                <p>{bot.mode} allocation</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
