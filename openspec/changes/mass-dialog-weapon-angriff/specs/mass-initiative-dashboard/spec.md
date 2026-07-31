## ADDED Requirements

### Requirement: Cards show weapon/Angriff dropdown

Each NPC card SHALL include a compact dropdown row between the action section and the modifier row, labeled with a ⚔️ icon. The dropdown SHALL list available weapons (for held actors) or angriffe (for kreatur actors). The selected value SHALL be persisted as `selectedWeaponId` in the actor's `dialogState` flag.

#### Scenario: NPC card with weapon dropdown

- **WHEN** the mass dialog renders an NPC card for a kreatur with 2 angriffe
- **THEN** a dropdown labeled "⚔️" appears between the action chips and the modifier row, listing both angriffe and "keine Waffe"

#### Scenario: Weapon selection persists across reopens

- **WHEN** the GM selects an Angriff, closes the dialog, and reopens it
- **THEN** the previously selected Angriff is still selected

## MODIFIED Requirements

### Requirement: Action chips with Foundry multi-select

The mass dialog SHALL use Foundry's native `<multi-select>` element for action selection, showing all 10+ available actions with checkboxes. Actions that are incompatible with the selected weapon/Angriff SHALL be grayed out with a descriptive tooltip (e.g., "Erfordert Nahkampfwaffe"). Selected actions SHALL be displayed as compact horizontal chips alongside the multi-select, showing the action icon, name, and INI cost. Each chip SHALL have a remove ✕ button that unchecks the corresponding item in the multi-select. The multi-select SHALL be disabled when 2 actions are already selected. A maximum of 2 actions SHALL be selectable per NPC.

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

#### Scenario: Gated action in multi-select

- **WHEN** an NPC has a Fernkampfwaffe selected and the action requires nahkampfwaffe
- **THEN** that action is grayed out in the multi-select and cannot be selected

### Requirement: Card shows result with hover tooltip

Each NPC card SHALL display the calculated initiative total as a single large number, color-coded: accent color for positive, danger color for negative, muted for unknown. An info icon (🛈) adjacent to the result SHALL trigger a tooltip on hover showing the full formula breakdown: Basis-INI, Aktion(smodule), Waffe (if a weapon is selected and an action requires it), INI-Modifikator, Würfel, and AT/VT summaries.

#### Scenario: Result with complete formula including weapon

- **WHEN** an NPC has baseIni=12, selected "Angriff" (-4 INI, requires nahkampfwaffe), weapon with INI -2, iniMod=+1, diceResult=3
- **THEN** the card shows "9" in accent color, and the tooltip shows: "12 Basis-INI / -4 Aktion (Angriff) / -2 Waffe / +1 INI-Mod / +3 Würfel = 9"

#### Scenario: Result without dice

- **WHEN** an NPC has baseIni=10, selected "Bewegen" (-2 INI), iniMod=0, and no dice rolled
- **THEN** the card shows "?" in muted color, and the tooltip shows the partial formula with "?" for the dice value

#### Scenario: Result in locked state

- **WHEN** a locked NPC has carryOver=-3, baseIni=14, iniMod=+0, diceResult=5
- **THEN** the card shows "16" in accent color, and the tooltip shows: "-3 Übertrag / 14 Basis-INI / +0 INI-Mod / +5 Würfel = 16"

### Requirement: Batch action quick-set

A master action dropdown in the dialog header SHALL allow the GM to select an action and apply it to all NPCs via an "Auf alle anwenden" button. The action SHALL be added to every NPC card that has fewer than 2 actions selected and doesn't already have that action. If the action has a waffentyp requirement, the system SHALL auto-select each NPC's first Angriff; NPCs whose first Angriff does not match the requirement SHALL be skipped. Cards with 2 actions already selected SHALL be skipped (not overwritten).

#### Scenario: Apply action to all NPCs

- **WHEN** the GM selects "Angriff" from the master dropdown and clicks "Auf alle anwenden"
- **THEN** every NPC with fewer than 2 actions gets "Angriff" added as a selected action chip

#### Scenario: Apply weapon-gated action, compatible NPCs get it

- **WHEN** the GM selects "Gezielter Schlag" (requires nahkampfwaffe) and clicks "Auf alle anwenden"
- **THEN** NPCs whose first Angriff is nah get the action applied; NPCs whose first Angriff is fern are skipped

### Requirement: Chat output is a single summary message

When "INI ansagen" commits, the dialog SHALL post exactly one ChatMessage containing a summary table of all processed NPC initiatives. The message SHALL include: the round number, and for each NPC: name, final initiative value, selected weapon/Angriff name (if any), and a compact formula (Basis + Aktion + Waffe + Mod + Würfel). Locked NPCs SHALL show a 🔒 indicator.

#### Scenario: Summary message includes weapon

- **WHEN** "INI ansagen" commits and an NPC had "Kurzschwert" selected
- **THEN** that NPC's row in the summary shows "Kurzschwert" in the formula
