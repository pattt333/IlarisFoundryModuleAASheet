# Combat Dock

## Purpose

A carousel combat tracker displaying combatants as cards at the top or bottom of the screen, replacing the visual role of Foundry's sidebar tracker with a more engaging, always-visible HUD. Uses a data window approach: only 3 cards are rendered at a time (current centered, ±1 on sides), shifted via `_windowOffset` — no CSS overflow scrolling, no `scrollBy`/`scrollTo`, no DOM measurement.

## Requirements

### Requirement: Dock auto-hides when no combat is active

The combat dock SHALL be invisible when `game.combat` is null. It SHALL become visible when a combat is started or activated.

#### Scenario: No active combat

- **WHEN** no combat is active (`game.combat === null`)
- **THEN** the dock is not rendered and occupies no screen space

#### Scenario: Combat starts

- **WHEN** a combat is started via `combatStart` hook
- **THEN** the dock renders and displays all combatants in the pre-roll state

#### Scenario: Combat ends

- **WHEN** a combat is deleted via `deleteCombat` hook
- **THEN** the dock hides and is removed from the DOM

### Requirement: Client-configurable dock position and size

The dock position SHALL be controlled by a client-scoped setting `combatDockPosition` with values `top`, `bottom`, and `none`. The dock size SHALL be controlled by a client-scoped setting `combatDockSize` with values `small` and `normal`. Each user SHALL be able to set their own preferences independently.

#### Scenario: User sets position to top

- **WHEN** a user sets `combatDockPosition` to `top` in module settings
- **THEN** the dock renders fixed to the top edge of the viewport

#### Scenario: User sets position to bottom

- **WHEN** a user sets `combatDockPosition` to `bottom` in module settings
- **THEN** the dock renders fixed to the bottom edge of the viewport

#### Scenario: User hides the dock

- **WHEN** a user sets `combatDockPosition` to `none`
- **THEN** the dock is not rendered regardless of combat state

#### Scenario: User sets size to small

- **WHEN** a user sets `combatDockSize` to `small`
- **THEN** standard cards render at approximately 80px width and the current card at approximately 110px width

#### Scenario: User sets size to normal

- **WHEN** a user sets `combatDockSize` to `normal` (default)
- **THEN** standard cards render at approximately 120px width and the current card at approximately 170px width

### Requirement: Dock renders below actor sheets

The dock SHALL use a `z-index` value lower than Foundry's application window layer so that actor sheets, dialogs, and the sidebar always render above the dock.

#### Scenario: Actor sheet opened while dock is visible

- **WHEN** a user opens an actor sheet while the combat dock is visible
- **THEN** the actor sheet renders on top of the dock and is fully interactive without obstruction

#### Scenario: Initiative dialog opened from dock button

- **WHEN** the GM clicks an INI button on a dock card
- **THEN** the resulting initiative dialog renders above the dock

### Requirement: Pre-roll state with equal-sized cards

When a new round begins and initiative has not yet been rolled for all combatants, the dock SHALL display all combatant cards at equal size with a clickable initiative button (`[🎲 INI]`) in place of the initiative number. Clicking the button SHALL open the appropriate initiative dialog.

#### Scenario: New round, initiative not rolled

- **WHEN** a new combat round starts and initiative values are null
- **THEN** all cards are rendered at equal width (approximately 120px), the current-turn highlight is absent, and each card displays `[🎲 INI]` instead of a numeric initiative value

#### Scenario: Click initiative button for a PC

- **WHEN** a player clicks the `[🎲 INI]` button on their own PC's card
- **THEN** the `InitiativeDialog` opens for that PC

#### Scenario: Click initiative button for an NPC (GM)

- **WHEN** the GM clicks the `[🎲 INI]` button on any NPC card
- **THEN** the `MassInitiativeDialog` opens for all NPC combatants

#### Scenario: Non-owner clicks initiative button

- **WHEN** a player clicks the `[🎲 INI]` button on a card for an actor they do not own
- **THEN** no dialog opens (the button is not rendered for non-owners)

### Requirement: In-combat state with enlarged current card

When initiative has been rolled and combat is in progress, the dock SHALL display the current combatant's card at a larger size (approximately 170px) with a pulse animation, while all other cards remain at a smaller size (approximately 120px). The dock SHALL use a sliding window rendering only 3 cards at a time with the current combatant centered.

