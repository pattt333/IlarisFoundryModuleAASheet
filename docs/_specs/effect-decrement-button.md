# Plan: Time-Advance Buttons für temporäre Effekte

Implementierung von zwei "Zeit vorrücken"-Features:
1. **Actor Sheet Button**: Button im Effects-Tab für einzelne Actoren
2. **Scene Control Button**: GM-only Button in der Scene-Steuerleiste für alle Token-Actoren

Beide Features reduzieren temporäre Effekte automatisch um eine Zeiteinheit. Effekte mit `duration.turns > 0` oder `duration.rounds > 0` werden dekrementiert; bei Erreichen von 0 entfernt das Foundry-System die Effekte automatisch.

---

## Feature 1: Actor Sheet Button

Button im Effects-Tab eines einzelnen Actor Sheets.

## Steps

1. **Button-HTML in [effects-tab.hbs](templates/sheets/tabs/effects-tab.hbs#L5-L9) hinzufügen** — Links vom "Effekt Bibliothek" Button einen Button mit `fas fa-stopwatch` Icon und Text "Zeit vorrücken" einfügen, mit CSS-Klasse `effect-advance-time`, bedingtes Rendering via `{{#if canAdvanceTime}}`

2. **Context-Flag in [alternative-actor-sheet.js](scripts/sheets/alternative-actor-sheet.js) `getData()` setzen** — `canAdvanceTime` Boolean basierend auf `this.actor.isOwner` zum Context hinzufügen für bedingtes Button-Rendering

3. **Event-Handler in [alternative-actor-sheet.js](scripts/sheets/alternative-actor-sheet.js) `activateListeners()` registrieren** — Click-Handler für `.effect-advance-time` auf neue Methode `_onEffectAdvanceTime` binden

4. **`_onEffectAdvanceTime()` Methode mit Filterlogik und Batch-Update implementieren** — Filtert `this.actor.effects` nach Effekten mit `duration.turns > 0` ODER `duration.rounds > 0` (Ganzzahlen), erstellt Update-Array das beide Felder dekrementiert, führt `actor.updateEmbeddedDocuments("ActiveEffect", updates)` in try-catch Block aus

5. **Notifications für Erfolg, leere Liste und Fehler hinzufügen** — `ui.notifications.info()` bei erfolgreicher Aktualisierung ("Temporäre Effekte wurden um 1 Zeiteinheit reduziert"), bei leerer Filterliste ("Keine temporären Effekte vorhanden"), und `ui.notifications.error()` im catch-Block bei Fehlschlag

## Requirements Summary

### Functional Requirements
- Button mit Stopwatch-Icon (`fas fa-stopwatch`) und Label "Zeit vorrücken"
- Position: Links vom "Effekt Bibliothek" Button in der items-header
- Sichtbarkeit: Nur für Actor-Owner (`actor.isOwner === true`)
- Deaktivierung: Nur im view-only Modus
- Dekrementiert `duration.turns` UND `duration.rounds` beide um 1, falls > 0
- Filtert nur Effekte mit positiven Ganzzahlen in mindestens einem dieser Felder
- Batch-Update mit `actor.updateEmbeddedDocuments("ActiveEffect", updates)`
- Effekte bei duration = 0 werden automatisch vom Foundry-System entfernt

### User Feedback
- **Erfolg**: Info-Notification "Temporäre Effekte wurden um 1 Zeiteinheit reduziert"
- **Keine Effekte**: Info-Notification "Keine temporären Effekte vorhanden"
- **Fehler**: Error-Notification bei Update-Fehlschlag

### Non-Functional Requirements
- Keine Bestätigungsdialog (direktes Dekrementieren)
- Keine Localization (hardcoded deutsche Texte)
- Button-Styling identisch zu "Effekt Bibliothek" Button
- Einschließlich transferierter Effekte von Items

## Technical Details

### Effect Duration Structure (Foundry v12)
```javascript
{
  duration: {
    startTime: null,      // World time
    seconds: null,        // Duration in seconds
    combat: null,         // Combat ID
    rounds: 2,            // Combat rounds
    turns: 1,             // Combat turns
    startRound: null,
    startTurn: null
  }
}
```

### Filter Logic
```javascript
const temporaryEffects = this.actor.effects.filter(effect => {
  const turns = effect.duration?.turns;
  const rounds = effect.duration?.rounds;
  return (Number.isInteger(turns) && turns > 0) || 
         (Number.isInteger(rounds) && rounds > 0);
});
```

### Update Logic
```javascript
const updates = temporaryEffects.map(effect => ({
  _id: effect.id,
  "duration.turns": Math.max(0, (effect.duration.turns || 0) - 1),
  "duration.rounds": Math.max(0, (effect.duration.rounds || 0) - 1)
}));

await this.actor.updateEmbeddedDocuments("ActiveEffect", updates);
```

---

## Feature 2: Scene Control Button

GM-only Button in der linken Foundry VTT Steuerleiste für alle Token-Actoren auf der aktiven Scene.

### Steps

1. **Hook für Scene Controls registrieren** — `Hooks.on("getSceneControlButtons", (controls) => {...})` in [module.js](module.js) implementieren mit GM-Check `if (!game.user.isGM) return`

2. **Button zu Token Controls hinzufügen** — `tokenControls.tools.push({...})` mit Config: `name: "advance-time-all"`, `icon: "fas fa-stopwatch"`, `title: "Zeit vorrücken (Alle Actoren)"`, `button: true`, `onClick: () => advanceTimeForAllActors()`

3. **`advanceTimeForAllActors()` async Function implementieren** — Prüft `canvas.scene` Existenz mit Warning bei null, iteriert über `canvas.scene.tokens`, extrahiert `actor` von jedem Token

4. **Effect Filtering pro Actor** — Filtert `actor.effects` nach Effekten mit `(Number.isInteger(turns) && turns > 0) || (Number.isInteger(rounds) && rounds > 0)`, identische Logik wie im Actor Sheet Feature

5. **Batch-Update pro Actor** — Erstellt Updates-Array `{_id, "duration.turns": Math.max(0, turns - 1), "duration.rounds": Math.max(0, rounds - 1)}`, führt `actor.updateEmbeddedDocuments("ActiveEffect", updates)` aus

6. **Tracking und Notifications** — Zählt `totalActorsProcessed` und `totalEffectsReduced`, zeigt `ui.notifications.info("Zeit für alle Actoren wurde vorgerückt")` bei Erfolg, Info bei keinen Effekten, Error-Notification im catch-Block, Console-Log mit Statistik

### Requirements Summary

#### Functional Requirements
- **Button Position**: Ganz unten in `main-controls` → Token Controls Liste
- **Icon**: `fas fa-stopwatch` (identisch zum Actor Sheet Button)
- **Tooltip**: "Zeit vorrücken (Alle Actoren)"
- **Sichtbarkeit**: Nur für GM (`game.user.isGM === true`)
- **Target**: Alle Token-Actoren auf aktiver Scene (held + kreatur, inkl. Synthetic Actors)
- **Effect Filtering**: Identisch zum Actor Sheet Feature (turns > 0 ODER rounds > 0, Ganzzahlen)
- **Update**: Batch-Update pro Actor mit `updateEmbeddedDocuments("ActiveEffect", updates)`
- **Dekrementierung**: Beide `duration.turns` UND `duration.rounds` um 1 reduzieren (falls > 0)

#### User Feedback
- **Keine aktive Scene**: Warning "Keine aktive Szene vorhanden"
- **Erfolg**: Info "Zeit für alle Actoren wurde vorgerückt"
- **Keine Effekte**: Info "Keine temporären Effekte auf der Szene vorhanden"
- **Fehler**: Error "Fehler beim Vorrücken der Zeit"
- **Console Log**: `"Advanced time: X actors, Y effects reduced"` für Debugging

#### Non-Functional Requirements
- Keine Bestätigungsdialog (direktes Ausführen)
- Keine detaillierte Statistik in UI (nur Console)
- Keine Localization (hardcoded deutsche Texte)
- Button-Design automatisch durch Foundry Scene Controls styling
- Proper Error Handling mit try-catch
- Funktioniert mit Synthetic Actors (Token-specific actors)

### Technical Details

#### Scene Control Button Registration
```javascript
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;
  
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;
  
  tokenControls.tools.push({
    name: "advance-time-all",
    title: "Zeit vorrücken (Alle Actoren)",
    icon: "fas fa-stopwatch",
    button: true,
    onClick: () => advanceTimeForAllActors()
  });
});
```

#### Token Iteration
```javascript
const tokens = canvas.scene.tokens; // TokenDocument collection

for (const tokenDoc of tokens) {
  const actor = tokenDoc.actor; // Gets actual actor (including synthetic)
  if (!actor) continue;
  
  // Process actor effects...
}
```

#### Effect Filter Logic (reused from Actor Sheet)
```javascript
const temporaryEffects = actor.effects.filter(effect => {
  const turns = effect.duration?.turns;
  const rounds = effect.duration?.rounds;
  return (Number.isInteger(turns) && turns > 0) || 
         (Number.isInteger(rounds) && rounds > 0);
});
```

#### Update Logic per Actor
```javascript
if (temporaryEffects.length === 0) continue;

const updates = temporaryEffects.map(effect => ({
  _id: effect.id,
  "duration.turns": Math.max(0, (effect.duration.turns || 0) - 1),
  "duration.rounds": Math.max(0, (effect.duration.rounds || 0) - 1)
}));

await actor.updateEmbeddedDocuments("ActiveEffect", updates);

totalActorsProcessed++;
totalEffectsReduced += updates.length;
```

#### Notifications
```javascript
if (totalActorsProcessed > 0) {
  ui.notifications.info("Zeit für alle Actoren wurde vorgerückt");
  console.log(`Ilaris Alternative Actor Sheet | Advanced time: ${totalActorsProcessed} actors, ${totalEffectsReduced} effects reduced`);
} else {
  ui.notifications.info("Keine temporären Effekte auf der Szene vorhanden");
}
```

#### Implementation Location

- **File**: [module.js](module.js)
- **Section**: Am Ende der Datei nach dem Ammunition Tracking Hook
- **Function**: `advanceTimeForAllActors()` als standalone async function
- **Hook**: `getSceneControlButtons` für Button-Registration

---

## Shared Technical Details

Beide Features verwenden identische Logik für Effect-Filtering und Duration-Dekrementierung.
