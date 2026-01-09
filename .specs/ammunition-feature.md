# Plan: Ammunition Tracking für Fernkampfwaffen

Feature zur automatischen Munitionsverbrauchsverwaltung für Fernkampfwaffen mit den Eigenschaften "Kugel", "Pfeil" oder "Bolzen". Das System zeigt visuell fehlende Munition an, verbraucht automatisch Munition bei Angriffen und implementiert die Fumble-Regeltabelle für Fernkampfangriffe mit Schadenswürfen und Blutung-Effekt.

## Steps

### 1. World Setting registrieren

Füge in [module.js](module.js) `Hooks.once('init')` ein `game.settings.register("ilaris-alternative-actor-sheet", "ammunitionTracking", {...})` hinzu mit name "Munitionsverwaltung aktivieren", scope "world", config true (nur GM-sichtbar), type Boolean, default true.

### 2. Munitionsprüfung in getData() implementieren

Erweitere `getData()` in [alternative-actor-sheet.js](scripts/sheets/alternative-actor-sheet.js): Für jeden `fernkampfwaffe`-Item bei `actor.type === "held"`, prüfe ob Setting aktiv ist, finde Eigenschaft mit `item.system.eigenschaften.find(e => ['Kugel', 'Pfeil', 'Bolzen'].includes(e.key))`, extrahiere `e.key` als `ammunitionType`. Suche `gegenstand` in `actor.items` mit `item.name === ammunitionType && item.system.quantity > 0`. Füge zu jedem Fernkampfwaffen-Item im Context: `item.hasAmmunition` (boolean), `item.ammunitionType` (string oder undefined).

### 3. UI-Overlay für fehlende Munition

Erweitere [item-accordion.hbs](templates/components/item-accordion.hbs): Innerhalb `.item-image.rollable` div, füge conditional `{{#unless item.hasAmmunition}}{{#if item.ammunitionType}}<i class="fas fa-exclamation-triangle ammunition-warning" data-tooltip="Keine Munition vorhanden"></i>{{/if}}{{/unless}}` hinzu. Erstelle CSS in [item-accordion.css](styles/item-accordion.css): `.ammunition-warning { position: absolute; top: 2px; right: 2px; color: #ff6b6b; font-size: 20px; z-index: 10; pointer-events: none; text-shadow: 0 0 3px black; }`.

### 4. Hook-Handler Grundstruktur mit Locking

Implementiere in [module.js](module.js) `Hooks.on('Ilaris.fernkampfAngriffClick', async (rollResult, actor, item) => {...})`: Prüfe Setting via `game.settings.get()`, prüfe `actor.type === "held"`. Implementiere einfachen Locking-Mechanismus: Prüfe Flag `actor.getFlag("ilaris-alternative-actor-sheet", "processingAmmunition")`, falls true return early. Setze Flag auf true via `actor.setFlag()` zu Beginn, setze auf false am Ende (try-finally Block). Extrahiere Munitionstyp aus `item.system.eigenschaften.find()`.

### 5. Fumble-Handling und Munitionsverbrauch

Im Hook: Falls `rollResult.fumble === true`, würfle `new Roll("2d6")`, evaluiere async. Erstelle ChatMessage mit inline HTML: Roter container `<div style="border: 2px solid #ff0000; padding: 10px;"><h3><i class="fas fa-skull-crossbones"></i> Fernkampf-Fumble!</h3><p><strong>2W6 Ergebnis:</strong> ${roll.total}</p><p>${effectText}</p></div>`. 

Effect-Text basierend auf Roll: 
- **(2)** Hole "Blutung" aus `game.packs.get("ilaris-alternative-actor-sheet.effect-library")`, `pack.getDocuments()`, finde nach Name, clone und `actor.createEmbeddedDocuments("Item", [itemData])`, bei Fehler `ui.notifications.warn()` und Chat-Text "Blutung muss manuell hinzugefügt werden", verbrauche 1 Munition. 
- **(3)** Text "Doppelter Munitionsverbrauch", verbrauche 2 Munition (silent wenn nicht vorhanden). 
- **(4-8)** Text "Fehlschuss, Waffe muss mit einer Aktion bereit gemacht werden", verbrauche 1 Munition. 
- **(9-11)** Würfle `new Roll(item.system.schaden)`, evaluiere, Text "Ein Verbündeter erleidet ${damageRoll.total} Schaden (Hälfte aufgerundet: ${Math.ceil(damageRoll.total/2)})", verbrauche 1 Munition. 
- **(12)** Würfle Schaden, Text "Du erleidest ${damageRoll.total} Schaden", addiere via `actor.update({"system.gesundheit.wunden": actor.system.gesundheit.wunden + damageRoll.total})`, verbrauche 1 Munition. 

