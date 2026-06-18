# Wolfie Design QA

Final result: passed

Reference: `/Users/brycereed/Desktop/3d reference.png`

Prototype captures:
- `artifacts/dashboard-desktop.png`
- `artifacts/dashboard-mobile.png`
- `artifacts/dashboard-live-lock.png`

Checks completed:
- Overview is a real dashboard with left-side navigation categories: Overview, Trading Bots, Signal Intelligence, Activity, and Settings.
- Dashboard cards behave as controls and open context-specific detail drawers for Trading Balance, Buying Power, Allocated to Bots, Net P/L, Active Thoughts, and Top Confidence.
- Trading Bot cards open bot detail context and use animated character wrappers around the avatar assets.
- Trading Bots now includes a refined character hero, evasive hover behavior for robot avatars, and smaller disclosure micro-bots.
- Public-disclosure politician-return bots are present but locked to `UNKNOWN` until verified STOCK Act disclosure fixtures and return methodology exist.
- Signal-only controls no longer overlap dashboard or bot-page content.
- Settings capital editing saves formatted currency values.
- Activity opens the thought timeline and audit-trail view.
- Signal Intelligence keeps the interactive Three.js/WebGL thought field with orbit controls, raycast node selection, moving thought bodies, and emerging/dying particles.
- Stock references include ticker identity and company logo where a logo source exists in the local fixture.
- Wolfie logo/avatar treatments now sit on a bright white/gray full-moon disc across the app shell, onboarding, and bot character surfaces.
- App logo instances now use the supplied `wolfie-logo.png` asset.
- Metallic panels use sharper line work, more restrained highlights, and deeper drop shadows.
- Mobile viewport no longer clips card text into vertical columns.
- Live mode remains locked and does not enable live trading.
- Production build passed.
- Browser visual tests passed: `2 passed`.

Known limitations:
- The intro audio is a local synthesized Web Audio cue. It does not copy or embed audio from the referenced YouTube short.
- Bot avatars use the current local SVG asset set with animated character treatment. Fully bespoke rendered robot characters remain future art direction work.