#### Scenario: Turn changes to a new combatant

- **WHEN** `combatTurn` fires and a new combatant becomes active
- **THEN** the previous combatant's card shrinks to standard size and loses the pulse animation, the new current combatant's card enlarges and the pulse animation begins, and the window snaps to center the new current combatant

#### Scenario: First combatant's turn

- **WHEN** combat begins and the first combatant's initiative is rolled
- **THEN** the first combatant's card is rendered at large size with pulse animation, all other cards at standard size

### Requirement: Card content with ownership-gated LeP

Each card SHALL display: the actor's portrait image, the actor's name, the initiative value (or INI button in pre-roll state), and the announced actions for that round. The LeP (Lebenspunkte) bar SHALL only be visible to the owning player and the GM.

#### Scenario: Owner views their own card

- **WHEN** a player views the dock and looks at their own PC's card
- **THEN** the card shows portrait, name, initiative, actions, and LeP bar

#### Scenario: Non-owner views another player's card

- **WHEN** a player views the dock and looks at another player's PC card
- **THEN** the card shows portrait, name, initiative, and actions — but the LeP bar is hidden

#### Scenario: GM views any card

- **WHEN** the GM views the dock
- **THEN** all cards show portrait, name, initiative, actions, and LeP bar for every combatant

#### Scenario: Combatant has announced actions

- **WHEN** a combatant has announced actions stored in `dialogState`
- **THEN** the action names are displayed below the name on the card (e.g., "⚔️ Angriff, Zauber")

#### Scenario: Combatant has no announced actions

- **WHEN** a combatant has no actions in `dialogState`
- **THEN** the action area of the card is empty

### Requirement: Sliding window with shift buttons

The dock SHALL render only 3 combatant cards at a time (current ±1) when more than 3 combatants are present. This SHALL be implemented as a data window — only 3 entries are passed to the template context, not via CSS `overflow-x` scrolling. A `_windowOffset` tracks how far the window has shifted from the current combatant. Shift buttons SHALL appear at the left and right edges. On turn change, `_windowOffset` SHALL reset to 0, snapping the current combatant to the center position (index 1 of 3).

The window SHALL NOT wrap at the initiative list boundaries. When the first combatant in the turn order is active, the left slot SHALL render an empty placeholder instead of displaying the last combatant. When the last combatant is active, the right slot SHALL render an empty placeholder instead of displaying the first combatant. The placeholder SHALL preserve the same dimensions as a combatant card but SHALL be invisible (`visibility: hidden`) and excluded from the accessibility tree (`aria-hidden="true"`).

#### Scenario: Three or fewer combatants

- **WHEN** combat has 3 or fewer combatants
- **THEN** all cards are visible, no shift buttons appear

#### Scenario: More than three combatants

- **WHEN** combat has 8 combatants
- **THEN** the current combatant is centered between one card on each side (3 total), and shift buttons appear at both edges

#### Scenario: First combatant active

- **WHEN** the first combatant in the turn order is active and there are more than 3 combatants
- **THEN** the left slot renders an invisible placeholder, the center slot shows the active first combatant, and the right slot shows the second combatant

#### Scenario: Last combatant active

- **WHEN** the last combatant in the turn order is active and there are more than 3 combatants
- **THEN** the left slot shows the second-to-last combatant, the center slot shows the active last combatant, and the right slot renders an invisible placeholder

#### Scenario: Click shift button

- **WHEN** the user clicks the right shift button
- **THEN** the window slides by one card to the right, showing the next set of 3 combatants

#### Scenario: Turn change snaps window

- **WHEN** combat turn changes to a new combatant
- **THEN** the window snaps to center the new current combatant regardless of previous manual shifts

### Requirement: Combatant order matches Foundry's native tracker

The dock SHALL display combatants in the same order as Foundry's native combat tracker. In in-combat state, the dock SHALL iterate `combat.turns` directly — this is `Combatant[]`, an array of full Combatant document instances in canonical initiative-sorted order with Foundry's ID-based tie-breaking. It SHALL NOT be mapped or transformed (no `.map(t => t.combatantId)` — the `turns` array already contains Combatant objects, not intermediate references). In pre-roll state (no initiative values), combatants SHALL be displayed in insertion order via `combat.combatants.contents`.

