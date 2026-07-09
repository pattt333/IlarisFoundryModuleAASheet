# Mass Initiative Dashboard

## Purpose

Provide a card-grid interface for the GM to manage initiative for all NPC combatants simultaneously, with action chips, visual state indicators, batch operations, and filter controls.

## ADDED Requirements

### Requirement: Mass dialog uses card grid layout

The mass initiative dialog SHALL display all NPC combatants in a 2-column CSS grid. Each NPC SHALL be rendered as a compact dashboard card containing: an identity header (portrait, name, base INI, status badge), an action section (selected action chips + picker), a modifier row (INI-Mod, AT-Mod, VT-Mod, Kombinierte Aktion checkbox), a dice section (dice count select, roll button, results), and a result display showing the calculated initiative total with a tooltip trigger for the formula breakdown.

#### Scenario: Dialog opens with 5 NPCs

- **WHEN** the GM opens the mass initiative dialog with 5 NPC combatants
- **THEN** 5 cards are displayed in a 2-column grid (3 rows), all visible without scrolling

#### Scenario: Dialog opens with 6+ NPCs

- **WHEN** the GM opens the mass initiative dialog with 8 NPC combatants
- **THEN** 8 cards are displayed in a 2-column grid, and the content area scrolls to reveal all cards

### Requirement: Action chips with Foundry multi-select

The mass dialog SHALL use Foundry's native `<multi-select>` element for action selection, showing all 10+ available actions with checkboxes. Selected actions SHALL be displayed as compact horizontal chips alongside the multi-select, showing the action icon, name, and INI cost. Each chip SHALL have a remove ✕ button that unchecks the corresponding item in the multi-select. The multi-select SHALL be disabled when 2 actions are already selected. A maximum of 2 actions SHALL be selectable per NPC.

#### Scenario: No actions selected

- **WHEN** an NPC card has no actions selected
- **THEN** the card shows the `<multi-select>` dropdown (enabled) and no action chips

#### Scenario: One action selected

- **WHEN** the GM selects "Angriff" via the multi-select for an NPC
- **THEN** a chip with the action icon, "Angriff", INI cost "-4", and a remove ✕ button appears alongside the multi-select; the multi-select remains enabled

#### Scenario: Two actions selected

- **WHEN** the GM selects a second action via the multi-select after already having one
- **THEN** both action chips are visible, and the multi-select becomes disabled (grayed out, not clickable)

#### Scenario: Remove action via chip

- **WHEN** the GM clicks the ✕ on an action chip
- **THEN** that action is unchecked in the multi-select, the chip is removed, and the multi-select becomes enabled again

#### Scenario: Attempt to select third action

- **WHEN** the GM has 2 actions selected and the multi-select is disabled
- **THEN** no additional items can be checked; the multi-select appears muted

### Requirement: Card shows result with hover tooltip

Each NPC card SHALL display the calculated initiative total as a single large number, color-coded: accent color for positive, danger color for negative, muted for unknown. An info icon (🛈) adjacent to the result SHALL trigger a tooltip on hover showing the full formula breakdown: Basis-INI, Aktion(smodule), INI-Modifikator, Würfel, and AT/VT summaries.

#### Scenario: Result with complete formula

- **WHEN** an NPC has baseIni=12, selected "Angriff" (-4 INI), iniMod=+1, diceResult=3
- **THEN** the card shows "11" in accent color, and hovering the 🛈 icon shows: "12 Basis-INI / -4 Aktion (Angriff) / +1 INI-Mod / +3 Würfel = 11" plus AT and VT summaries

#### Scenario: Result without dice

- **WHEN** an NPC has baseIni=10, selected "Bewegen" (-2 INI), iniMod=0, and no dice rolled
- **THEN** the card shows "?" in muted color, and the tooltip shows the partial formula with "?" for the dice value

#### Scenario: Result in locked state

- **WHEN** a locked NPC has carryOver=-3, baseIni=14, iniMod=+0, diceResult=5
- **THEN** the card shows "16" in accent color, and the tooltip shows: "-3 Übertrag / 14 Basis-INI / +0 INI-Mod / +5 Würfel = 16"

