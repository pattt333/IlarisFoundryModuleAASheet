## Context

The current initiative dialog (`scripts/apps/initiative-dialog.js`) is an `Application` subclass that renders a Handlebars form. The form collects: INI/AT/VT modifiers, a weapon dropdown, up to 2 actions from a multi-select, dice count and dice roll. On confirm ("INI ansagen"), it calculates total initiative, creates an `ActiveEffect` on the actor, posts a `ChatMessage`, and sets the combatant's initiative in the tracker.

The initiative formula for the normal (non-negative) case is:

```
totalIni = currentIni + weaponIniMod + iniMod + actionIniMod + diceResult
```

Where `currentIni` is `system.abgeleitete.ini` (PC) or `system.kampfwerte.ini` (NPC), and `actionIniMod` is the lowest INI modifier among selected actions.

For the negative-initiative case (`movedAction = true`), the current formula is:

```
totalIni = currentIni + weaponIniMod + actionIniMod + baseIni * movedActionRounds + diceResult
```

This is incorrect because `currentIni` already includes the effect from the previous round's penalties, and then `weaponIniMod` and `actionIniMod` are added *again* — double-counting the action/weapon penalties.

The existing UI is a standard form with number inputs, dropdowns, and a single "Würfeln" button. In the negative-initiative state, all inputs are disabled — the user can only roll dice.

### System Data Paths

- PC (`held`): `system.abgeleitete.ini`, `system.abgeleitete.baseIni`
- NPC (`kreatur`): `system.kampfwerte.ini`, `system.kampfwerte.baseIni`
- AT modifier: `system.modifikatoren.nahkampfmod`
- VT modifier: `system.modifikatoren.verteidigungmod`
- Weapon properties: `item.system.hauptwaffe`, `item.system.nebenwaffe`, `item.system.computed.actorModifiers`
- Flag storage: `actor.flags.ilaris-alternative-actor-sheet.dialogState`

## Goals / Non-Goals

**Goals:**

- Fix the negative-initiative carry-over formula so penalties are NOT double-counted
- Introduce a locked action/weapon state that persists across rounds when initiative is negative
- Redesign the PC dialog UI as a dashboard with clickable action cards, visual dice, and a live formula breakdown
- Keep the manual INI modifier editable even in the locked state
- Maintain backward compatibility with existing dialog state flags where possible
- Improve effect naming to include round numbers for easier cleanup

**Non-Goals:**

- Redesign the NPC mass initiative dialog (it gets the formula fix but keeps the accordion layout)
- Change how Foundry's combat tracker sorts or displays initiative
- Add network-synchronized dice rolling (stays client-side like the current implementation)
- Add a turn-order preview bar (explicitly excluded per design discussion)
- Change the 1-die vs 2-dice selection mechanic

## Decisions

### Decision 1: State Machine — FRESH vs LOCKED

The dialog has two distinct states with different UI and different formulas:

```
FRESH (every round, normal):
  - All action cards clickable
  - Weapon dropdown enabled
  - Manual INI mod enabled
  - Formula: baseIni + actionMod + weaponMod + manualMod + dice

LOCKED (carried over from previous negative round):
  - Locked action card displayed with lock icon, others grayed out
  - Weapon displayed as locked text (not a dropdown)
  - Manual INI mod enabled
  - Formula: carryOver + baseIni + manualMod + dice
  - AT/VT modifiers from locked action still apply when action resolves
```

**Why**: The locked state needs to communicate "you already committed to this action/weapon, you're just waiting for your turn." Graying out everything was confusing — the user didn't know *why* they couldn't change things. Explicit lock indicators make the state visible.

### Decision 2: Corrected formulas

**FRESH** (unchanged logic, cleaned up):
```
totalIni = baseIni + actionIniMod + weaponIniMod + iniMod + diceResult
```
Uses `baseIni` (not `currentIni`) to avoid double-counting any effects from previous rounds.