#### Scenario: Initiative rolled with ties

- **WHEN** two combatants have the same initiative value
- **THEN** the dock displays them in the same order as Foundry's native tracker (using `combat.turns` which applies Foundry's ID-based tie-breaking)

#### Scenario: New round, no initiative

- **WHEN** a new round begins and initiative values are null
- **THEN** combatants are displayed in insertion order via `combat.combatants.contents`

#### Scenario: combat.turns is used directly as Combatant[]

- **WHEN** the dock resolves combatant order in in-combat state
- **THEN** `combat.turns` is iterated as-is without any `.map()` or property lookup — the array already contains Combatant document instances with `.id`, `.actor`, `.initiative`, and all other Combatant fields

### Requirement: Pulse animation on current card

The current combatant's card SHALL display a pulsing glow animation using CSS keyframes. The animation SHALL loop continuously while that combatant is the active turn.

#### Scenario: Current card pulses

- **WHEN** a combatant is the current turn
- **THEN** their card displays a CSS box-shadow pulse animation with the accent color glow, cycling between subtle and prominent glow states

#### Scenario: Turn passes

- **WHEN** the turn moves to the next combatant
- **THEN** the previous card stops pulsing and returns to standard styling

### Requirement: Progressive fade on peripheral cards

Non-current combatant cards in the carousel SHALL display a progressive fade effect based on their position relative to the active card. Cards in the left slot (position 0) SHALL render at 75% opacity with a gradient mask fading toward the left edge. Cards in the right slot (position 2) SHALL render at 75% opacity with a gradient mask fading toward the right edge. The center card (current combatant) SHALL render at full opacity with no mask, using its existing `is-current` styling (scale 1.08, pulse animation, accent border).

The gradient mask SHALL use `mask-image` with a linear gradient transitioning from transparent at the outer edge (0%) to fully opaque at 40% of the card width. The inner edge (toward the center card) SHALL remain fully opaque.

#### Scenario: Three cards visible, center active

- **WHEN** the dock displays 3 cards with the center card marked as current
- **THEN** the left card has `opacity: 0.75` and a mask fading toward its left edge, the center card has full opacity and pulse animation, and the right card has `opacity: 0.75` and a mask fading toward its right edge

#### Scenario: Placeholder slot

- **WHEN** a slot contains a placeholder (no combatant)
- **THEN** the placeholder SHALL NOT have any fade styling applied — it remains invisible via `visibility: hidden`

#### Scenario: Pre-roll state

- **WHEN** the dock is in pre-roll state (initiative not yet rolled)
- **THEN** no fade effect is applied — all cards render at full opacity (the fade only applies during active combat)

### Requirement: Visual theme consistency

The dock SHALL use the same CSS custom property variable system as the existing initiative dialogs (`--color-surface-header`, `--color-accent-primary-glow`, etc.), defined in the combined selector in `module.css`.

#### Scenario: Dock renders in light mode

- **WHEN** Foundry is in light mode
- **THEN** the dock background and card colors match the initiative dialog light theme

#### Scenario: Dock renders in dark mode

- **WHEN** Foundry is in dark mode (`body.theme-dark`)
- **THEN** the dock background and card colors match the initiative dialog dark theme

#### Scenario: No hardcoded colors

- **WHEN** inspecting the dock CSS
- **THEN** all color and shadow values reference `var(--color-*)` or `var(--overlay-*)` variables — no hardcoded `rgba()` or hex values

### Requirement: Edge cases handled gracefully

The dock SHALL handle edge cases without errors or visual breakage.

#### Scenario: Single combatant

- **WHEN** combat has only one combatant
- **THEN** a single card is rendered centered, no shift buttons appear

#### Scenario: Combatant actor is null

- **WHEN** a combatant has a null `actor` reference
- **THEN** that combatant is skipped and not rendered as a card

#### Scenario: Defeated combatant

- **WHEN** a combatant is marked as defeated
- **THEN** the card is rendered with a dimmed/greyed-out appearance

#### Scenario: Hidden combatant for non-GM

- **WHEN** a combatant is hidden and the viewing user is not a GM
- **THEN** that combatant's card is not rendered

#### Scenario: Many combatants (20+)

- **WHEN** combat has 20 or more combatants
- **THEN** the dock renders the 3-card window with shift buttons, and performance remains acceptable