### Requirement: Card visual states

Each NPC card SHALL display a visual state indicator based on its processing status. Rolled and complete NPCs SHALL show a ✓ checkmark (green). NPCs with 2 dice rolled but none selected SHALL show a ⚠ warning icon (amber) with an amber-tinted card border and a pulsing highlight on the unselected dice. Locked NPCs (negative INI from previous round) SHALL show a 🔒 lock icon (red) with a red-tinted card border, subtle red background, and a subtitle "⏱️ Verzögert — X. Runde". Unprocessed NPCs SHALL show no badge.

#### Scenario: NPC is rolled and complete

- **WHEN** an NPC has rolled 1 die (or 2 dice with one selected)
- **THEN** the card header shows a green ✓ checkmark badge

#### Scenario: NPC has 2 dice but none selected

- **WHEN** an NPC has rolled 2 dice and neither is selected
- **THEN** the card header shows an amber ⚠ badge, the card border is amber, and both dice faces are visible

#### Scenario: NPC is locked from previous round

- **WHEN** an NPC has `movedAction: true` with `movedActionRounds: 2`
- **THEN** the card shows a red 🔒 badge, red-tinted border, red-tinted background, subtitle "⏱️ Verzögert — 2. Runde", and collapsed layout

### Requirement: Locked card collapses to essential fields

NPC cards in locked state SHALL collapse to show only: portrait, name, locked subtitle, a single non-interactive locked action chip (red-tinted, showing action name and "INI X (bezahlt)"), the INI-Mod input (editable), and the dice section (rollable). The AT-Mod input, VT-Mod input, Kombinierte Aktion checkbox, and action picker SHALL be hidden.

#### Scenario: Locked card layout

- **WHEN** an NPC card is in locked state
- **THEN** the card is approximately half the height of a normal card, AT/VT inputs and Kombiniert checkbox are not visible, and the locked action chip shows the action name with red tint

#### Scenario: Locked card still allows dice rolling

- **WHEN** a locked NPC card's "Würfeln" button is clicked
- **THEN** dice are rolled and the result updates, and the total initiative recalculates using carry-over logic

### Requirement: "Würfel alle" skips already-rolled NPCs

The "Würfel alle" button SHALL iterate all NPC cards and roll dice only for those where `hasRolled === false`. NPCs that have already rolled SHALL be skipped. After rolling, each affected card SHALL update its dice display, status badge, and result in-place.

#### Scenario: Some NPCs already rolled

- **WHEN** 3 of 5 NPCs have already rolled dice and the GM clicks "Würfel alle"
- **THEN** only the 2 unrolled NPCs get dice rolled; the 3 already-rolled NPCs are unchanged

#### Scenario: All NPCs already rolled

- **WHEN** all NPCs have rolled dice and the GM clicks "Würfel alle"
- **THEN** no dice are rolled, and all cards remain unchanged

### Requirement: "INI ansagen" warns for unprocessed NPCs

When the GM clicks "INI ansagen" and one or more NPCs have not rolled dice, a confirmation dialog SHALL appear: "X NPCs haben noch nicht gewürfelt." with buttons "Fehlende würfeln" (rolls dice for missing NPCs, then proceeds) and "Trotzdem fortsetzen" (proceeds without dice, setting base INI only). If all NPCs are processed or the GM chooses to proceed, the dialog SHALL commit all initiatives, create ActiveEffects, post a summary chat message, and close.

#### Scenario: Some NPCs unprocessed

- **WHEN** the GM clicks "INI ansagen" with 2 of 5 NPCs not having rolled
- **THEN** a dialog appears: "2 NPCs haben noch nicht gewürfelt." with "Fehlende würfeln" and "Trotzdem fortsetzen" options

#### Scenario: GM chooses "Fehlende würfeln"

- **WHEN** the GM clicks "Fehlende würfeln" on the warning dialog
- **THEN** dice are rolled for the 2 missing NPCs, all initiatives are committed, and the dialog closes

