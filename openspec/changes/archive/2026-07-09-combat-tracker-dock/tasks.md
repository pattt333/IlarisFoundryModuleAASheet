## 1. Module Registration & Settings

- [x] 1.1 Register `combatDockPosition` client-scoped setting in `module.js` (top/bottom/none, default bottom)
- [x] 1.2 Register `combatDockSize` client-scoped setting in `module.js` (small/normal, default normal)
- [x] 1.3 Add `styles/combat-dock.css` to the `styles` array in `module.json`
- [x] 1.4 Preload `templates/apps/combat-dock.hbs` and `templates/components/combat-dock-card.hbs` in `module.js` `init` hook
- [x] 1.5 Export `CombatDockApp` from `scripts/apps/index.js`

## 2. Template: Card Partial

- [x] 2.1 Create `templates/components/combat-dock-card.hbs` with portrait, name, initiative/button, actions, and LeP bar sections
- [x] 2.2 Implement conditional rendering: `[🎲 INI]` button when `initiative` is null, numeric value otherwise
- [x] 2.3 Gate LeP bar rendering on ownership (`isOwner` or `isGM`)
- [x] 2.4 Render action names from `actions` array (icon + name)
- [x] 2.5 Add `.is-current` and `.is-defeated` conditional CSS classes

## 3. Template: Dock Shell

- [x] 3.1 Create `templates/apps/combat-dock.hbs` with round badge, carousel container, and scroll buttons
- [x] 3.2 Add `.pre-roll` vs `.in-combat` class on root element based on initiative state
- [x] 3.3 Add `.position-top` / `.position-bottom` class based on `combatDockPosition` setting, and `.size-small` / `.size-normal` class based on `combatDockSize` setting
- [x] 3.4 Render combatant cards using the card partial, passing ownership and state data
- [x] 3.5 Show scroll buttons conditionally (`hasOverflow` boolean, hide when ≤5 combatants)
- [x] 3.6 Use `{{#each}}` to iterate combatants, `{{>}}` for card partial

## 4. Styles: Combat Dock CSS

- [x] 4.1 Create `styles/combat-dock.css` with fixed positioning, flexbox carousel layout
- [x] 4.2 Define `.position-top` (top: 0) and `.position-bottom` (bottom: 0) position variants
- [x] 4.3 Style standard cards: normal size at 120px width, small size at 80px width
- [x] 4.4 Style `.is-current` card: normal size at 170px width, small size at 110px width, with scale transform and accent border
- [x] 4.5 Define `@keyframes ilaris-combat-pulse` for box-shadow glow animation on current card
- [x] 4.6 Style `.is-defeated` with dimmed/opacity and strikethrough
- [x] 4.7 Style scroll buttons (left/right arrows, positioned at carousel edges)
- [x] 4.8 Style round badge (compact pill in dock header area)
- [x] 4.9 Style `[🎲 INI]` button to match initiative dialog button aesthetics
- [x] 4.10 Use CSS custom properties (`var(--color-*)`, `var(--overlay-*)`) — no hardcoded colors
- [x] 4.11 Set dock `z-index` to a value (30-50 range) below Foundry's application window layer but above the canvas
- [x] 4.12 Add `.ilaris-combat-dock` to the combined CSS variable selector in `styles/module.css`

## 5. Script: CombatDockApp Class

- [x] 5.1 Create `scripts/apps/combat-dock.js` with `CombatDockApp` extending `Application`
- [x] 5.2 Define `defaultOptions`: id, classes, template path, `popOut: false`
- [x] 5.3 Implement `getData()`: read `game.combat`, build combatant data array with ownership checks, action resolution, LeP values
- [x] 5.4 Implement `_isPreRoll()`: return true if any combatant has null initiative
- [x] 5.5 Implement `_resolveActions(actor)`: read `dialogState` flag, resolve action names via `InitiativeStateManager.loadAvailableActions()`
- [x] 5.6 Implement `_getLepData(actor)`: read `system.gesundheit.hp.value` and `system.gesundheit.hp.max`, return null if not an Ilaris actor
- [x] 5.7 Implement `activateListeners()`: bind click handlers for INI buttons and scroll buttons
- [x] 5.8 Implement INI button click handler: call `InitiativeDialogManager.openDialog()` for PC, `new MassInitiativeDialog()` for NPC (GM only)
- [x] 5.9 Implement scroll button handlers: shift visible window by one card using `scrollBy` on carousel element
- [x] 5.10 Implement `_scrollToCurrent()`: auto-scroll carousel to center the `.is-current` card on turn change
- [x] 5.11 Implement `_updatePosition()`: read `combatDockPosition` setting, toggle `.position-top`/`.position-bottom` class on root element
- [x] 5.12 Implement `_updateSize()`: read `combatDockSize` setting, toggle `.size-small`/`.size-normal` class on root element
- [x] 5.13 Pass `dockPosition` and `dockSize` to template context in `getData()`

## 6. Module Integration: Hooks

- [x] 6.1 Add `updateCombatant` hook: re-render dock when initiative values change (transition from pre-roll to in-combat)
- [x] 6.2 Extend `updateCombat` hook: call dock re-render when round or turn changes, then call `_scrollToCurrent()`
- [x] 6.3 Add `combatTurn` hook: trigger `_scrollToCurrent()` for smooth scroll animation on turn change
- [x] 6.4 Add `deleteCombat` hook: close dock when combat ends
- [x] 6.5 Wire dock singleton: create instance in module scope, reuse across hook calls, close when combat ends
- [x] 6.6 Guard all hook handlers: skip if `combatDockPosition` is `none`, skip if `game.combat` is null
- [x] 6.7 Call `_updateSize()` on dock render to apply user's size preference

## 7. Polish & Edge Cases

- [x] 7.1 Handle single combatant: full-width centered card, no scroll buttons
- [x] 7.2 Handle null actor: skip combatant in card rendering
- [x] 7.3 Handle defeated combatants: apply `.is-defeated` class, dim appearance
- [x] 7.4 Handle hidden combatants: skip for non-GM users
- [x] 7.5 Handle non-Ilaris actors: show portrait + name + INI only (no LeP bar, no actions)
- [x] 7.6 Handle combatant with no `dialogState`: show empty actions area
- [x] 7.7 Test with 20+ combatants: verify only 5 cards render in DOM, scroll buttons work correctly
- [x] 7.8 Verify dark mode: dock renders correctly with `body.theme-dark` class
- [x] 7.9 Run `npm run lint` and `npm run prettier` on all new files
