# Plan: Schips (Schicksalspunkte) Display Feature

Add an interactive fate points display below secondary stats in the same style as existing profile stats. Display shows clover icon, "Schips" label, current/max value (e.g., "3 / 5"), plus button to increment, and minus button to decrement. Buttons modify current Schips value between 0 and calculated maximum.

## Steps

1. **Add Schips display template** in [alternative-actor-sheet.hbs](templates/sheets/alternative-actor-sheet.hbs#L82) directly below `profile-secondary-stats` closing div - create new div with same structure as `profile-stat`, include `fa-clover` icon, "Schips" label, value display showing `{{actor.system.schips.schips_stern}} / {{actor.system.schips.schips}}`, minus button with `fa-minus` icon and `data-action="decrease"`, plus button with `fa-plus` icon and `data-action="increase"`

2. **Style the Schips stat** in [styles/module.css](styles/module.css) - create `.schips-stat` following existing `.profile-stat` pattern, style increment/decrement buttons with appropriate sizing, colors, hover states, ensure responsive layout that matches secondary stats appearance

3. **Implement increment/decrement handlers** in [alternative-actor-sheet.js](scripts/sheets/alternative-actor-sheet.js) - create `_onSchipIncrease` method that increments current Schips by 1 (max: `system.schips.schips`), create `_onSchipDecrease` method that decrements by 1 (min: 0), both update via `this.actor.update({'system.schips.schips_stern': newValue})`

4. **Register event listeners** in [alternative-actor-sheet.js](scripts/sheets/alternative-actor-sheet.js) `activateListeners()` - add `html.find('.schips-stat .schip-decrease').click(this._onSchipDecrease.bind(this))` and `html.find('.schips-stat .schip-increase').click(this._onSchipIncrease.bind(this))` within `if (this.isEditable)` block

## Further Considerations

None - feature is well-defined and ready for implementation.
