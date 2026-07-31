## Context

The mass initiative dialog currently has no weapon or Angriff selection. Actions with `bedingungen.waffentyp` (requiring `nahkampfwaffe` or `fernkampfwaffe`) are never gated. The single-PC initiative dialog (`InitiativeDialog`) already implements weapon loading, gating, and INI modifier logic. The mass dialog needs equivalent functionality adapted for both `held` (PC) and `kreatur` (NPC) actor types.

**Current state:**
- `InitiativeDialog._loadAvailableWeapons()` loads items of type `nahkampfwaffe`/`fernkampfwaffe` filtered by `hauptwaffe`/`nebenwaffe`
- `InitiativeDialog._applyWeaponGating()` checks `waffentyp` and `eigenschaften` against selected weapon
- NPC `system.angriffe` is a plain array with `{name, at, vt, tp, rw, eigenschaften}`
- `InitiativeStateManager.calculateTotalInitiative()` accepts `weaponIniMod` but mass dialog passes 0

## Goals / Non-Goals

**Goals:**
- Add weapon/Angriff dropdown to each NPC card in the mass dialog
- Load weapons from items for `held` actors, normalize `system.angriffe` for `kreatur` actors
- Gate actions by waffentyp and eigenschaften based on selected weapon/Angriff
- Apply weapon INI modifier only when at least one selected action requires a weapon type
- On batch apply, default to each NPC's first Angriff; skip NPCs whose first Angriff doesn't match

**Non-Goals:**
- No changes to the single-PC initiative dialog
- No changes to how weapons/angriffe are stored on actors
- No new compendium or settings

## Decisions

### Decision 1: Normalize Angriffe to weapon shape for shared gating logic

NPC angriffe are normalized into the same shape that `_applyWeaponGating()` expects:

```javascript
// From system.angriffe entry:
// { name, at, vt, tp, rw, eigenschaften }
//
// To virtual weapon:
{
    id: `angriff-${index}`,   // stable synthetic ID
    name: a.name,
    type: isRanged ? 'fernkampfwaffe' : 'nahkampfwaffe',  // inferred from rw + eigenschaften
    system: { eigenschaften: a.eigenschaften || [] }
}
```

Type inference follows the same logic as the AI creature validator: `rw > 2` or has `Armbrust/Kugel/Pfeil/Bolzen` → fern, otherwise nah. Special case: `Wurfspeer` or name contains "wurf" → thrown (still fernkampfwaffe per Ilaris rules).

**Rationale**: Reuses `_applyWeaponGating()` unchanged. The gating logic checks `weaponType` against `action.bedingungen.waffentyp` and `weapon.system.eigenschaften` against `action.bedingungen.eigenschaften`. By normalizing angriffe to this shape, both actor types work through the same code path.

### Decision 2: Weapon INI modifier only when action requires it

The PC dialog always applies `weaponIniMod`. For the mass dialog (and ideally eventually the PC dialog too), the weapon INI modifier SHALL only be added when at least one selected action has a non-empty `bedingungen.waffentyp`.

```javascript
const hasWeaponAction = state.selectedActionIds.some(id => {
    const action = availableActions.find(a => a.id === id);
    return action?.bedingungen?.waffentyp && action.bedingungen.waffentyp !== '';
});
const effectiveWeaponMod = hasWeaponAction ? weaponIniMod : 0;
```

**Rationale**: A weapon's INI modifier represents the speed/encumbrance of using that weapon. If no action uses the weapon, the modifier should not apply.

**Alternative considered**: Always apply weapon INI modifier (like PC dialog). Rejected because it produces incorrect results when a weapon is selected but no weapon-using action is taken.

### Decision 3: Batch apply defaults to first Angriff, skips if mismatched

When the GM uses "Auf alle anwenden" with an action that has `bedingungen.waffentyp`:

1. For each NPC: if no angriff is currently selected, auto-select the first angriff
2. Check if the first angriff's type matches the action's waffentyp
3. If match → apply the action and set selectedWeaponId to the first angriff
4. If no match → skip this NPC

**Rationale**: Most NPCs have one primary Angriff. Auto-defaulting avoids requiring the GM to manually select an Angriff for every NPC. Skipping mismatched NPCs is safer than applying an incompatible action.

### Decision 4: Dropdown placement in card layout

The weapon/Angriff dropdown is placed between the action chips and the modifier row — same relative position as in the PC dialog (action cards → weapon row → modifiers).

```
┌──────────────────────────────┐
│ Card Header (name, INI, etc) │
├──────────────────────────────┤
│ Action chips + multi-select  │
│ ⚔️ [Kurzschwert ▼]          │  ← NEW
│ Modifiers (INI/AT/VT)        │
│ Dice section                 │
│ Result                       │
└──────────────────────────────┘
```

### Decision 5: Persist `selectedWeaponId` in existing flag

The `dialogState` actor flag already has a `lockedWeaponId` slot. Adding `selectedWeaponId` to the same flag keeps all initiative state together. No new flag key needed.

```javascript
// Added to persistState/loadState:
selectedWeaponId: state.selectedWeaponId ?? '',
```

## Risks / Trade-offs

- **[Risk] Angriff type inference may be wrong for edge-case NPCs** → Type is inferred from `rw` and eigenschaften using the same logic as the AI creature validator, which is battle-tested. Edge cases can be corrected by the GM editing the NPC sheet.
- **[Risk] Card height increases with new dropdown row** → The dropdown row is compact (single line). Cards with 2+ angriffe will have a taller dropdown, but this is manageable since most NPCs have 1-2 angriffe.
