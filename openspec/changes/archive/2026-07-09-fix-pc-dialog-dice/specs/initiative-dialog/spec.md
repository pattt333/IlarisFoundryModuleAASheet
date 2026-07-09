# Initiative Dialog (Delta)

## MODIFIED Requirements

### Requirement: Dice rolling section with 1 or 2 dice option

The dialog SHALL include a dice section where the user selects "1 Würfel" or "2 Würfel (Auswahl nach Wurf)" and clicks "Würfeln" to roll d6s. With 2 dice, the user SHALL click one of the two results to select it before "INI ansagen" becomes available. When Foundry's "Manual Rolling" setting is active, the auto-roll UI SHALL be replaced with a number input field (1–6) for manual entry of physical dice results. Changing the dice count SHALL re-render the template so the correct number of placeholder dice are displayed.

#### Scenario: Rolling 2 dice and selecting one

- **WHEN** the user selects "2 Würfel", clicks "Würfeln", and two d6 results are shown
- **THEN** clicking one die highlights it as the selected result, and the "INI ansagen" button becomes clickable

#### Scenario: Manual rolling mode enabled

- **WHEN** Foundry's core "Manual Rolling" setting is active
- **THEN** the dice count selection and roll button are not displayed; instead a number input labeled "Würfelergebnis" (min 1, max 6) is shown

#### Scenario: Switching from 1 die to 2 dice

- **WHEN** the user changes the dice count from 1 to 2
- **THEN** the template re-renders and shows 2 placeholder dice ("?") in the dice section

#### Scenario: Rolling 2 dice after switching from 1

- **WHEN** the user switched from 1 to 2 dice, then clicks "Würfeln"
- **THEN** both dice results are displayed and both are clickable for selection
