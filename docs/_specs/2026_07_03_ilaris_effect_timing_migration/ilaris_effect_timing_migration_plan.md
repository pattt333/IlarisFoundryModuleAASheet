# Ilaris ActiveEffect Owner-Turn Timing — Modul-Migration

## 1. Objective

Das alternative Actor-Sheet-Modul (`ilaris-alternative-actor-sheet`) an die neue Ilaris-Effect-Dauerlogik (owner-scoped turn timing mit `system.ilarisTiming`) aus dem Hauptsystem anpassen. Effekt-Anzeige (effect-card), "Zeit vorrücken"-Button, Stack-Effekte und die Effect-Library-Kompendium-Daten werden auf das neue Modell migriert.

## 2. Context & Research Summary

### Was das Ilaris-Hauptsystem bereits implementiert hat (✅ abgeschlossen)

Die Spezifikation `2026_06_25_active_effect_owner_turn_timing` im Hauptsystem ist vollständig implementiert:

- **`IlarisActiveEffect`** (`scripts/effects/active-effect.js`): Überschreibt `isExpiryEvent()` und `updateDuration()`, um Core-Duration-Processing für Ilaris-getimte Effekte zu unterdrücken. Besitzt außerdem `apply()`, `resolveFormulaValue()`, `recalculateHpIfNeeded()`, sowie DOT-Logik (`getDotEffects()`, `applyDotDamage()`).
- **`IlarisActiveEffectDataModel`** (`scripts/effects/model-data/ilaris-effect-model.js`): Erweitert `foundry.data.ActiveEffectTypeDataModel` um das `ilarisTiming` Schema: `{durationType, expiresOn, remaining, originalValue, _pendingExpiry, _pendingDurationChange}`. Registriert als `CONFIG.ActiveEffect.dataModels["base"]`.
- **`IlarisActiveEffectConfig`** (`scripts/effects/ilaris-effect-config.js`): AppV2-Erweiterung mit einem "Ilaris Dauer"-Tab, der das `ilarisTiming`-Objekt konfiguriert.
- **`combat-turn-hooks.js`**: Automatische Effekt-Dauer-Verarbeitung in `combatTurn`, `combatRound`, und `updateCombat` Hooks (Two-Phase-Flow für `turnEnd`-Effekte).
- **`effects-section.hbs`**: Listendarstellung von Effekten mit Create/Edit/Toggle/Delete-Controls.

### Ist-Zustand des Moduls

| Komponente | Aktuelles Verhalten | Problem |
|---|---|---|
| `effect-card.hbs` | Zeigt `effect.duration.value` / `effect.duration.units` (z.B. "3 Runden") | Ignoriert `system.ilarisTiming` komplett |
| `effects-tab.hbs` | "Zeit vorrücken"-Button ruft `advanceEffectTime()` auf | Decrementiert `duration.turns`/`duration.rounds` — das alte Modell |
| `creature-kampf-tab.hbs` | Gleicher "Zeit vorrücken"-Button, gleiche effect-card | Dito |
| `advanceEffectTime()` (utilities.js) | Filtert nach `duration.units ∈ ['turns','rounds']` und decrementiert `duration.value` | Muss auf `system.ilarisTiming.remaining` umgestellt werden |
| `advanceEffectTimeForAllActors()` (utilities.js) | Ruft `advanceEffectTime()` für alle Token-Actors auf | Wird via `module.js` verwendet, muss ebenfalls migriert werden |
| `increaseEffectStack()` (utilities.js) | Setzt `duration.turns: 3` beim Stacken | Muss `system.ilarisTiming.remaining` setzen |
| Effect-Library (`packs/effect-library/`) | Items vom Typ `effectItem` mit embedded effects, `duration.turns: 3` | Als `ActiveEffect`-Type-Pack mit `ilarisTiming` migrieren |

### Vom Nutzer bestätigte Anforderungen

1. "Zeit vorrücken" (pro Actor + global) bleibt erhalten, arbeitet aber mit `system.ilarisTiming.remaining`. Kein `turnStart`/`turnEnd`-Unterschied beim manuellen Vorrücken.
2. Effect-Card-Duration durch `ilarisTiming` ersetzen.
3. Stack-Effekte auf `ilarisTiming` migrieren.
4. Effect-Library-Kompendium von `Item` (type=effectItem) auf `ActiveEffect`-Pack migrieren.
5. `IlarisActiveEffectConfig` funktioniert bereits (vom Hauptsystem geerbt).
6. Card-Grid-Layout beibehalten.

