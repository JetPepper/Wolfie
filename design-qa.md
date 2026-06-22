source visual truth path: /var/folders/j9/4yxnjysn7l31hcskkr43847h0000gn/T/codex-clipboard-8a1122bf-12fd-4bad-a1bd-ce80e32e8ab6.png
implementation screenshot path: /tmp/wolfie-final-dashboard.png
additional implementation screenshot path: /tmp/wolfie-final-bots.png
viewport: 1440x940
state: Dashboard default state with no Pelosi row, custom Performance chart, plus Bots/default disclosure state with no Pelosi row.

**Full-view comparison evidence**
- Reference shows a dark trading terminal: fixed left rail, compact top header, four metric cells, ledger left, market/news right, operating brief lower left.
- Final dashboard uses the same shell, panel model, metric strip, ledger/right rail/brief composition, dark blue-black palette, cyan active states, and green gain states.
- Dashboard no longer renders a Pelosi row or Pelosi popover trigger. Disclosure content is generic by default.
- Dashboard chart is app-owned, not a clipped third-party market iframe. It supports Portfolio, Bots, and Stock performance modes with exact ticker/interval controls.
- Bots now uses the same terminal design language: roster table, KPI strip, bordered dark console, compact status pills, ticker-logo chips, and disclosure lanes.

**Focused region comparison evidence**
- Sidebar: matched fixed dark rail, WOLFIE lockup, cyan selected state, mode controls, provider status rows, status card, and operator footer.
- Metrics: matched four-cell horizontal strip, extracted reference icons, label/value hierarchy, cyan/green accents, and thin dividers.
- Dashboard ledger: matched table density, row dividers, status pills, asset identity chips, source rows, and green P&L treatment.
- Market/news panels: matched right-column panel structure, compact custom Portfolio/Bots/Stock performance chart, tabbed news header, and thumbnail rows using extracted reference assets. TradingView remains in asset-detail drawers where a single ticker is inspected.
- Bots page: extended the reference theme into the full route with table-first layout instead of old cards.

**Findings**
- No remaining P0/P1/P2 issues after fixes.
- P3: Asset-logo service responses can vary if the logo CDN is unavailable; fallback initials remain bounded and tested.

**Patches made since previous QA pass**
- Removed Pelosi from the dashboard ledger/brief and default disclosure profile row.
- Replaced the dashboard chart with a smaller custom Portfolio/Bots/Stock performance chart.
- Replaced CSS “robot head” bot avatars with actual Wolfie image assets.
- Reworked bot numeric inputs so manual entry accepts normal typing and formats/validates on blur.
- Rebuilt Bots into a terminal command center with KPI cells, roster rows, agent console, disclosure lanes, and matching controls.
- Added full-app terminal overrides for Signal Console, Activity, Settings, drawers, modals, forms, tables, filters, provider rows, strategy setup, and asset chips.
- Replaced the rejected 3D Bot Thought interface with Signal Console: bot roster, market pulse, signal stack, conflict board, trade economics, risk gate, learning memory, self-healing, and plain-English glossary panels.
- Added Agentic Runtime domain modeling and TradeCostEngine UI plumbing for fee drag, break-even, net expectancy, and small-account suitability.
- Added/cropped reference assets for news thumbnails, nav icons, metric icons, top controls, profile, and mode pulse.
- Updated responsive test expectation for the mobile nav where the large desktop brand button is hidden.

**Verification**
- Browser/IAB checked: live `http://localhost:3000/` page identity, dashboard/default no-Pelosi rows, visible interactives, custom Performance chart presence, SPY/5m exact controls, Bots interactions, image avatar dimensions, and manual numeric bot-entry behavior.
- Per-asset decode checked with `sips` on 2026-06-19 for all current local UI PNG assets: nav icons, header icons, metric icons, news thumbnails, profile avatar, and Wolfie bot avatars.
- Build checked with `corepack pnpm --dir apps/web build` on 2026-06-19.
- Visual tests checked with `corepack pnpm --dir apps/web test:visual` on 2026-06-19: 3 passed, including the full field and interaction audit.

final result: passed
