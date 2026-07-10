## ADDED Requirements

### Requirement: Initiative dialogs use ApplicationV2 framework

All initiative dialog classes SHALL extend `HandlebarsApplicationMixin(ApplicationV2)` instead of the deprecated V1 `Application` class.

- `InitiativeDialog` SHALL use `HandlebarsApplicationMixin(ApplicationV2)` as its base class.
- `MassInitiativeDialog` SHALL use `HandlebarsApplicationMixin(ApplicationV2)` as its base class.
- `CombatDockApp` SHALL use `HandlebarsApplicationMixin(ApplicationV2)` as its base class.

#### Scenario: PC initiative dialog opens without V1 deprecation warning

- **WHEN** a player clicks the initiative button for their PC character
- **THEN** the `InitiativeDialog` opens without triggering a V1 `Application` deprecation warning in the console

#### Scenario: NPC mass initiative dialog opens without V1 deprecation warning

- **WHEN** a GM opens the mass initiative dialog for NPC combatants
- **THEN** the `MassInitiativeDialog` opens without triggering a V1 `Application` deprecation warning in the console

#### Scenario: Combat dock renders without V1 deprecation warning

- **WHEN** combat starts and the combat dock renders
- **THEN** the `CombatDockApp` renders without triggering a V1 `Application` deprecation warning in the console

### Requirement: Confirmation dialogs use DialogV2

All confirmation and choice dialogs SHALL use `DialogV2` instead of the deprecated V1 `Dialog` class.

- `NegativeInitiativeDialog` SHALL use `DialogV2` instead of `extends Dialog` (V1).
- `MassInitiativeDialog._showUnprocessedDialog` SHALL use `DialogV2` instead of `new Dialog(...)` (V1).

#### Scenario: Unprocessed NPCs warning uses DialogV2

- **WHEN** the GM clicks "INI ansagen" but some NPCs have not rolled dice
- **THEN** the "NPCs nicht fertig" confirmation dialog appears using `DialogV2` without a V1 deprecation warning

#### Scenario: Negative initiative continuation uses DialogV2

- **WHEN** a combat round ends and an actor has negative initiative
- **THEN** the "Aktion fortsetzen?" dialog appears using `DialogV2` without a V1 deprecation warning

### Requirement: ActiveEffect modes use string types

All ActiveEffect change definitions SHALL use string mode identifiers instead of deprecated numeric `CONST.ACTIVE_EFFECT_MODES` constants.

- `InitiativeStateManager.buildEffectChanges` SHALL use `"add"` instead of `CONST.ACTIVE_EFFECT_MODES.ADD`.
- All effect changes created by the initiative subsystem SHALL use string type values for the `mode` property.

#### Scenario: Combat effects created without ACTIVE_EFFECT_MODES deprecation

- **WHEN** a player or GM confirms initiative ("INI ansagen")
- **THEN** the combat modifier effect is created without triggering a `CONST.ACTIVE_EFFECT_MODES` deprecation warning

#### Scenario: Effect changes use valid string mode

- **WHEN** `InitiativeStateManager.buildEffectChanges` builds effect changes
- **THEN** each change's `mode` property is a string value (e.g., `"add"`) recognized by Foundry V14

### Requirement: No jQuery in migrated dialog classes

All DOM manipulation in the migrated dialog classes SHALL use vanilla DOM APIs instead of jQuery.

- `InitiativeDialog` SHALL use `this.element.querySelector()` and `this.element.querySelectorAll()` instead of `html.find()`.
- `InitiativeDialog` SHALL use `element.classList.toggle()`, `element.textContent`, `element.addEventListener()` instead of jQuery equivalents.
- `MassInitiativeDialog` SHALL use vanilla DOM APIs for all DOM access and manipulation.
- `CombatDockApp` SHALL use vanilla DOM APIs for all DOM access and manipulation.

#### Scenario: Formula breakdown updates without jQuery

- **WHEN** a player changes a modifier value in the PC initiative dialog
- **THEN** the formula breakdown display updates using vanilla DOM methods (`textContent`, `classList.toggle`)

#### Scenario: Dice roll animation uses vanilla DOM

- **WHEN** a player clicks "Würfeln" in the PC initiative dialog
- **THEN** dice faces animate and display results using vanilla DOM manipulation