## 3. Affected Files

| File | Action | Reason |
|---|---|---|
| `templates/components/effect-card.hbs` | modify | Duration-Anzeige auf `ilarisTiming` umstellen |
| `templates/sheets/character/tabs/effects-tab.hbs` | modify | "Zeit vorrücken"-Button behalten (kein Template-Change nötig, nur JS) |
| `templates/sheets/npc/tabs/creature-kampf-tab.hbs` | modify | "Zeit vorrücken"-Button behalten (kein Template-Change nötig, nur JS) |
| `scripts/utilities.js` | modify | `advanceEffectTime()`, `advanceEffectTimeForAllActors()`, `increaseEffectStack()` auf `ilarisTiming` umstellen |
| `scripts/sheets/alternative-actor-sheet.js` | modify | `onEffectAdvanceTime()` und Drop-Handler für neuen Pack-Typ anpassen |
| `scripts/sheets/alternative-creature-sheet.js` | modify | `onEffectAdvanceTime()` und Drop-Handler für neuen Pack-Typ anpassen |
| `scripts/handlebars-helpers.js` | check | Prüfen ob `isFiniteValue`-Helper für `ilarisTiming.remaining` ausreicht |
| `module.json` | modify | Pack-Typ von `"Item"` auf `"ActiveEffect"` ändern |
| `packs/effect-library/_source/*.json` (7 files) | modify | Von `effectItem`-Items auf standalone `ActiveEffect`-Dokumente migrieren, `ilarisTiming` hinzufügen |
| `styles/effect-card.css` | check | Prüfen ob neue Duration-Klassen CSS benötigen (vermutlich nicht) |

## 4. Steps

### Step 1 — `advanceEffectTime()` auf `ilarisTiming` umstellen

**What**: Die Funktion `advanceEffectTime(actor)` in `scripts/utilities.js` sucht nicht mehr nach `duration.units ∈ ['turns','rounds']`, sondern nach `system.ilarisTiming.durationType === 'ownerTurns'` mit `remaining > 0`. Sie decrementiert `system.ilarisTiming.remaining` um 1 und löscht den Effekt wenn `remaining ≤ 0`. Kein `turnStart`/`turnEnd`-Unterscheidung (simples "remaining - 1, delete if ≤ 0").

**Where**: `scripts/utilities.js` — ersetze die bestehende `advanceEffectTime()`-Funktion (ca. Zeilen 515–540).

**Who**: `code` | **Depends on**: none

**Reference**: 
- Bestehende `advanceEffectTime()` in `scripts/utilities.js:515-540`
- `IlarisActiveEffect` in `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\scripts\effects\active-effect.js`
- `ilarisTiming`-Schema: `{durationType, remaining, originalValue, expiresOn}`

**Neuer Code (Pseudocode)**:
```js
export async function advanceEffectTime(actor) {
    const ilarisEffects = actor.effects.filter(e => {
        return e.system?.ilarisTiming?.durationType === 'ownerTurns' 
            && (e.system.ilarisTiming.remaining > 0);
    });
    
    if (ilarisEffects.length === 0) return 0;
    
    const updates = [];
    const deletions = [];
    for (const effect of ilarisEffects) {
        const newRemaining = effect.system.ilarisTiming.remaining - 1;
        if (newRemaining <= 0) {
            deletions.push(effect.id);
        } else {
            updates.push({ _id: effect.id, 'system.ilarisTiming.remaining': newRemaining });
        }
    }
    
    if (updates.length) await actor.updateEmbeddedDocuments('ActiveEffect', updates);
    for (const id of deletions) await actor.deleteEmbeddedDocuments('ActiveEffect', [id]);
    
    return ilarisEffects.length;
}
```

---

### Step 2 — `increaseEffectStack()` auf `ilarisTiming` migrieren

