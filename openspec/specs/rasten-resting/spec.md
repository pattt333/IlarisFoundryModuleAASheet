# Rasten (Resting)

## Purpose

Handle rest (Rasten) regeneration for ASP, KAP, and Lebenspunkte (wounds) with Ilaris-specific formulas and manual LAW multiplier.

## Requirements

### Requirement: Rest button opens regeneration dialog

The rest button (`class="rest-button"`) in the actor sheet SHALL open a Foundry `Dialog` that displays regeneration options based on the actor's type.

#### Scenario: Clicking rest button

- **WHEN** the user clicks the "Rasten" button on the actor sheet
- **THEN** the regeneration dialog opens

### Requirement: ASP regeneration for Zauberer

When `system.abgeleitete.zauberer === true`, the dialog SHALL display ASP regeneration: base regeneration = `Math.ceil(maxASP / 8)`, total = min(base + manual input, maxASP).

#### Scenario: Zauberer rests

- **WHEN** a Zauberer with max ASP 40 and current ASP 10 opens the dialog
- **THEN** base regeneration is displayed as `ceil(40/8) = 5`, and the total after rest is `min(10 + 5 + manual, 40)`

### Requirement: KAP regeneration for Geweihter

When `system.abgeleitete.geweihter === true`, the dialog SHALL display KAP regeneration: base regeneration = `Math.ceil(maxKAP / 16)`, total = min(base + manual input, maxKAP).

#### Scenario: Geweihter rests

- **WHEN** a Geweihter with max KAP 32 and current KAP 8 opens the dialog
- **THEN** base regeneration is displayed as `ceil(32/16) = 2`, and the total after rest is `min(8 + 2 + manual, 32)`

### Requirement: Only one energy type displayed

The dialog SHALL display either ASP regeneration (if Zauberer), KAP regeneration (if Geweihter), or neither (if neither). ASP and KAP SHALL never be displayed simultaneously.

#### Scenario: Actor is both Zauberer and Geweihter

- **WHEN** both `zauberer` and `geweihter` are true
- **THEN** only one regeneration type is displayed (Zauberer takes precedence)

### Requirement: Lebenspunkte (wound) regeneration

The dialog SHALL always display wound regeneration: new wounds = `Math.max(0, currentWunden - lawWert)`, where lawWert = `system.abgeleitete.law`. A manual multiplier input SHALL allow multiple LAW applications (e.g., multiple days of rest).

#### Scenario: Actor rests with wounds

- **WHEN** an actor with 18 Wunden and LAW 6 rests with multiplier 1
- **THEN** new wounds after rest = `max(0, 18 - 6) = 12`

#### Scenario: Multiple days of rest

- **WHEN** the user enters multiplier 3 with LAW 6 and 18 Wunden
- **THEN** new wounds = `max(0, 18 - 3*6) = 0`

### Requirement: Values saved on confirmation

When the user clicks "Rast durchführen", the dialog SHALL update `actor` with the new values for `asp_stern`, `kap_stern`, and `gesundheit.wunden` via `actor.update()`.

#### Scenario: Confirming rest

- **WHEN** the user clicks "Rast durchführen" with calculated values
- **THEN** the actor's `asp_stern`, `kap_stern` (if applicable), and `gesundheit.wunden` are updated

### Requirement: Manual input validation

The manual input field SHALL accept only non-negative integers. The total SHALL never exceed the maximum for energy values. For wounds, the minimum SHALL be 0.

#### Scenario: Manual input exceeds maximum

- **WHEN** a Zauberer enters a manual ASP value that would make total > maxASP
- **THEN** the total is capped at maxASP

#### Scenario: Empty or invalid manual input

- **WHEN** the user enters a non-numeric or empty manual value
- **THEN** the manual value is treated as 0
