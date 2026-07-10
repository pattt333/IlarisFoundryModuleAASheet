## 1. Script — Add endTurn action handler

- [x] 1.1 Add `endTurn` to `DEFAULT_OPTIONS.actions` in `scripts/apps/combat-dock.js`
- [x] 1.2 Add `_canEndTurn()` private method that returns `true` if user is GM or owns the current combatant, and combat is in in-combat state (not pre-roll)
- [x] 1.3 Add `#onEndTurn` static action handler that calls `this._combat.nextTurn()` with double-click prevention (immediate disable, re-enable on next render)
- [x] 1.4 Pass `canEndTurn` to Handlebars context in `_prepareContext()`

## 2. Template — Add end-turn button to dock layout

- [x] 2.1 Add conditionally rendered button in `templates/apps/combat-dock.hbs` between the carousel container and the round badge
- [x] 2.2 Use `data-action="endTurn"` attribute for action binding
- [x] 2.3 Button shows `⏭ Zug beenden` label with Font Awesome `fa-forward-step` icon
- [x] 2.4 Button is wrapped in `{{#if canEndTurn}}` guard

## 3. Style — Style the end-turn button

- [x] 3.1 Add `.dock-end-turn-btn` styles in `styles/combat-dock.css`
- [x] 3.2 Match existing `.dock-scroll-btn` sizing and border patterns
- [x] 3.3 Use accent color (`var(--color-accent-primary)`) for background/border to distinguish as primary action
- [x] 3.4 Add hover state with slightly stronger accent

## 4. Spec — Update combat-dock spec

- [x] 4.1 Merge delta spec from `openspec/changes/combat-dock-end-turn/specs/combat-dock/spec.md` into `openspec/specs/combat-dock/spec.md`

## 5. Verification

- [ ] 5.1 Verify button visible for GM when combat is active (in-combat state)
- [ ] 5.2 Verify button visible for player when their combatant is current
- [ ] 5.3 Verify button hidden for player when another player's combatant is current
- [ ] 5.4 Verify button hidden during pre-roll
- [ ] 5.5 Verify clicking button advances turn and dock refreshes
- [ ] 5.6 Verify button works when last combatant advances to new round
