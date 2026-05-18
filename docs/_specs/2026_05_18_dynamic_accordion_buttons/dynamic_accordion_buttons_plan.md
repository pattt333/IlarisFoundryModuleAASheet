# Plan: Dynamic Button System für Item-Accordion

**Date:** 2026-05-18  
**Status:** Ready for Implementation

---

## 1. Objective

Erweitere das Item-Accordion um ein generisches, dynamisches Button-System, das es erlaubt, pro Aufruf optional weitere Controls neben Edit/Delete anzuzeigen (Flag-basiert), und implementiere konkret ein Mengen-`+`/`−` System für Inventar-Items, das beim Klick sofort speichert und bei Erreichen von `0` das Item löscht.

---

## 2. Context & Research Summary

### Aktuelle Struktur
- **item-accordion.hbs** rendert derzeit fest: Bild, Name, Stats, Details, sowie im `.item-controls` Block die Buttons `Edit`, `Delete` und optional Waffen-Toggle (`HW`/`NW`).
- **carrying.hbs** nutzt item-accordion und zeigt Menge in `.item-stats` an (`Anzahl: {{item.system.quantity}}`).
- **kampf-tab.hbs** zeigt Waffen mit zusätzlichen HW/NW Toggle-Buttons in den gleichen Controls.
- **Alternative Actor Sheet** registriert Actions via `static DEFAULT_OPTIONS.actions` (z. B. `itemCreate`, `itemEdit`).

### Pattern-Erkenntnis
- Handlebars Templates unterstützen `each` loops und conditionals; dynamische Buttons können via `extraButtons` Array übergeben werden.
- Item-Actions (Edit, Delete, Toggle) sind im Sheet registriert und event-gebunden an `data-action` Attribute.
- Die Menge ist unter `item.system.quantity` verfügbar (seen in carrying.hbs).

### Gewünschte Erweiterung
1. **Generisches Button-System**: `extraButtons` Array im Template-Context, jeder Button mit Label, Icon, Tooltip, Action-Name und optionalen Data-Attributen.
2. **Flag-Basiert**: Button wird nur gerendert, wenn `showExtraButtons` (oder ähnliches Flag) `true` ist.
3. **Quantity-Aktion**: Action `itemQuantityChange` mit `delta` (+1 oder -1), direkte Speicherung, Auto-Delete bei Quantity = 0.

---

## 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `templates/components/item-accordion.hbs` | modify | Neuer Block für dynamische `extraButtons`-Loop im `.item-controls` Bereich |
| `styles/item-accordion.css` | modify | Neue Klasse `.item-extra-button` für Styling dynamischer Buttons |
| `scripts/sheets/alternative-actor-sheet.js` | modify | Neue Action `itemQuantityChange` registrieren; Handler implementieren |
| `templates/components/carrying.hbs` | modify | `extraButtons` Context für Menge-Plus/Minus Buttons hinzufügen |

---

## 4. Steps

### Step 1: Accordion-Template um generisches Button-System erweitern
**What:**  
Erweitere `templates/components/item-accordion.hbs`. Nach den existierenden Item-Controls (Edit/Delete/Waffen-Toggle), füge einen neuen `{{#if showExtraButtons}}` Block hinzu, der über `extraButtons` Array loopt und dynamisch Button-HTML erzeugt. Jeder Button wird mit `data-action`, `data-delta` (oder Custom Attributes) und Icon/Label gerendert.

**Where:**  
`templates/components/item-accordion.hbs`, innerhalb `.item-controls` nach den bestehenden Buttons (~Zeile 36–45).

**Who:**  
code

**Depends on:**  
none

**Reference:**  
- Attached `item-accordion.hbs` zeigt aktuelle Struktur
- Handlebars `each` Loop für dynamische Inhalte
- Existierende Toggle-Button-Muster (`item-toggle` mit `data-toggletype` etc.)

**Implementation Detail:**  
```handlebars
{{#if showExtraButtons}}
{{#each extraButtons as |btn|}}
<a class="item-control item-extra-button {{#if btn.class}}{{btn.class}}{{/if}}" 
   data-action="{{btn.action}}"
   {{#if btn.data}}{{#each btn.data as |val key|}}data-{{key}}="{{val}}"{{/each}}{{/if}}
   {{#if btn.tooltip}}data-tooltip="{{btn.tooltip}}"{{/if}}
   title="{{btn.tooltip}}">
  <i class="{{btn.icon}}"></i>{{#if btn.label}}<span>{{btn.label}}</span>{{/if}}
</a>
{{/each}}
{{/if}}
```

---

### Step 2: CSS für dynamische Buttons
**What:**  
In `styles/item-accordion.css` füge neue Klasse `.item-extra-button` hinzu, die visuell konsistent mit `.item-control` ist, aber ggf. mit anderem Hover-Verhalten (z. B. subtiler Highlight für Plus/Minus).

**Where:**  
`styles/item-accordion.css`, neuer Block nach `.item-control` Definitionen.

**Who:**  
code

**Depends on:**  
Step 1 (für Klassen-Referenzen)

**Reference:**  
Bestehende `.item-control`, `.item-toggle` Styling in `styles/item-accordion.css`

**Implementation Detail:**  
```css
.item-extra-button {
  /* Inherit from item-control pattern */
  /* Optional: hover state for quantity buttons */
}
```

---