**What**: `increaseEffectStack()` und `decreaseEffectStack()` in `scripts/utilities.js` setzen nicht mehr `duration.turns: 3`, sondern `system.ilarisTiming.remaining: 3` (oder den existierenden `originalValue`). Zusätzlich wird `system.ilarisTiming.durationType` auf `'ownerTurns'` gesetzt, falls nicht bereits vorhanden.

**Where**: `scripts/utilities.js` — `increaseEffectStack()` (ca. Zeile 190).

**Who**: `code` | **Depends on**: Step 1

**Reference**:
- Bestehende `increaseEffectStack()` in `scripts/utilities.js:190-214`
- `ilarisTiming`-Schema

**Änderungen**:
- `'duration.turns': 3` → `'system.ilarisTiming.remaining': effect.system.ilarisTiming?.originalValue || 3`
- Sicherstellen dass `durationType: 'ownerTurns'` gesetzt ist

---

### Step 3 — Effect-Card-Template auf `ilarisTiming` umstellen

**What**: `effect-card.hbs` ersetzt die bisherige Duration-Anzeige (`effect.duration.value` + Units) durch eine Anzeige basierend auf `effect.system.ilarisTiming`. Wenn `durationType === 'ownerTurns'`, zeige `remaining` Runden. Wenn kein `ilarisTiming` gesetzt ist oder `durationType` leer/undefined, zeige das ∞-Symbol (oder Standard-Duration als Fallback).

**Where**: `templates/components/effect-card.hbs` — ersetze den `.effect-duration`-Block (ca. Zeilen 48–61).

**Who**: `code` | **Depends on**: none

**Reference**:
- Bestehendes `effect-card.hbs` (attachment)
- `ilarisTiming`-Schema

**Neuer Duration-Block (Pseudocode)**:
```handlebars
<div class="effect-duration">
    {{#if effect.system.ilarisTiming.durationType}}
        {{#if (eq effect.system.ilarisTiming.durationType "ownerTurns")}}
            {{effect.system.ilarisTiming.remaining}}
            <span class="duration-label">Runden</span>
        {{/if}}
        {{#if (eq effect.system.ilarisTiming.durationType "infinite")}}
            <i class="fas fa-infinity" title="Unbegrenzte Dauer"></i>
        {{/if}}
    {{else}}
        {{!-- Fallback: standard duration --}}
        {{#if effect.duration.value}}
            {{effect.duration.value}}
            {{#if (eq effect.duration.units "turns")}}Runden{{/if}}
            ...
        {{else}}
            <i class="fas fa-infinity" title="Unbegrenzte Dauer"></i>
        {{/if}}
    {{/if}}
</div>
```

---

### Step 4 — Effect-Library-Kompendium migrieren

**What**: Die 7 Einträge im `packs/effect-library/_source/` werden von `Item` (type=`effectItem`) auf standalone `ActiveEffect`-Dokumente migriert. Der Pack-Typ in `module.json` ändert sich von `"Item"` auf `"ActiveEffect"`. Nach der Migration `npm run pack-all` ausführen.

**Where**: 
- `module.json` Zeile wo `"type": "Item"` für effect-library steht → `"type": "ActiveEffect"` 
- Alle 7 JSON-Dateien in `packs/effect-library/_source/`

**Who**: `compendium` | **Depends on**: none

**Reference**:
- Bestehende JSON-Struktur: `packs/effect-library/_source/Blutung_Gu0p2qIzCYKajtRH.json`
- V14 ActiveEffect-Dokumentstruktur (siehe Hauptsystem-Effekte)
- `ilarisTiming`-Schema

**Migration pro Datei**:
Alte Struktur (Item mit embedded effects):
```json
{
    "name": "Blutung",
    "type": "effectItem",
    "_id": "...",
    "img": "icons/svg/blood.svg",
    "system": { "description": "" },
    "effects": [{ /* embedded effect */ }]
}
```

Neue Struktur (Standalone ActiveEffect mit `ilarisTiming`):
```json
{
    "name": "Blutung Stack",
    "type": "base",
    "_id": "<neue-id>",
    "img": "icons/svg/blood.svg",
    "system": {
        "ilarisTiming": {
            "durationType": "ownerTurns",
            "remaining": 3,
            "originalValue": 3,
            "expiresOn": "turnStart"
        }
    },
    "changes": [{ "key": "system.gesundheit.wunden", "mode": 0, "value": "2" }],
    "disabled": false,
    "transfer": true,
    "duration": {},
    "flags": { "nenneke": { "dot": 1, "stack": true } }
}
```

