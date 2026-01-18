# Plan: Time-Advance Button für temporäre Effekte

Implementierung eines "Zeit vorrücken"-Buttons im Effects-Tab, der alle temporären Effekte des Actors automatisch um eine Zeiteinheit reduziert. Effekte mit `duration.turns > 0` oder `duration.rounds > 0` werden dekrementiert; bei Erreichen von 0 entfernt das Foundry-System die Effekte automatisch.

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
