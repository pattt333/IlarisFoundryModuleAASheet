# Plan: Item Accordion Component mit optionalen Features

Wiederverwendbare Accordion-Komponente für Item-Darstellung in verschiedenen Inventar-Bereichen (Mitführend, Verstauend, Handkarren). Die Komponente zeigt Items in einem aufklappbaren Format mit Header-Informationen und Detail-Ansicht.

## Current Implementation

Die Komponente ist bereits implementiert als Handlebars Partial und wird durch verschiedene Templates eingebunden.

### Existing Features

#### Core Structure
- **Header Row**: Item-Image, Name, Stats, Stats2 (optional)
- **Accordion Content**: Item Controls, Item Details
- **Image**: Zeigt Item-Bild (24x24px), optional rollable für Würfelwürfe
- **Ammunition Warning**: Icon bei fehlendem Munition (nur bei Waffen mit Munitionstyp)

#### Item Controls (in Content)
- **Weapon Toggles** (nur bei Waffen): Hauptwaffe/Nebenwaffe Toggle-Buttons
- **Edit Button**: Item bearbeiten
- **Delete Button**: Item löschen

#### Stats Display
- **stats**: Array von Stat-Strings (mit optionalen Tooltips via `statsTooltips`)
- **stats2**: Zweites Array (optional, mit `stats2Tooltips`)

#### Details Section
- Flexible Detail-Rows mit Label/Value Paaren
- Spezielle Formatierung für Description-Felder (`isDescription: true`)
- Null/undefined/empty values werden nicht angezeigt

### Current Parameters

```handlebars
{{> "item-accordion.hbs"
    item=item                    // Item object
    rollable=boolean             // Ob Item-Image clickable für Roll ist
    rolltype="string"            // Art des Rolls (optional)
    fertigkeit="string"          // Fertigkeit für Roll (optional)
    nameLabel="string"           // Label über dem Item-Namen
    stats=(array ...)            // Stats-Array für Anzeige
    statsTooltips=(array ...)    // Tooltips für stats (optional)
    stats2=(array ...)           // Zweites Stats-Array (optional)
    stats2Tooltips=(array ...)   // Tooltips für stats2 (optional)
    itemclass="string"           // CSS-Klasse für Item-Typ
    editTitle="string"           // Tooltip für Edit-Button
    deleteTitle="string"         // Tooltip für Delete-Button
    details=(array ...)          // Detail-Rows Array
    isWeapon=boolean             // Ob Weapon-Toggles angezeigt werden
}}
```

---

## Feature Extensions

Zwei neue optionale Features für erweiterte Funktionalität.

### Feature 1: Optional Drag & Drop Support

Ermöglicht Drag & Drop von Items für Integration mit externen Modulen wie Item Piles (Trade-Funktionalität).

#### Requirements

**Functional Requirements:**
- **Opt-in via Parameter**: `draggable=true/false` (default: `false`)
- **Drag Handle**: Bei aktiviertem Drag wird gesamte Header-Row zu Drag-Handle
- **Visual Feedback**: CSS-Klasse `draggable` auf `.item` Container bei aktiviertem Drag
- **Data Transfer**: Item-UUID wird als `text/plain` und in `dragData` gesetzt
- **Foundry Integration**: Nutzt Foundry's `DragDrop` Helper für Kompatibilität
- **Module Independence**: Keine direkten Item Piles Dependencies

**Technical Implementation:**
- `draggable="true"` Attribut auf `.item` Container wenn Parameter gesetzt
- `data-item-uuid="{{item.uuid}}"` Attribut für Drag-Daten
- CSS `:hover` Cursor-Change bei draggable Items
- Foundry `dragstart` Event mit standardisiertem Data-Format

**Non-Functional Requirements:**
- Keine Breaking Changes für bestehende Verwendungen
- Kein JavaScript in Template (nur HTML/Handlebars)
- CSS-only Visual Feedback
- Performance: Kein Event-Listener overhead bei disabled Drag

#### Implementation Details

##### Template Changes (item-accordion.hbs)