**Wichtige Änderungen**:
- `_id` neu generieren (Kollisionen mit alten Item-IDs vermeiden)
- `"type": "base"` (ActiveEffect)
- `system.ilarisTiming` hinzufügen: `durationType: "ownerTurns"`, `remaining: 3`, `originalValue: 3`, `expiresOn: "turnStart"`
- `"duration"` leeren (wird vom `ilarisTiming`-System verwaltet)
- Kein `"effects"`-Array mehr (ist jetzt selbst der Effect)
- `"changes"` auf Root-Level (nicht mehr in embedded effect)
- `flags` vom embedded Effect übernehmen

**7 zu migrierende Dateien**:
| Datei | Name | img |
|---|---|---|
| `Blutung_*.json` | Blutung Stack | `icons/svg/blood.svg` |
| `Brennen_*.json` | Brennen Stack | `icons/svg/fire.svg` |
| `Erfrieren_*.json` | Erfrieren Stack | `icons/svg/ice-shield.svg` |
| `Ersch_pfung_*.json` | Erschöpfung Stack | `icons/svg/unconscious.svg` |
| `Furcht_*.json` | Furcht Stack | `icons/svg/skull.svg` |
| `Gift_*.json` | Gift Stack | `icons/svg/poison.svg` |
| `Krankheit_*.json` | Krankheit Stack | `icons/svg/biohazard.svg` |

---

### Step 5 — Drop-Handler für neuen Pack-Typ anpassen

**What**: Beide Sheets (`alternative-actor-sheet.js` und `alternative-creature-sheet.js`) haben einen `_onDrop`-Handler, der `effectItem`-Type-Items aus der Effect-Library erkennt und deren embedded Effects extrahiert. Da die Library jetzt standalone `ActiveEffect`-Dokumente enthält, muss der Drop-Handler stattdessen direkt das `ActiveEffect`-Dokument clonen und auf den Actor anwenden.

**Where**: 
- `scripts/sheets/alternative-actor-sheet.js` — `_onDrop()` (ca. Zeile 276: `if (item.type === 'effectItem')`)
- `scripts/sheets/alternative-creature-sheet.js` — `_onDrop()` (ca. Zeile 151: `if (data.type === 'Item' && data.uuid?.includes(...))`)

**Who**: `code` | **Depends on**: Step 4

**Reference**:
- Bestehender Drop-Handler in `alternative-actor-sheet.js:270-300`
- Bestehender Drop-Handler in `alternative-creature-sheet.js:145-175`

**Neue Logik (Actor Sheet)**:
```js
// Effect library drop: ActiveEffect from pack → add directly to actor
if (data.type === 'ActiveEffect' && data.uuid?.includes('ilaris-alternative-actor-sheet.effect-library')) {
    const effect = await fromUuid(data.uuid);
    if (!effect) return;
    
    const effectData = effect.toObject();
    delete effectData._id;
    effectData.origin = this.actor.uuid;
    
    await window.IlarisAlternativeActorSheet.addEffectWithStacking(this.actor, effectData);
    ui.notifications.info(`Effekt ${effect.name} wurde hinzugefügt.`);
    return;
}
```

**Neue Logik (Creature Sheet)**:
Ähnlich, aber `data.type`-Check auf `'ActiveEffect'` statt `'Item'`.

---

### Step 6 — `canAdvanceTime`-Flag beibehalten

**What**: Das `canAdvanceTime`-Flag wird bereits in `_prepareContext()` gesetzt und von den Templates verwendet. Keine Änderung nötig — der "Zeit vorrücken"-Button im Template bleibt unverändert, da nur die JS-Logik dahinter (Step 1) geändert wird.

**Where**: Keine Änderungen an Templates nötig.

**Who**: — | **Depends on**: —

---

### Step 7 — `handlebars-helpers.js` prüfen

**What**: Prüfen ob alle im effect-card.hbs verwendeten Helper (`eq`, `isFiniteValue`, `stringIncludes`) bereits registriert sind. Der `eq`-Helper wird für `ilarisTiming.durationType`-Vergleiche benötigt.