#### Scenario: All NPCs processed

- **WHEN** all NPCs have rolled dice (1 die or 2 with selection) and the GM clicks "INI ansagen"
- **THEN** no warning appears, all initiatives are committed immediately

### Requirement: Cancel discards unsaved changes

The "Abbrechen" button and dialog close (X button) SHALL discard all changes made during the current session. State SHALL only be persisted to actor flags when "INI ansagen" commits. On next dialog open, NPCs SHALL load their last committed state (from the previous "INI ansagen" call), not any discarded intermediate changes.

#### Scenario: GM sets modifiers and cancels

- **WHEN** the GM sets iniMod=3 on an NPC and clicks "Abbrechen"
- **THEN** the dialog closes without saving, and reopening the dialog shows iniMod=0 (the last committed value)

#### Scenario: GM commits and reopens

- **WHEN** the GM sets iniMod=3 on an NPC, clicks "INI ansagen", and reopens the dialog
- **THEN** the NPC's card shows iniMod=3 from the persisted state

### Requirement: Chat output is a single summary message

When "INI ansagen" commits, the dialog SHALL post exactly one ChatMessage containing a summary table of all processed NPC initiatives. The message SHALL include: the round number, and for each NPC: name, final initiative value, and a compact formula (Basis + Aktion + Mod + Würfel). Locked NPCs SHALL show a 🔒 indicator.

#### Scenario: Summary message for 5 NPCs

- **WHEN** "INI ansagen" commits for 5 NPCs
- **THEN** exactly 1 ChatMessage is posted with all 5 NPC results in a table

#### Scenario: Summary message includes locked indicator

- **WHEN** one NPC is in locked state
- **THEN** that NPC's row in the summary message shows a 🔒 icon

### Requirement: Cards ordered alphabetically by name

NPC cards in the grid SHALL be sorted alphabetically by `actor.name` (ascending, locale-aware). Card order SHALL remain stable regardless of initiative values, dice results, or processing status.

#### Scenario: Cards in alphabetical order

- **WHEN** the dialog opens with NPCs named "Ork", "Goblin", "Zombie"
- **THEN** cards appear in order: Goblin, Ork, Zombie

### Requirement: Filter toggle for unprocessed NPCs

A "Nur unbearbeitete" checkbox in the dialog header SHALL toggle visibility of cards. When checked, only unprocessed NPCs (no dice rolled, or 2 dice without selection) SHALL be visible plus locked NPCs that still need dice rolled. Processed NPCs SHALL be hidden with `display: none`. A world setting `ilaris-alternative-actor-sheet.massInitiativeFilterDefault` (Boolean, default: false) SHALL control the default state of this toggle.

#### Scenario: Filter enabled with mixed states

- **WHEN** 3 of 5 NPCs are processed and the filter is enabled
- **THEN** only the 2 unprocessed NPC cards are visible

#### Scenario: World setting controls default

- **WHEN** the world setting `massInitiativeFilterDefault` is true
- **THEN** the filter checkbox is checked by default when the dialog opens

### Requirement: Batch action quick-set

A master action dropdown in the dialog header SHALL allow the GM to select an action and apply it to all NPCs via an "Auf alle anwenden" button. The action SHALL be added to every NPC card that has fewer than 2 actions selected and doesn't already have that action. Cards with 2 actions already selected SHALL be skipped (not overwritten).

#### Scenario: Apply action to all NPCs

- **WHEN** the GM selects "Angriff" from the master dropdown and clicks "Auf alle anwenden"
- **THEN** every NPC with fewer than 2 actions gets "Angriff" added as a selected action chip

#### Scenario: Skip NPCs with 2 actions

- **WHEN** one NPC already has 2 actions and the GM batch-applies "Angriff"
- **THEN** that NPC's actions are unchanged (still has its original 2 actions)

#### Scenario: Skip NPCs that already have the action

- **WHEN** an NPC already has "Angriff" selected and the GM batch-applies "Angriff"
- **THEN** that NPC is skipped (no duplicate chip)