**LOCKED** (corrected):
```
totalIni = carryOver + baseIni + iniMod + diceResult
```
Where `carryOver` is the negative total from the previous round (stored in dialogState). Action and weapon INI modifiers are NOT re-applied — they were already "paid" when the action was first chosen.

**Why**: The rule is "penalties are paid once." The player committed to a slow action, lost their turn, and now carries only the raw negative number forward. Base INI and a fresh die roll are added to see if they recover.

### Decision 3: Action Cards (not dropdown)

Replace the `<multi-select>` dropdown with a grid of clickable `<div>` cards. Each card shows:
- The action's icon
- The action's name
- The INI modifier (e.g., "INI −2")
- A selected/active state via CSS border

**Why**: Dropdowns are poor for browsing 10+ actions where the user needs to see INI costs at a glance. Cards make the choice visible and let users compare costs quickly. The multi-select for up to 2 actions is handled by toggling cards — click to select, click again to deselect.

### Decision 4: Visual Dice (clickable d6 faces)

Replace the current dice results display with styled d6 face elements. The "Würfeln" button triggers a roll animation (CSS transition on the dice faces cycling through random pips before settling). Selected dice get a highlighted border.

**Why**: Dice should feel like dice, not like form fields. The physicality of rolling dice is part of the tabletop experience, and the UI should reflect that.

### Decision 5: Effect naming pattern

Change from `"Kampf-Modifikatoren Runde X"` to a format that includes both the round number and whether it's a normal or locked effect:

- Normal: `"Kampf-Modifikatoren Runde X"`
- Locked/carry-over: The effect persists with `duration.turns = 2` until the action resolves

Additionally, when applying a new effect, explicitly delete any existing effect with a matching name prefix (for the same round) to avoid duplicates.

**Why**: The current `.find(e => e.name.startsWith(...))` approach is fragile with multiple effects from different rounds. Better to clean up explicitly when creating new effects for the same round.

### Decision 6: dialogState flag structure update

The persisted `dialogState` flag gets new fields:

```javascript
{
  // Existing (kept):
  iniMod: 0,           // Manual INI modifier
  atMod: 0,            // Manual AT modifier  
  vtMod: 0,            // Manual VT modifier
  selectedActionIds: [],  // Selected action IDs
  kombinierteAktion: false,
  diceCount: 1,
  diceResults: [],
  selectedDiceIndex: null,
  hasRolled: false,
  selectedWeaponId: '',

  // Changed:
  movedAction: false,     // Was: movedAction → stays but semantics clarified
  movedActionRounds: 0,   // Was: movedActionRounds → number of rounds delayed
  carryOver: 0,           // NEW: raw negative value carried from previous round
  
  // For locked state:
  lockedActionId: null,   // NEW: the locked action (same as selected if negative)
  lockedWeaponId: null,   // NEW: the locked weapon (same as selected if negative)
}
```

**Why**: `carryOver` is a cleaner way to track the accumulated negative value than the `baseIni * movedActionRounds` hack. `lockedActionId`/`lockedWeaponId` explicitly capture what's frozen.

## Risks / Trade-offs

- **Risk**: Complete template rewrite may introduce regressions in edge cases (no actions available, no weapons available, NPC actors in PC dialog). → **Mitigation**: Test with empty states, NPC-type actors, and compendium-not-found scenarios.
- **Risk**: Changing the `dialogState` flag structure may cause issues if a user has a persisted state from the old format. → **Mitigation**: Add a migration check in the constructor that detects old-format state and resets to defaults, or maps old fields to new.
- **Risk**: The card-based action UI with toggling for multi-select may be unfamiliar to users accustomed to dropdowns. → **Mitigation**: Add a brief tooltip/hint: "Klicke um bis zu 2 Aktionen auszuwählen. Der niedrigste INI-Mod zählt."
- **Trade-off**: Action cards take more vertical space than a dropdown. With 10+ actions, scrolling is needed. → Acceptable; the trade-off is visual clarity over compactness.
