# Migration History

> Source: `docs/_specs/<YYYY_MM_DD_*>/` subdirectories (17 dated implementation plans)

## ADDED Requirements

### Requirement: Migration records are preserved as historical reference

The 17 dated implementation plans from `docs/_specs/` subdirectories SHALL be consolidated into this spec as a chronological record of completed migrations. Each migration SHALL be documented with date, scope, and key outcomes.

#### Scenario: Reviewing migration history

- **WHEN** a contributor needs to understand past architectural decisions
- **THEN** the migration history provides a chronological record of all completed migrations

### Requirement: AppV2 Migration (2026-05-09)

The module SHALL have been migrated from Foundry's legacy ActorSheet to AppV2 (`HandlebarsApplicationMixin(ActorSheetV2)`). Migration phases SHALL have included: model data migration, variable name synchronization, and fernkampf hook migration. The fernkampf hook migration SHALL have changed the post-attack handling from actor-level to system-level hooks.

#### Scenario: Sheet rendering post-AppV2

- **WHEN** any actor sheet is rendered
- **THEN** it uses AppV2 with `DEFAULT_OPTIONS`, `PARTS`, and `TABS` static properties

### Requirement: CSS and Theme Migrations (2026-05-17)

CSS sheet scope isolation SHALL prevent style leakage. Dark mode sheet theme SHALL be present. The main tab SHALL include Eigenheiten. Module-wide visual coverage and sheet color consistency SHALL be established.

#### Scenario: Dark mode active

- **WHEN** Foundry's dark mode is active
- **THEN** the sheet uses dark mode theme styles without affecting other UI elements

### Requirement: Dialog and Accordion Migrations (2026-05-18)

Combat dialog theme SHALL be applied for visual consistency. Compendium variable names SHALL be synchronized. Dynamic accordion buttons SHALL be implemented. Fertigkeit dialog SHALL have received three reworks: used item tracking, full rework, and difficulty selection. Gegenstand anwenden dialog and material sammeln success handling SHALL be present.

#### Scenario: Fertigkeit dialog opens

- **WHEN** a skill check is initiated
- **THEN** the dialog shows the used item, difficulty setting, and appropriate gegenstand options

### Requirement: Effect Timing Migration (2026-07-03)

Active effect timing SHALL align with Ilaris system conventions for effect duration and expiration behavior.

#### Scenario: Effect with duration expires

- **WHEN** an active effect's duration reaches 0
- **THEN** the effect is removed following Ilaris system timing conventions