**Where**: `scripts/handlebars-helpers.js`

**Who**: `code` | **Depends on**: Step 3

**Reference**: Bestehende Helper-Registrierung in `module.js:15` (`registerHandlebarsHelpers`)

---

### Step 8 — `npm run pack-all` und Test

**What**: Nach allen Code- und Datenänderungen:
1. `npm run pack-all` ausführen um das effect-library-Kompendium neu zu packen
2. `npm run lint` ausführen
3. In Foundry V14 manuell testen:
   - Effect-Library öffnen → sollte standalone ActiveEffects zeigen
   - Effect auf Actor droppen → sollte mit `ilarisTiming` erstellt werden
   - "Zeit vorrücken" klicken → `remaining` decrementiert, Effekt bei 0 gelöscht
   - Stack-Effekte (Blutung etc.) → Stack-Buttons funktionieren mit `ilarisTiming`
   - Effect-Card zeigt korrekte verbleibende Runden

**Where**: Terminal + Foundry V14

**Who**: `setup` | **Depends on**: Steps 1–7

## 5. Validation Plan

| Step | Validation |
|---|---|
| 1 | `advanceEffectTime()` ruft `npm test` (falls tests existieren) oder manuell: Actor mit `ownerTurns`-Effekt → "Zeit vorrücken" klicken → `remaining` sinkt um 1 |
| 2 | Stack-Effekt mit `ilarisTiming` → Stack erhöhen → `remaining` auf `originalValue` zurückgesetzt |
| 3 | Effect-Card zeigt "3 Runden" statt "3 turns" / "3 Runden" wenn `ilarisTiming` aktiv |
| 4 | `npm run pack-all` → Effect-Library in Foundry öffnen → standalone Effects sichtbar |
| 5 | Effect aus Library droppen → auf Actor angewendet mit korrektem `ilarisTiming` |
| 7 | `npm run lint` → keine Fehler |
| 8 | Manueller Integrationstest in Foundry V14 |

## 6. Assumptions & Open Questions

### Assumptions
- Der `IlarisActiveEffect`-Document-Class wird bereits vom Hauptsystem via `CONFIG.ActiveEffect.documentClass` registriert und das Modul erbt diese Konfiguration.
- Die `IlarisActiveEffectDataModel` ist als `CONFIG.ActiveEffect.dataModels["base"]` registriert, sodass `system.ilarisTiming` automatisch auf allen neuen Effects verfügbar ist.
- Das Modul verwendet `actor.effects` (die ActiveEffect-Collection), nicht `actor.appliedEffects` (die im Template verwendet wird — `appliedEffects` ist eine berechnete Property die alle Effects inkludiert).
- Die CSS-Klassen in `effect-card.css` benötigen keine Anpassung für die neue Duration-Anzeige.

### Open Questions
- Sollte der `advanceEffectTimeForAllActors()`-Button im globalen UI (aus `module.js`) eine Chat-Meldung ausgeben, wenn Effekte ablaufen? (Aktuell: nur numerische Stats)
- Sollen die `flags.nenneke.dot` und `flags.nenneke.stack` bei der Kompendium-Migration erhalten bleiben? (Vermutlich ja, da `addEffectWithStacking` den Namen checkt)

## 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|---|---|---|---|
| 1 | code | `scripts/utilities.js` | `advanceEffectTime()` mit `ilarisTiming`-Logik |
| 2 | code | `scripts/utilities.js` | `increaseEffectStack()` mit `ilarisTiming` |
| 3 | code | `templates/components/effect-card.hbs` | Neue Duration-Anzeige |
| 4 | compendium | `packs/effect-library/_source/*.json`, `module.json` | Standalone ActiveEffect-Dokumente, neuer Pack-Typ |
| 5 | code | `alternative-actor-sheet.js`, `alternative-creature-sheet.js` | Drop-Handler für ActiveEffect-Pack |
| 6 | — | Keine Änderung | — |
| 7 | code | `scripts/handlebars-helpers.js` | Bestätigung dass `eq`-Helper existiert |
| 8 | setup | Terminal | `npm run pack-all && npm run lint`, manueller Test |
