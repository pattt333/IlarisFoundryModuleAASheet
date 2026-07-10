## MODIFIED Requirements

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

## ADDED Requirements

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
