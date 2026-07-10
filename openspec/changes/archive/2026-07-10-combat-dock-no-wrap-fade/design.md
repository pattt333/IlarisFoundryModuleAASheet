## Context

The combat dock renders 3 cards at a time via a sliding data window. Currently, the window uses modular arithmetic (`% total`) to wrap around the combatant list — so when the first combatant is active, the left slot shows the last combatant. In Ilaris, initiative is static across rounds (no re-roll), so this wrapping is misleading: the last combatant is not really a "previous" neighbor.

The carousel also lacks spatial depth — all 3 cards render at uniform opacity, making the current card's pulse animation the only visual differentiator.

## Goals / Non-Goals

**Goals:**
- Replace modular-arithmetic wrapping with bounded window: empty placeholder instead of wrapping
- Keep the active combatant card centered in the 3-slot layout at all times
- Add progressive fade (opacity + gradient mask) on peripheral cards for spatial depth
- Pure CSS implementation for the fade effect — no JS animation or measurement

**Non-Goals:**
- Changing the number of visible cards (stays at 3)
- Changing shift button behavior
- Changing pre-roll state behavior (no wrapping issue exists there)
- Expanding the carousel to 5 cards
- Adding scrollbar or overflow-based scrolling

## Decisions

### Decision 1: Bounds-checked window vs. disable-wrapping flag

**Chosen: Bounds-checked array access with `null` sentinel**

The current code:

```js
const start = (((currentIndex + this._windowOffset - 1) % total) + total) % total;
context.combatants = [
    allCombatants[start],
    allCombatants[(start + 1) % total],
    allCombatants[(start + 2) % total],
];
```

Replaced with:

```js
const centerIdx = currentIndex + this._windowOffset;
context.combatants = [
    centerIdx > 0          ? allCombatants[centerIdx - 1] : null,
    allCombatants[centerIdx],
    centerIdx < total - 1  ? allCombatants[centerIdx + 1] : null,
];
```

`null` entries signal the template to render a placeholder. This is simpler than a separate flag and the template already iterates an array — adding a truthiness check is minimal.

**Alternatives considered:**
- A `disableWrapping` boolean flag: More code paths, harder to reason about
- "Clamp to edge" (show same card twice): Confusing visually

### Decision 2: Placeholder rendering strategy

**Chosen: `visibility: hidden` div with same card dimensions**

The placeholder preserves flex layout space so the active card stays centered. `visibility: hidden` keeps it in the layout flow but invisible to the user. `aria-hidden="true"` excludes it from accessibility tree.

```hbs
{{#each combatants as |combatant|}}
    {{#if combatant}}
        {{> "..." dockPos=combatant.dockPos ...}}
    {{else}}
        <div class="combat-dock-card dock-placeholder" aria-hidden="true"></div>
    {{/if}}
{{/each}}
```

**Alternatives considered:**
- Omit the div entirely: Would collapse the flex layout, shifting the active card off-center
- `opacity: 0`: Same effect as visibility hidden but with transition interference
- `display: none`: Removes from layout, breaks centering

### Decision 3: Per-card positional CSS classes

**Chosen: `dock-pos-left`, `dock-pos-center`, `dock-pos-right` classes on card elements**

Each combatant data entry gets a `dockPos` field (`'left'`, `'center'`, or `'right'`) based on its array index in the 3-slot window. The template passes this to the card partial, which applies it as a CSS class. This enables position-specific styling without JS measurement or nth-child selectors.

### Decision 4: Fade implementation

**Chosen: Opacity 0.75 + `mask-image` gradient on side cards only**

```css
.combat-dock-card.dock-pos-left {
    opacity: 0.75;
    mask-image: linear-gradient(to right, transparent 0%, black 40%);
}

.combat-dock-card.dock-pos-right {
    opacity: 0.75;
    mask-image: linear-gradient(to left, transparent 0%, black 40%);
}
```

The gradient mask fades the outer edge (away from center) from transparent to opaque over 40% of the card width. The inner edge (toward center) remains fully opaque. Combined with 0.75 opacity, this creates a "cards emerging from fog" effect.

The center card retains its existing `is-current` styling (scale 1.08, pulse animation, accent border) unchanged.

**Alternatives considered:**
- Container-level mask on `.dock-carousel`: Would fade the entire container edges, not individual cards. Doesn't work well with flexbox centering.
- Only opacity (no mask): Flatter look, no directional fade
- Different opacity per distance: With only 3 cards, maximum distance is 1 step — a single value suffices

## Risks / Trade-offs

- **Shift button state at boundaries**: When the window is at boundary (first/last combatant active), the shift button pointing toward the boundary still appears. Clicking it shifts the window further — the active card moves out of center. This is existing behavior and unchanged. → No mitigation needed; user can shift back or wait for turn change to snap.
- **mask-image browser support**: `mask-image` is supported in all modern browsers (Chrome 120+, Firefox 53+, Edge 120+). Foundry VTT requires modern browsers. → Low risk.
- **Placeholder dimensions**: The placeholder inherits `.combat-dock-card` sizing but has no content. Need to ensure it doesn't collapse. → The card class has explicit `width` via `.size-normal`/`.size-small`, so dimensions are stable.
