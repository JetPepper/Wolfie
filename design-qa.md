# Wolfie UI Design QA

Source visuals:
- Overview cockpit reference: `codex-clipboard-705b144b-bdef-4517-b4ea-733e9e3d4598.png`
- Deploy Bot reference: `codex-clipboard-c874f979-3c23-44e6-b6f0-3d3bda64659d.png`

Rendered target:
- `http://localhost:3000`

Checks completed:
- Overview state includes the left rail, Wolfie brand, top bot-mode action area, At A Glance cards, Next Opportunity, Latest Signal Intelligence, Recent Activity, and Open Positions.
- Deploy Bot state includes the wizard steps, capital allocation control, bot mode cards, additional settings, deployment summary, guardrails, and paper-only safety notice.
- Global truth layer still shows `SIMULATED_LIVE_MCP_LOCAL`, `PaperExchange`, real Robinhood connection false, live order submitted false, and real money at risk false.
- Browser DOM overflow check found no horizontal overflow in the rendered Overview or Deploy Bot states.
- Production build passed after implementation.

Known intentional differences:
- Icons are lightweight local glyphs rather than imported icon assets because the current frontend dependency set does not include an icon library.
- Values remain driven by existing local PaperExchange/API data or clearly local fallback display values; no live broker or real market-data path was added.

Final result: passed
