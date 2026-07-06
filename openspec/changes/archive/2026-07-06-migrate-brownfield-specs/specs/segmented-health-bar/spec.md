# Segmented Health Bar

> Source: `docs/_specs/segmented-health-bar.md`

## ADDED Requirements

### Requirement: Health bar is segmented by LAW value

The health bar SHALL be divided into 7 visual segments based on the LAW (Lebenspunkte-Abschnittswert) value, calculated as `Math.ceil(hp_max / 8)`. The last segment (7+8 combined) SHALL be double width, covering all remaining LeP.

#### Scenario: Actor with 50 max HP

- **WHEN** an actor has `hp.max = 50`
- **THEN** LAW = `ceil(50/8) = 7`, segments 1-6 each represent 7 LeP, segment 7 represents the remaining 8 LeP

#### Scenario: Actor with 60 max HP

- **WHEN** an actor has `hp.max = 60`
- **THEN** LAW = `ceil(60/8) = 8`, segments 1-6 each represent 8 LeP, segment 7 represents the remaining 12 LeP

### Requirement: Segments are color-coded by wound state

Segments 1-4 SHALL be red (Schwer verletzt), segments 5-6 SHALL be yellow (Verletzt), and segment 7+8 SHALL be green (Wundfrei).

#### Scenario: Actor at 20/50 HP with LAW 7

- **WHEN** an actor has 20 current HP
- **THEN** segments 1-3 are fully filled (red), segment 4 is partially filled (red), segments 5-7 are empty

#### Scenario: Actor at full HP

- **WHEN** an actor is at max HP
- **THEN** all 7 segments are fully filled with their respective colors

#### Scenario: Actor at 0 HP

- **WHEN** an actor has 0 current HP
- **THEN** all segments are empty

### Requirement: Segments support partial fill

Each segment SHALL calculate its fill percentage based on current HP relative to the segment's start/end range. The inner `segment-fill` div SHALL be sized accordingly.

#### Scenario: HP falls within a segment

- **WHEN** an actor has 24 HP with LAW 7 (segment 4: 22-28)
- **THEN** segment 4 shows `fillPercentage = ((24 - 22) / 7) * 100 ≈ 28.6%`

### Requirement: Segments have tooltips showing LeP range

Each segment SHALL display a tooltip on hover showing its LeP range (e.g., "LeP 22-28" for segment 4).

#### Scenario: Hovering over a segment

- **WHEN** the user hovers over segment 3
- **THEN** a tooltip shows "LeP 15-21"

### Requirement: Handlebars helper computes segment data

A Handlebars helper named `healthSegments` SHALL accept the actor and return an array of segment objects with properties: `number`, `start`, `end`, `size`, `color`, `fillPercentage`, and `width`.

#### Scenario: Template renders health bar

- **WHEN** the template calls `{{healthSegments actor}}`
- **THEN** an array of 7 segment objects is returned with correct computed values
