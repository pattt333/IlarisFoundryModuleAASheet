## MODIFIED Requirements

### Requirement: Initiative dialog collects modifiers and actions

The PC dialog SHALL present a dashboard-style interface with three sections: action cards, dice rolling, and a formula breakdown. Actions SHALL be discovered from three sources (actor `aktion` items, world `aktion` items via `game.items`, and all world compendiums of type `Item`) and deduplicated by `name` with priority: actor > world > compendium. Actions SHALL be displayed as clickable cards showing icon, name, INI modifier, and `aktionstyp` badge ("Einfach" or "Komplex"). Selecting a card SHALL toggle it (up to 2 actions). When a `"komplex"` action is selected, all other action cards SHALL be grayed out and non-interactive with tooltip "Nicht mit komplexer Aktion kombinierbar". When two `"einfach"` actions are selected, an informational badge "Kombiniert (-4)" SHALL appear and -4 SHALL be automatically applied to AT and VT. The weapon dropdown SHALL be displayed below the action cards. After weapon selection, actions SHALL be filtered: non-matching actions (by `bedingungen.waffentyp` and `bedingungen.eigenschaften`) SHALL be grayed out with explanatory tooltips. The formula breakdown SHALL display a live calculation: `Basis + Aktion + Waffe + Mod + Würfel = Ergebnis`.

#### Scenario: Action card selected

- **WHEN** the user clicks an action card
- **THEN** the card is highlighted as selected, the action's INI modifier is reflected in the formula breakdown, and the live total updates

#### Scenario: Two actions selected and deselected

- **WHEN** the user selects 2 action cards and then clicks one of them again
- **THEN** that card is deselected, and the formula updates to reflect only the remaining action

#### Scenario: Attempt to select third action

- **WHEN** the user has 2 actions selected and clicks a third
- **THEN** the third card is NOT selected, and a notification or visual cue indicates the limit

#### Scenario: Two einfache actions auto-combined

- **WHEN** the user selects two actions both with `aktionstyp: "einfach"`
- **THEN** the "Kombiniert (-4)" badge appears, and -4 is automatically applied to AT and VT calculations

#### Scenario: Complex action blocks combination

- **WHEN** the user selects a komplex action and clicks a second action card
- **THEN** the second card is NOT selected, and a notification "Komplexe Aktionen können nicht kombiniert werden" appears

#### Scenario: Action grayed out due to weapon type mismatch

- **WHEN** the user selects a nahkampfwaffe and an action has `bedingungen.waffentyp: "fernkampfwaffe"`
- **THEN** the action card is grayed out with tooltip "Erfordert Fernkampfwaffe"

#### Scenario: Action grayed out due to missing eigenschaft

- **WHEN** the user selects a weapon lacking "Präzise" and an action has `bedingungen.eigenschaften: ["Präzise"]`
- **THEN** the action card is grayed out with tooltip "Erfordert Eigenschaft: Präzise"

#### Scenario: No weapon selected limits actions

- **WHEN** no weapon is selected
- **THEN** only actions with `bedingungen.waffentyp: ""` are available; all others are grayed out

### Requirement: Weapon selection dropdown for PC dialog

The PC dialog SHALL include a "Waffenauswahl" dropdown listing weapons where `item.system.hauptwaffe === true` OR `item.system.nebenwaffe === true`. The dropdown SHALL not appear in the NPC mass dialog. The selected weapon's `computed.actorModifiers` SHALL be checked for `actionNegAugment`/`actionAugment` modifiers affecting `ini`. After weapon selection, available actions SHALL be filtered by the weapon's type and eigenschaften against each action's `bedingungen`.

#### Scenario: Weapon with INI modifier selected

- **WHEN** a weapon with an `actionNegAugment` modifier targeting `ini` with value 3 is selected
- **THEN** the base INI is reduced by 3

#### Scenario: No eligible weapons

- **WHEN** the actor has no weapons with `hauptwaffe` or `nebenwaffe` set to true
- **THEN** the dropdown shows only "keine Waffe" and is disabled

#### Scenario: Weapon selection triggers action gating

- **WHEN** the user changes the selected weapon
- **THEN** action cards are re-evaluated against the new weapon's type and eigenschaften; non-matching actions are grayed out

### Requirement: Active effect merges modifiers with correct formula

All modifiers SHALL be merged into a single Active Effect named "Kampf-Modifikatoren Runde X" with icon `icons/svg/dice-target.svg`. In FRESH state, the effect SHALL contain the INI change (`iniMod + diceResult`), AT modifier, and VT modifier. AT and VT modifiers SHALL be computed from typed aktion data (`item.system.atMod`, `item.system.vtMod`) plus auto-derived combination malus (-4 when two einfache actions selected). In LOCKED state, the effect SHALL contain only the carry-over INI change plus the locked action's AT/VT modifiers. Before creating a new effect for a given round, any existing effect with the same name SHALL be deleted. The effect SHALL include `ilarisTiming` with `durationType: "turns"`, `remaining: 1`, `expiresOn: "turnEnd"`.

#### Scenario: FRESH state effect creation

- **WHEN** a combatant in FRESH state confirms with iniMod=1, diceResult=5, an aktion with atMod=2, vtMod=-1
- **THEN** the effect contains changes: `system.abgeleitete.ini` = +6, `system.modifikatoren.nahkampfmod` = +2, `system.modifikatoren.verteidigungmod` = -1, with `ilarisTiming: { durationType: "turns", remaining: 1, expiresOn: "turnEnd" }`

#### Scenario: FRESH state with two einfache actions

- **WHEN** a combatant confirms with two einfache actions (each atMod=0, vtMod=0)
- **THEN** the effect contains AT=-4 and VT=-4 from the auto-derived combination malus

#### Scenario: LOCKED state effect creation

- **WHEN** a locked combatant confirms with carryOver=-2, baseIni=4, diceResult=5, and the locked action has atMod=-4, vtMod=2
- **THEN** the effect contains changes for the INI delta and the locked action's AT/VT modifiers, with `ilarisTiming: { durationType: "turns", remaining: 1, expiresOn: "turnEnd" }`

#### Scenario: Duplicate effect cleanup

- **WHEN** a new effect "Kampf-Modifikatoren Runde 3" is about to be created
- **THEN** any existing effect with that exact name on the actor is deleted first
