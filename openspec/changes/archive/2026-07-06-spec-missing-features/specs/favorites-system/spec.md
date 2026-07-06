# Favorites System

> Derived from: `scripts/components/favorites-manager.js`, `templates/components/favorites-component.hbs`, `styles/favorites-component.css`

## ADDED Requirements

### Requirement: Favorites component has category tabs

The favorites sidebar SHALL render clickable category tabs. Clicking a tab SHALL: deactivate all sibling tabs, activate the clicked tab, show the corresponding tab content, and hide other tab contents.

#### Scenario: Switching from combat tab to favorites tab

- **WHEN** the user clicks the "Favoriten" tab
- **THEN** the combat tab loses its `active` class, the favorites tab gains `active`, and the favorites content panel is displayed

### Requirement: Active tab persisted to sessionStorage

The active tab selection SHALL be saved to `sessionStorage` keyed by actor ID (`ilaris-favorites-active-tab-{actorId}`). On sheet render, the last active tab SHALL be restored, defaulting to `"combat"` if no saved state exists.

#### Scenario: Reopening sheet restores last tab

- **WHEN** a user switches to the "skills" tab, closes the sheet, and reopens it
- **THEN** the "skills" tab is active on reopen

### Requirement: Collapse/expand toggle with chevron icon

A collapse button SHALL toggle the `collapsed` CSS class on the favorites component. The chevron icon SHALL toggle between `fa-chevron-up` (expanded) and `fa-chevron-down` (collapsed). The collapsed state SHALL be persisted to `sessionStorage` keyed by actor ID.

#### Scenario: Collapsing favorites

- **WHEN** the user clicks the collapse button on an expanded favorites component
- **THEN** the component gets the `collapsed` class, the icon changes to `fa-chevron-down`, and the state is saved to sessionStorage

#### Scenario: Expanding favorites

- **WHEN** the user clicks the collapse button on a collapsed favorites component
- **THEN** the `collapsed` class is removed, the icon changes to `fa-chevron-up`, and the state is saved

### Requirement: Clear all favorites with confirmation dialog

A clear button SHALL be visible only on the "favorites" tab. Clicking it SHALL show a `DialogV2.confirm` asking "Möchten Sie wirklich alle Favoriten löschen?". On confirmation, favorites SHALL be cleared and a notification shown.

#### Scenario: Confirming clear all

- **WHEN** the user clicks "Favoriten löschen" and confirms the dialog
- **THEN** favorites are cleared and "Favoriten gelöscht" notification is shown

#### Scenario: Canceling clear all

- **WHEN** the user clicks "Favoriten löschen" but cancels the confirmation dialog
- **THEN** no changes are made

#### Scenario: Clear button visibility on non-favorites tab

- **WHEN** the active tab is not "favorites"
- **THEN** the clear button is hidden (`display: none`)

### Requirement: FavoritesManager initialized per actor sheet

The `FavoritesManager` SHALL be constructed with an actor ID and initialized on the sheet's rendered DOM element. It SHALL use vanilla DOM APIs (no jQuery).

#### Scenario: Sheet renders with favorites

- **WHEN** an actor sheet with a favorites component is rendered
- **THEN** `FavoritesManager.initialize(element)` is called, registering click listeners for tabs, collapse, and clear buttons
