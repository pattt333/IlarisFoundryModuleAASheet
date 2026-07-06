## Context

The first brownfield migration captured 12 capabilities from `docs/_specs/`. However, a codebase survey revealed 6 additional features with no specification coverage. These features range from a complex skill check dialog (Fertigkeit) to utility functions for item consumption and application. All are fully implemented in the codebase — this change documents their existing behavior as OpenSpec requirements.

## Goals / Non-Goals

**Goals:**
- Create 6 capability specs derived from reading the actual source code, not from existing documentation
- Ensure each spec accurately reflects current implementation (AppV2 patterns, action system, socket communication)
- Follow the same OpenSpec format as the first migration (ADDED requirements with WHEN/THEN scenarios)
- Reference exact source file paths for traceability

**Non-Goals:**
- Fixing or improving any of the undocumented features
- Adding new behavior or requirements beyond what's already implemented
- Modifying any of the 12 existing specs from the first migration

## Decisions

### Decision 1: Specs derived from source code, not from docs/_specs/

Unlike the first migration which converted `docs/_specs/` files, these specs have no pre-existing documentation. Each spec is derived by reading the relevant `.js`, `.hbs`, and `.css` files and extracting behavioral requirements.

**Rationale**: There are no brownfield docs for these features. The code IS the documentation.

### Decision 2: fertigkeit-dialog and item-application as separate capabilities

The Fertigkeit Dialog and Item Apply Dialog are treated as separate capabilities rather than being grouped under a shared "dialogs" spec. Each has its own template, CSS, and JS with distinct behavior.

**Rationale**: They serve different purposes (skill checks vs. item usage), have different user flows, and would likely be modified independently.

### Decision 3: item-application-utilities grouped together

The four utility functions (`consumeInventoryItem`, `applyItemToTarget`, `applyBleedingEffect`, `createItemApplicationPayload`) are grouped into one spec because they form a coherent subsystem — the item application pipeline from payload construction through consumption and target application.

**Rationale**: These functions are tightly coupled (called in sequence during item application) and share the same socket-based architecture.

### Decision 4: sheet-settings-dialogs grouped together

Energy settings, health settings, item quantity changes, hexagon editing, and global modifier editing are grouped into one spec. They share the same pattern: sheet-level `data-action` handlers that open simple dialogs or perform direct actor updates.

**Rationale**: Each individual dialog is too small for its own capability folder. Grouping them avoids spec directory clutter.

## Risks / Trade-offs

- **Risk**: Specs derived from code may miss undocumented edge cases → **Mitigation**: Specs are validated against code in tasks.md, same as first migration
- **Risk**: Complex features (fertigkeit-dialog) may have incomplete coverage → **Mitigation**: Focus on behavioral requirements (what the user sees and what happens), not implementation details
