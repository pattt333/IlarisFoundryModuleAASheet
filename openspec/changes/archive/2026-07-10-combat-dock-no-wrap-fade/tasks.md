## 1. JavaScript — No-wrap window logic

- [x] 1.1 In `scripts/apps/combat-dock.js`, replace modular-arithmetic window slicing in `getData()` with bounds-checked array access: use `null` sentinel for out-of-range slots instead of `% total` wrapping
- [x] 1.2 Add `dockPos` field (`'left'` / `'center'` / `'right'`) to each combatant data entry in the 3-slot window array

## 2. Template — Placeholder and positional classes

- [x] 2.1 In `templates/apps/combat-dock.hbs`, wrap each card partial call in `{{#if combatant}}` / `{{else}}` and render an invisible placeholder div (`class="combat-dock-card dock-placeholder" aria-hidden="true"`) for `null` entries; pass `dockPos` to the card partial
- [x] 2.2 In `templates/components/combat-dock-card.hbs`, accept `dockPos` parameter and apply it as a CSS class (`dock-pos-left` / `dock-pos-center` / `dock-pos-right`) on the card wrapper div

## 3. CSS — Fade effect and placeholder

- [x] 3.1 In `styles/combat-dock.css`, add `.dock-placeholder` rule: `visibility: hidden` with same dimensions as `.combat-dock-card`
- [x] 3.2 In `styles/combat-dock.css`, add `.dock-pos-left` rule: `opacity: 0.75` + `mask-image: linear-gradient(to right, transparent 0%, black 40%)`
- [x] 3.3 In `styles/combat-dock.css`, add `.dock-pos-right` rule: `opacity: 0.75` + `mask-image: linear-gradient(to left, transparent 0%, black 40%)`
- [x] 3.4 In `styles/combat-dock.css`, ensure pre-roll state (`.pre-roll`) does not apply fade — side cards remain at full opacity