```handlebars
<div class="item accordion-item 
    {{#if draggable}}draggable{{/if}}" 
    data-item-id="{{item._id}}"
    {{#if draggable}}
    draggable="true"
    data-item-uuid="{{item.uuid}}"
    data-transfer-type="Item"
    {{/if}}>
```

##### CSS Additions (item-accordion.css)

```css
.item.draggable {
    cursor: grab;
}

.item.draggable:active {
    cursor: grabbing;
    opacity: 0.7;
}

.item.draggable .item-header-row {
    user-select: none;
}
```

##### Usage Example

```handlebars
{{!-- Mit Drag & Drop aktiviert --}}
{{> "item-accordion.hbs" 
    item=item 
    draggable=true
    nameLabel="Gegenstand"
    ...
}}

{{!-- Ohne Drag & Drop (default) --}}
{{> "item-accordion.hbs" 
    item=item 
    nameLabel="Gegenstand"
    ...
}}
```

##### Event Handling (Actor Sheet)

```javascript
// In activateListeners() method
_onDragStart(event) {
    const itemUuid = event.currentTarget.dataset.itemUuid;
    if (!itemUuid) return;
    
    const item = fromUuidSync(itemUuid);
    if (!item) return;
    
    const dragData = item.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
}

// Bind to draggable items
html.find('.item.draggable').on('dragstart', this._onDragStart.bind(this));
```

---

### Feature 2: Optional Delete Button Visibility

Ermöglicht Kontrolle über Sichtbarkeit des Delete-Buttons (z.B. für Read-Only Views oder Trade-Dialoge).

#### Requirements

**Functional Requirements:**
- **Opt-in via Parameter**: `showDelete=true/false` (default: `true` für Backward Compatibility)
- **Complete Removal**: Button wird nicht gerendert (nicht nur hidden)
- **No Layout Shift**: Item-Controls Layout passt sich an
- **Independent**: Funktioniert unabhängig von Edit-Button

**Use Cases:**
- Trade-Dialogs: Items anzeigen ohne Delete-Option
- Read-Only Inventories: Ansicht ohne Modifikationsmöglichkeiten
- Shared Containers: Nur eigene Items löschbar

#### Implementation Details

##### Template Changes (item-accordion.hbs)

```handlebars
<div class="item-controls">
    {{#if isWeapon}}
    <a class="item-toggle {{item.system.hauptwaffe}}" data-itemid="{{item.id}}"
        data-toggletype="hauptwaffe">
        <span>HW</span>
    </a>
    <a class="item-toggle {{item.system.nebenwaffe}}" data-itemid="{{item.id}}"
        data-toggletype="nebenwaffe">
        <span>NW</span>
    </a>
    {{/if}}
    <a class="item-control item-edit" data-itemclass="{{itemclass}}" data-itemid="{{item._id}}" title="{{editTitle}}">
        <i class="fas fa-edit ilaris-button-icon"></i>
    </a>
    {{#unless (eq showDelete false)}}
    <a class="item-control item-delete" data-itemclass="{{itemclass}}" data-itemid="{{item._id}}" title="{{deleteTitle}}">
        <i class="fas fa-trash ilaris-button-icon"></i>
    </a>
    {{/unless}}
</div>
```

##### Usage Examples

```handlebars
{{!-- Delete Button hidden --}}
{{> "item-accordion.hbs" 
    item=item 
    showDelete=false
    nameLabel="Gegenstand (Trade)"
    ...
}}

{{!-- Delete Button visible (default) --}}
{{> "item-accordion.hbs" 
    item=item 
    nameLabel="Gegenstand"
    ...
}}

{{!-- Explicit visible --}}
{{> "item-accordion.hbs" 
    item=item 
    showDelete=true
    nameLabel="Gegenstand"
    ...
}}
```

---

## Updated Parameters Reference

```handlebars
{{> "item-accordion.hbs"
    // Existing parameters
    item=item
    rollable=boolean
    rolltype="string"
    fertigkeit="string"
    nameLabel="string"
    stats=(array ...)
    statsTooltips=(array ...)
    stats2=(array ...)
    stats2Tooltips=(array ...)
    itemclass="string"
    editTitle="string"
    deleteTitle="string"
    details=(array ...)
    isWeapon=boolean
    
    // NEW: Optional Drag & Drop
    draggable=boolean              // Default: false
    
    // NEW: Optional Delete Button
    showDelete=boolean             // Default: true (backward compatible)
}}
```

