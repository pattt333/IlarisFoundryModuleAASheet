## Why

Two regressions from the recent initiative dialog refactoring: (1) the `updateCombat` round-change hook now auto-opens PC dialogs for the GM due to the `!game.user.isGM` guard removal, and (2) the `renderCombatTracker` DOM-based button interception is fragile and doesn't reliably prevent Foundry's auto-roll — when clicking initiative buttons in encounters, the dialogs don't open and initiative is rolled directly instead.

## What Changes

- Fix the round-change hook (`updateCombat`) to only open the mass NPC dialog for the GM on round start — PC dialogs must be explicitly opened by clicking the initiative button
- Replace the fragile `renderCombatTracker` DOM button interception with a `preUpdateCombatant` hook that intercepts Foundry's auto-roll and opens the appropriate dialog instead
- Pass an `ilarisInitiativeDialog` option flag when our dialogs set initiative via `combat.setInitiative()`, so the `preUpdateCombatant` hook can distinguish our updates from Foundry's auto-roll

## Capabilities

### Modified Capabilities

- `initiative-dialog`: The trigger mechanism changes from DOM button interception to `preUpdateCombatant` hook; round-change hook no longer opens PC dialogs for GM
- `gm-initiative-orchestration`: Round-change auto-open behavior is narrowed — only NPC mass dialog opens automatically; PC dialogs require explicit button click

## Impact

- `module.js` — `updateCombat` hook: pass only NPCs to `openDialog` on round change; `renderCombatTracker` hook: removed; new `preUpdateCombatant` hook: intercept auto-roll and open dialogs
- `scripts/apps/mass-initiative-dialog.js` — `_commitAllInitiatives()`: pass `{ ilarisInitiativeDialog: true }` to `combat.setInitiative()`
- `scripts/apps/initiative-dialog.js` — `_onIniAnsagen()`: pass `{ ilarisInitiativeDialog: true }` to `combat.setInitiative()`
