## MODIFIED Requirements

### Requirement: Mass dialog uses card grid layout

The mass initiative dialog SHALL display all NPC combatants in a 2-column CSS grid. Each NPC SHALL be rendered as a compact dashboard card containing: an identity header (portrait, name, base INI, status badge), an action section (selected action chips + picker), a modifier row (INI-Mod input, AT-Mod input, VT-Mod input), a dice section (dice count select, roll button, results), and a result display showing the calculated initiative total with a tooltip trigger for the formula breakdown. Actions SHALL be discovered from the same universal sources as the PC dialog (actor items, world items, world compendiums). When two `"einfach"` actions are selected for an NPC, -4 SHALL be automatically applied to AT and VT without a manual checkbox.

#### Scenario: Dialog opens with 5 NPCs

- **WHEN** the GM opens the mass initiative dialog with 5 NPC combatants
- **THEN** 5 cards are displayed in a 2-column grid (3 rows), all visible without scrolling

#### Scenario: Dialog opens with 6+ NPCs

- **WHEN** the GM opens the mass initiative dialog with 8 NPC combatants
- **THEN** 8 cards are displayed in a 2-column grid, and the content area scrolls to reveal all cards

#### Scenario: Two einfache actions auto-combined for NPC

- **WHEN** an NPC has two einfache actions selected
- **THEN** -4 is automatically applied to AT and VT; no manual checkbox is shown

### Requirement: Locked card collapses to essential fields

NPC cards in locked state SHALL collapse to show only: portrait, name, locked subtitle, a single non-interactive locked action chip (red-tinted, showing action name and "INI X (bezahlt)"), the INI-Mod input (editable), and the dice section (rollable). The AT-Mod input, VT-Mod input, and action picker SHALL be hidden.

#### Scenario: Locked card layout

- **WHEN** an NPC card is in locked state
- **THEN** the card is approximately half the height of a normal card, AT/VT inputs are not visible, and the locked action chip shows the action name with red tint

#### Scenario: Locked card still allows dice rolling

- **WHEN** a locked NPC card's "Würfeln" button is clicked
- **THEN** dice are rolled and the result updates, and the total initiative recalculates using carry-over logic