Bei nicht-Fumble: Verbrauche 1 Munition. 

Munitionsverbrauch-Helper: Suche `gegenstand` mit `ammunitionType`, falls nicht vorhanden zeige `ui.notifications.warn()` und ChatMessage mit Actor name/img, falls vorhanden: `update({"system.quantity": newQty})`, bei 0 `delete()`.

## Technical Specification Details

### Datenstrukturen

- `actor.type`: String, Wert "held" für Spieler-Charaktere
- `item.system.eigenschaften`: Array von `{key: string, parameters: array}`
- `item.system.quantity`: Number (positiver Integer)
- `item.system.schaden`: String (z.B. "1d6+2", verwendbar in `new Roll()`)
- `actor.system.gesundheit.wunden`: Number

### Munitionsverbrauch-Logik

- Normal: 1 Stück verbrauchen
- Fumble-Ergebnis 2: 1 Stück (+ Blutung)
- Fumble-Ergebnis 3: 2 Stück (falls nur 1 vorhanden, nur 1 verbrauchen und löschen)
- Bei Quantity 0 erreicht: Item via `.delete()` löschen
- Falls kein Munitions-Item: `ui.notifications.warn()` + ChatMessage

### ChatMessage-Format für Fumbles

```javascript
ChatMessage.create({
  speaker: ChatMessage.getSpeaker({actor}),
  content: `<div style="border: 2px solid #ff0000; padding: 10px; border-radius: 5px;">
    <h3><i class="fas fa-skull-crossbones"></i> Fernkampf-Fumble!</h3>
    <p><strong>2W6 Ergebnis:</strong> ${roll.total}</p>
    <p>${effectDescription}</p>
  </div>`
});
```

### Locking-Mechanismus

```javascript
// Am Anfang der Hook-Funktion
if (actor.getFlag("ilaris-alternative-actor-sheet", "processingAmmunition")) return;
try {
  await actor.setFlag("ilaris-alternative-actor-sheet", "processingAmmunition", true);
  // ... Haupt-Logik ...
} finally {
  await actor.setFlag("ilaris-alternative-actor-sheet", "processingAmmunition", false);
}
```

### Blutung-Item aus Pack

```javascript
const pack = game.packs.get("ilaris-alternative-actor-sheet.effect-library");
const documents = await pack.getDocuments();
const blutungItem = documents.find(d => d.name === "Blutung");
if (blutungItem) {
  const itemData = blutungItem.toObject();
  await actor.createEmbeddedDocuments("Item", [itemData]);
}
```

## Fumble-Regeltabelle (Referenz)

| 2W6 | Auswirkung |
|-----|------------|
| 2 | Du erhältst einen Stack Blutung |
| 3 | Du verbrauchst doppelt so viel Munition |
| 4-8 | Fehlschuss, du musst deine Waffe mit einer Aktion Bereit machen |
| 9-11 | Ein Verbündetes Ziel in Reichweite (vom Spielleiter gewählt oder nächstes Ziel in der Schusslinie) erleidet die Hälfte deines normalen Waffenschadens (aufgerundet). Falls keines vorhanden ist, verfehlt der Schuss knapp deinen eigenen Fuß |
| 12 | Du erleidest deinen Waffenschaden |

## Implementierungs-Details

### Munitionsprüfung nur für relevante Waffen

- Nur Fernkampfwaffen mit Eigenschaften "Kugel", "Pfeil" oder "Bolzen" benötigen Munition
- Munitionsname muss exakt mit Eigenschaftsname übereinstimmen (case-sensitive)
- Nur Items vom Typ "gegenstand" werden für Munitionssuche berücksichtigt

### UI-Verhalten

- Exclamation-Icon erscheint nur wenn:
  - Setting ist aktiviert
  - Actor ist vom Typ "held"
  - Waffe hat Munitions-Eigenschaft
  - Keine passende Munition im Inventar (quantity > 0)
- Icon verschwindet automatisch wenn Munition hinzugefügt wird (Sheet re-rendered durch System)

### Hook-Verhalten

- Hook wird nur für Actor type "held" verarbeitet
- Locking verhindert Race Conditions bei schnellen Klicks
- Alle ChatMessages sind public (für alle Spieler sichtbar)
- Notifications sind nur für den auslösenden Client sichtbar

### Error-Handling

- Fehlende Munition: Warning + ChatMessage, Roll wird nicht verhindert
- Fehlendes Blutung-Item: Warning + ChatMessage-Hinweis auf manuelle Addition
- Pack-Zugriff fehlgeschlagen: Silent fail mit Console-Error

Diese Spezifikation ist vollständig und kann direkt von einem Implementierungs-Agenten verwendet werden.