---

## Implementation Steps

### Step 1: Add Drag & Drop Support
1. **Update [item-accordion.hbs](templates/components/item-accordion.hbs)** — Add conditional `draggable`, `data-item-uuid`, `data-transfer-type` attributes auf `.item` div, CSS-Klasse `draggable`
2. **Update [item-accordion.css](styles/item-accordion.css)** — Add `.item.draggable` styles mit `cursor: grab/grabbing`, `opacity` bei active, `user-select: none` für header
3. **Update Actor Sheets** — Add `_onDragStart` Handler in [alternative-actor-sheet.js](scripts/sheets/alternative-actor-sheet.js) `activateListeners()`, bind auf `.item.draggable`

### Step 2: Add Optional Delete Button
1. **Update [item-accordion.hbs](templates/components/item-accordion.hbs)** — Wrap delete button in `{{#unless (eq showDelete false)}}` conditional

### Step 3: Update Usage Examples (Optional)
1. **Update [carrying.hbs](templates/components/carrying.hbs)** — Optional: Add `draggable=true` parameter for testing
2. **Update [supporting.hbs](templates/components/supporting.hbs)** — Optional: Add parameters
3. **Update [handcart.hbs](templates/components/handcart.hbs)** — Optional: Add parameters

---

## Integration with Item Piles

Das Modul bleibt vollständig unabhängig von Item Piles, aber ermöglicht Integration:

### How Item Piles Can Use This

```javascript
// Item Piles Trade Dialog könnte Items so rendern:
{{> "modules/ilaris-alternative-actor-sheet/templates/components/item-accordion.hbs"
    item=item
    draggable=true          // Enable Drag & Drop
    showDelete=false        // Hide Delete in Trade Context
    nameLabel="Handelsware"
    ...
}}
```

### Data Format Compatibility

Foundry's Standard Item Drag Data:
```javascript
{
    type: "Item",
    uuid: "Actor.xyz.Item.abc"
}
```

Dieser Standard wird durch die UUID-based Implementation automatisch unterstützt.

---

## Testing Checklist

### Drag & Drop Testing
- [ ] Drag funktioniert nur wenn `draggable=true`
- [ ] Cursor ändert sich zu grab/grabbing
- [ ] Visual Feedback (opacity) bei Drag
- [ ] UUID wird korrekt in `dataTransfer` gesetzt
- [ ] Funktioniert mit Foundry's Drop-Handler
- [ ] Keine Fehler bei `draggable=false` oder nicht gesetzt

### Delete Button Testing
- [ ] Button sichtbar bei `showDelete=true`
- [ ] Button sichtbar bei nicht gesetztem Parameter (default)
- [ ] Button hidden bei `showDelete=false`
- [ ] Kein Layout-Shift beim Verstecken
- [ ] Funktioniert unabhängig von anderen Controls

### Backward Compatibility Testing
- [ ] Alle existierenden Verwendungen funktionieren ohne Änderung
- [ ] Keine Breaking Changes
- [ ] CSS nicht gebrochen
- [ ] Performance keine Regression

---

## Technical Notes

### Why UUID instead of Item ID?
- UUIDs sind globally unique und funktionieren über Actor-Grenzen
- Foundry's `fromUuidSync()` ermöglicht einfache Item-Resolution
- Standard für Foundry's Drag & Drop System

### Why CSS-only Visual Feedback?
- Keine JavaScript-Overhead für Hover-States
- Bessere Performance
- Einfachere Wartung
- Standard Browser-Verhalten

### Why Default `showDelete=true`?
- Backward Compatibility mit allen existierenden Verwendungen
- Erwartetes Standardverhalten (Items sind löschbar)
- Explizites Opt-out für spezielle Fälle

### Module Independence
- Keine direkten Dependencies zu Item Piles
- Standard Foundry Drag & Drop API
- Kann mit beliebigen Modulen verwendet werden
- Trade, Container-Sharing, etc. möglich