### Step 3: Action Handler in Actor Sheet registrieren
**What:**  
In `scripts/sheets/alternative-actor-sheet.js`:
1. Registriere neue Action `itemQuantityChange` in `static DEFAULT_OPTIONS.actions`.
2. Implementiere Static Handler `static onItemQuantityChange(event, target)`:
   - Extrahiere `data-itemid` und `data-delta` vom Event Target.
   - Hole das Item via `this.actor.items.get(itemId)`.
   - Berechne `newQuantity = currentQuantity + delta`.
   - Falls `newQuantity <= 0`: Lösche das Item (`await item.delete()`).
   - Sonst: Speichere `item.update({ 'system.quantity': newQuantity })`.

**Where:**  
`scripts/sheets/alternative-actor-sheet.js`, im `DEFAULT_OPTIONS.actions` (~Zeile 45–50) und neue Static Method.

**Who:**  
code

**Depends on:**  
none

**Reference:**  
- Bestehende Handler wie `onItemCreate`, `onItemEdit` im gleichen File
- Foundry Item API: `actor.items.get()`, `item.update()`, `item.delete()`

---

### Step 4: Carrying-Template um Menge-Buttons erweitern
**What:**  
In `templates/components/carrying.hbs`, bei jedem Item-Accordion-Aufruf, setze:
- `showExtraButtons=true`
- `extraButtons=(array (hash action="itemQuantityChange" icon="fas fa-plus" delta=1 tooltip="Menge erhöhen" class="quantity-plus") (hash action="itemQuantityChange" icon="fas fa-minus" delta=-1 tooltip="Menge verringern" class="quantity-minus"))`

Sorge dafür, dass bei jedem Button die `data-itemid` und `data-delta` korrekt gesetzt werden.

**Where:**  
`templates/components/carrying.hbs`, in den `item-accordion` Partial-Includes (~Zeile 8–20).

**Who:**  
code

**Depends on:**  
Step 1 (Template-System muss ready sein), Step 3 (Action muss registriert sein)

**Reference:**  
- Attached `carrying.hbs` zeigt aktuelle Struktur
- Handlebars `hash` und `array` Helper für Context-Objekte

---

### Step 5: Testen & Validieren
**What:**  
1. Manuell im Foundry UI:
   - Öffne ein Character-Sheet, tab "Inventar".
   - Verifiziere, dass Plus/Minus Buttons neben den Gegenstände-Namen erscheinen.
   - Klicke Plus: Menge sollte sich um 1 erhöhen, direkt sichtbar im Stats-Display.
   - Klicke Minus: Menge sollte sich um 1 verringern.
   - Klicke Minus bei Menge=1: Item sollte gelöscht werden, List-Entry verschwindet.
2. ESLint & Prettier auf alle geänderten Files anwenden.
3. Keine Console-Fehler.

**Where:**  
Alle geänderten Files; manual Foundry-Test.

**Who:**  
code (Implementierung + Smoke-Test)

**Depends on:**  
Step 1–4 (alle implementiert)

**Reference:**  
- Bestehende Accordion-Behavior (Edit, Delete funktionieren)
- Item-Delete-Logik (bereits vorhanden)

---

## 5. Validation Plan

### Build & Lint
```bash
npm run lint
npm run prettier
```
Erwartet: Keine Fehler/Warnings in den geänderten Files.

### Manual Foundry Test (Smoke Test)
1. Starte `npm run start-foundry` (oder öffne Foundry manuell).
2. Öffne ein Character-Sheet.
3. Tab "Inventar" → Bereich "Mitführend".
4. Verifiziere:
   - Plus/Minus Buttons erscheinen neben jedem Item.
   - Plus klick → Quantity erhöht sich um 1 (sofort sichtbar in `.item-stats`).
   - Minus klick → Quantity verringert sich um 1.
   - Minus bei Qty=1 → Item wird gelöscht, verschwindet aus der Liste.
   - Edit/Delete Buttons funktionieren weiterhin normal.
5. Prüfe andere Tabs (Kampf, Skills), dass dort keine unerwünschten Buttons auftauchen (weil `showExtraButtons` nicht gesetzt/false).

### Erwartete Ausgänge
- Quantity kann flüssig geändert werden ohne Formulär-Submission.
- Bei Qty=0 wird Item sofort gelöscht.
- Keine visuellen Artefakte oder Layout-Bruch im Accordion.
- Keine Console-Fehler während des Tests.

---

## 6. Assumptions & Open Questions

### Assumptions
1. Die Menge ist unter `item.system.quantity` gespeichert (bestätigt durch `carrying.hbs`).
2. `this.actor.items.get(id)` und `item.update()` / `item.delete()` sind die Standard-Foundry-APIs.
3. Der Item-Editor (Edit-Button) wird nicht automatisch durch diesen Change beeinträchtigt.
4. Andere Tabs (Kampf, Skills, Zauber) sollen NICHT die Menge-Buttons zeigen → `showExtraButtons` bleibt ungesetzt oder `false` in deren Accordion-Aufrufen.

### Open Questions
- Sollten Waffen im Kampf-Tab auch Menge-Buttons bekommen? (Antwort: Nein, laut Anforderung nur beim Inventar-Flag)
- Gibt es einen Minimum-Wert für Menge (z. B. `1` statt `0`)? (Antwort: Nein, auf `0` → Löschen laut Anforderung)

---

## 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|---|---|---|---|
| 1 | code | Accordion-Template-Struktur, Handlebars-Helpers | `item-accordion.hbs` mit `extraButtons` Loop |
| 2 | code | CSS-Muster aus `item-accordion.css` | Neue `.item-extra-button` Klasse |
| 3 | code | Bestehende Action-Handler-Pattern | `itemQuantityChange` Action registriert & implementiert |
| 4 | code | Carrying-Template, Context-Helpers | `carrying.hbs` mit `showExtraButtons` + `extraButtons` |
| 5 | code | Alle implementierten Changes | Lokale Tests grün, keine Console-Fehler |

