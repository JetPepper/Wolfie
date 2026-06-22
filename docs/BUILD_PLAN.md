# Build Plan

## Current Pass

Implement and verify Wolfie's Agentic Bot Runtime, Signal Console, and TradeCostEngine as the active app direction.

## Required Workstreams

1. Replace old Bot Thought / 3D / force graph primary UI with Signal Console.
2. Centralize fee and friction math in TradeCostEngine.
3. Add domain objects for signals, presets, decision frames, risk gates, memory, and self-healing.
4. Render decision frames from bot presets and acquisition-ladder source freshness.
5. Ensure small-account protection blocks uneconomic churn.
6. Keep Bots, disclosure workspaces, custom bot builder, settings, and dashboard interactions functional.
7. Update docs and tests to match the new direction.

## Verification Plan

Run:

```bash
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web test:visual
```

Run lint after ESLint config is added. The current `next lint` script prompts for setup and is not a non-interactive check.

## Future Work

- Connect authorized market-data, news, SEC, FINRA, and social-source adapters.
- Persist decision frames and learning memory beyond local UI state.
- Add authorized live broker execution only after explicit compliance, account authorization, order-routing, and audit-log work is implemented.
- Add a non-interactive ESLint configuration.
