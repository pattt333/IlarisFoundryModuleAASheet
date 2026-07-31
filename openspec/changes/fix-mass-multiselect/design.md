## Context

The mass initiative dialog uses Foundry's `<multi-select>` custom element for action selection. The event listener for `change` events is attached to the `<multi-select>` element, but the handler reads `event.target.getAttribute('name')`. Foundry's `<multi-select>` wraps an internal `<select>` element, and the `change` event's `.target` is that inner element — which has no `name` attribute. This causes `_onActionsChange` to silently exit on line 249 with `if (!name) return;`.

## Goals / Non-Goals

**Goals:**
- Fix `_onActionsChange` so the multi-select dropdown works correctly for action selection

**Non-Goals:**
- No template, CSS, or API changes
- No state model changes
- No gating or weapon selection changes (that's a separate change)

## Decisions

### Use `event.currentTarget` for `name`, `event.target` for `selectedOptions`

- `event.currentTarget` = the `<multi-select>` element the listener is on (has `name` attribute)
- `event.target` = the internal `<select>` that dispatched the event (has `selectedOptions`)

Alternative considered: using `event.target.closest('multi-select')` — works but is less direct than `currentTarget` which is the standard DOM pattern for delegated event handling on custom elements.

## Risks / Trade-offs

- **None** — this is a pure bug fix restoring intended behavior. No data migration, no API surface change.
