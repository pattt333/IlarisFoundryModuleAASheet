## MODIFIED Requirements

### Requirement: Action chips with Foundry multi-select

The mass dialog SHALL use Foundry's native `<multi-select>` element for action selection, showing all 10+ available actions with checkboxes. Selected actions SHALL be displayed as compact horizontal chips alongside the multi-select, showing the action icon, name, and INI cost. Each chip SHALL have a remove ✕ button that unchecks the corresponding item in the multi-select. The multi-select SHALL be disabled when 2 actions are already selected. A maximum of 2 actions SHALL be selectable per NPC. The `change` event handler SHALL use `event.currentTarget` to read the `name` attribute from the `<multi-select>` element, and `event.target.selectedOptions` to read the selected options from the internal `<select>`.

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
