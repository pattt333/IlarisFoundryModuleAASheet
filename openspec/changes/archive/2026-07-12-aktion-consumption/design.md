## Context

The main Ilaris system now provides `AktionItemDataModel` — a typed `TypeDataModel` for the `aktion` item type. This replaces the hollow `effect-item` type. The module currently:

- Filters for `effectItem` items and regex-parses their embedded ActiveEffect changes to extract INI/AT/VT modifiers
- Uses a manual "Kombiniert (-4 AT/VT)" checkbox disconnected from actual action types
- Has no weapon-based action gating
- Loads actions from a compendium (`nenneke-aktionen`) that may not exist

The new model provides direct typed access (`system.iniMod`, `.atMod`, `.vtMod`, `.aktionstyp`, `.bedingungen`). This design replaces fragile parsing with structured consumption and adds rules-accurate combination logic and weapon gating.

## Goals / Non-Goals

**Goals:**
- Replace all `effectItem` references with `aktion` across sheets, dialogs, templates
- Replace regex-based modifier extraction with typed `system.iniMod` / `.atMod` / `.vtMod` access
- Universal action discovery: scan actor items + `game.items` + all world compendiums
- Auto-derive combination rules from `aktionstyp` (remove manual checkbox)
- Weapon-first action gating by `bedingungen.waffentyp` and `bedingungen.eigenschaften`
- Gray-out UX for non-matching actions with explanatory tooltips
- Build ActiveEffects with 1-turn `ilarisTiming` from typed aktion data
- Remove `kombinierteAktion` from all persisted state

**Non-Goals:**
- Migrating existing `effectItem` items on actors to `aktion` type (separate migration concern)
- Creating a compendium pack (actions come from actor inventory and world compendiums only)
- Caching action discovery (10-15 actions total, negligible cost)
- Changing the `dialogState` flag schema version (old `kombinierteAktion` is silently ignored)

## Decisions

### Decision 1: Universal action discovery with name-based deduplication

**Chosen:** Scan `this.actor.items` (type `aktion`), `game.items` (type `aktion`), and all `game.packs` of document type `Item` (filtered to `aktion` via `getIndex()`). Deduplicate by `name` with priority: actor > world > compendium.

**Alternatives considered:**
- **Compendium-only**: Too restrictive — users can't customize actions per actor.
- **Actor-only**: Forces every actor to carry all action items; no shared library.
- **UUID-based dedup**: Fragile across worlds/compendiums; `name` is the natural domain key for actions.

**Rationale:** Matches how the Ilaris system already handles Waffeneigenschaften (name-based references via `EigenschaftCache`). Users can override compendium actions by creating same-named items on their actor.

### Decision 2: Fetch compendium documents eagerly, not via index

**Chosen:** After filtering compendium indices for `aktion` entries, fetch full documents via `pack.getDocuments()` to access typed `system` data.

**Rationale:** `getIndex()` returns lightweight metadata only — no `system` fields. We need `system.iniMod`, `system.aktionstyp`, etc. Loading full documents is acceptable with 10-15 total actions.

### Decision 3: Auto-derived combination, no manual checkbox

**Chosen:** When two actions are selected, check both `aktionstyp` values:
- Both `"einfach"` → auto-apply -4 AT/VT, show "Kombiniert (-4)" badge
- Any `"komplex"` → block second selection at UI level

**Alternatives considered:**
- **Keep checkbox**: Contradicts the data model — `aktionstyp` already encodes this. User could check "Kombiniert" for a komplex action, which is rules-invalid.
- **Mixed einfach+komplex with warning**: Adds complexity for an illegal game state. Blocking is cleaner.

**Rationale:** The rules are unambiguous: komplex actions cannot be combined, einfache actions can (with -4 malus). The UI should enforce, not suggest.

### Decision 4: Weapon-first gating (filter actions by weapon)

**Chosen:** After weapon selection, filter `availableActions`:
- `bedingungen.waffentyp: ""` → always available
- `bedingungen.waffentyp: "nahkampfwaffe"` → weapon.type must be `"nahkampfwaffe"` (or nahkampfwaffe with "Fernkampfoption")
- `bedingungen.waffentyp: "fernkampfwaffe"` → weapon.type must be `"fernkampfwaffe"` (or nahkampfwaffe with "Fernkampfoption")
- All `bedingungen.eigenschaften` keys must exist in weapon's `eigenschaften` array

**Alternatives considered:**
- **Action-first (filter weapons by action)**: User picks action, then sees compatible weapons. Less natural when weapon choice drives tactical decisions.
- **Hide non-matching actions**: Cleaner UI but less educational — users don't learn why an action is unavailable.

**Rationale:** Weapon-first matches the dialog's existing layout (weapon dropdown is prominent). Gray-out preserves visibility and teaches users about action requirements.

### Decision 5: Gray-out with opacity and tooltip

**Chosen:** Non-matching actions get CSS class `.grayed-out` (opacity: 0.4, pointer-events: none) plus a `title` attribute with the reason. Tooltip messages: "Erfordert Fernkampfwaffe", "Erfordert Nahkampfwaffe", "Erfordert Eigenschaft: {name}", "Nicht mit komplexer Aktion kombinierbar".

**Rationale:** Simple CSS approach, no JavaScript tooltip library needed. `title` attribute provides native browser tooltip.

### Decision 6: ilarisTiming on combat effects

**Chosen:** ActiveEffects created during "INI ansagen" get `ilarisTiming: { durationType: "turns", remaining: 1, expiresOn: "turnEnd" }`. This uses the existing `IlarisActiveEffectDataModel` schema already defined in the system.

**Rationale:** The system's `combat-turn-hooks.js` already handles decrementing `remaining` and expiring effects. No new hook logic needed in the module.

### Decision 7: Load actions once per dialog, not re-scan on weapon change

**Chosen:** `_loadAvailableActions()` discovers all actions once during `_prepareContext()`. Weapon gating is applied as a runtime filter on the already-loaded array — it does not re-scan compendiums.

**Rationale:** The action pool doesn't change during a dialog session. Gating is a view concern (show/hide/gray), not a data concern.

## Risks / Trade-offs

- **[Risk] Compendium `getIndex()` may return stale data if a GM adds actions mid-session** → Mitigation: Acceptable. Initiative dialog is opened at combat start and round changes — not continuously. GM would need to reopen dialog to see new actions.
- **[Risk] `game.items` may contain non-aktion items the user didn't intend as actions** → Mitigation: Filter by `type === 'aktion'`. Only items explicitly created as aktion type are included.
- **[Risk] Name-based deduplication fails if two different actions share a name** → Mitigation: Ilaris convention is unique action names (like Waffeneigenschaften). Edge case is theoretical.
- **[Trade-off] No migration of existing `effectItem` items** → Users with existing effectItem items on actors must manually recreate them as aktion items. Acceptable for a module upgrade.
