# Migration Progress: ApplicationV2 für Alternative Sheets

**Status:** In Arbeit  
**Datum:** 2026-02-20  
**Bearbeiter:** GitHub Copilot (Claude Opus 4.6)

---

## ✅ Erledigte Tasks

### PHASE 1: Code-Deduplication & Cleanup — ERLEDIGT

#### Task 1.1: `alternative-actor-sheet.js` - Methoden-Deduplication ✅
- **Entfernt:**
  - `_onSchipIncrease()` / `_onSchipDecrease()` — als deduplizierte V1-Instanzmethoden entfernt. Ersetzt durch neue statische Actions `onSchipIncrease`/`onSchipDecrease` (da die Alternative Sheet ein anderes Schip-UI als die Basis-HeldenSheet nutzt: +/- Buttons statt Toggle-Kreise)
  - `_onAccordionToggle()` — entfernt (Dead Code, AccordionManager handhabt alles)
  - `_getAccordionStorageKey()`, `_saveAccordionState()`, `_removeAccordionState()`, `_clearAccordionStates()` — entfernt (AccordionManager handhabt alles)
  - `_updateObject()` — entfernt (war nur ein Pass-Through zu `super._updateObject()`)
  - `_getHeaderButtons()` — entfernt (ersetzt durch `window.controls` in DEFAULT_OPTIONS)

#### Task 1.2: `alternative-creature-sheet.js` - Methoden-Deduplication ✅
- Die im Task genannten DragDrop-Methoden (`_canDragStart`, `_canDragDrop`, `_onDragStart`, `_onDragOver`, `_onDropItemCreate`) waren in der Alternative Creature Sheet nicht vorhanden — kein Handlungsbedarf
- `_getHeaderButtons()` — entfernt (ersetzt durch `window.controls`)

---

### PHASE 2: Klassen-Deklaration zu ApplicationV2 — ERLEDIGT

#### Task 2.1: `alternative-actor-sheet.js` - DEFAULT_OPTIONS ✅
- `static get defaultOptions()` → `static DEFAULT_OPTIONS = {...}`
- `classes: ["alternative"]` — wird mit Parent-Klassen gemerged (ilaris, sheet, actor, helden)
- `position: { width: 820, height: 900 }`
- `window.controls` für UUID-Copy-Button
- `actions` mit allen 12 statischen Action-Methoden
- `scrollY` und `tabs` entfernt (obsolet in AppV2)

#### Task 2.2: `alternative-creature-sheet.js` - DEFAULT_OPTIONS ✅
- Gleicher Prozess wie 2.1
- `classes: ["alternative"]` — wird mit Parent-Klassen gemerged (ilaris, kreatur)
- 9 Actions definiert (kein Schip- oder Rest-System für Kreaturen)

**Zusätzlich: `static PARTS` definiert**
- Actor Sheet: `form` Part mit `templates/sheets/character/alternative-actor-sheet.hbs`
- Creature Sheet: `form` Part mit `templates/sheets/npc/alternative-creature-sheet.hbs`

---

### PHASE 3: Lifecycle-Methoden-Migration — ERLEDIGT

#### Task 3.1: `alternative-actor-sheet.js` - _prepareContext() ✅
- `async getData()` → `async _prepareContext(options)`
- Ruft `await super._prepareContext(options)` auf
- Alle Context-Daten vorbereitet: effectItems, canAdvanceTime, ammunition status
- Fallback-Context bei Fehler
- `_preparePartContext(partId, context)` überschrieben — gibt Context direkt durch für monolithisches Template

#### Task 3.2: `alternative-creature-sheet.js` - _prepareContext() ✅
- Gleiche Migration
- Zusätzliche Daten: kreaturItemOptions, isCaster, canAdvanceTime

---

### PHASE 4: Event-Handler Migration — ERLEDIGT

#### Task 4.1: `alternative-actor-sheet.js` - _onRender() + Actions ✅
- `activateListeners(html)` → `_onRender(context, options)`
- jQuery-Events durch `data-action` Attribute im HTML ersetzt
- AccordionManager und FavoritesManager werden weiterhin in `_onRender()` initialisiert (nutzen noch jQuery intern)
- DragDrop wird in `_onRender()` aufgebaut und an `this.element` gebunden
- close()-Override behält `accordionManager.clearAccordionStates()`

#### Task 4.2: `alternative-creature-sheet.js` - _onRender() + Actions ✅
- Gleiche Migration
- Minimaler `_onRender()` — ruft nur `super._onRender()` auf, da alle Events via Actions

---

### PHASE 5: Methoden zu Static Actions konvertieren — ERLEDIGT

#### Task 5.1: `alternative-actor-sheet.js` ✅
Alle Methoden zu statischen Actions konvertiert:
| Alt (Instanz-Methode) | Neu (Static Action) |
|---|---|
| `_onEnergySettings()` | `static async onEnergySettings(event, target)` |
| `_onHealthSettings()` | `static async onHealthSettings(event, target)` |
| `_onOpenEffectLibrary()` | `static async onOpenEffectLibrary(event, target)` |
| `_onEditStat()` | `static async onEditStat(event, target)` |
| `_onHexagonEdit()` | `static async onHexagonEdit(event, target)` |
| `_onEffectStackIncrease()` | `static async onEffectStackIncrease(event, target)` |
| `_onEffectStackDecrease()` | `static async onEffectStackDecrease(event, target)` |
| `_onEffectAdvanceTime()` | `static async onEffectAdvanceTime(event, target)` |
| `_onRest()` | `static async onRest(event, target)` |
| `_onCopyUUID()` | `static async onCopyUUID(event, target)` |
| `_onSchipIncrease()` | `static async onSchipIncrease(event, target)` |
| `_onSchipDecrease()` | `static async onSchipDecrease(event, target)` |

`this` in allen Actions = Application-Instanz (AppV2 Konvention)

#### Task 5.2: `alternative-creature-sheet.js` ✅
Gleiches für alle 9 Action-Methoden.

---

### PHASE 6: jQuery-Entfernung & Vanilla DOM — TEILWEISE ERLEDIGT

#### Task 6.1: `alternative-actor-sheet.js` ✅
- **Alle neuen Action-Methoden** verwenden Vanilla DOM:
  - `target.dataset` statt `$(event.currentTarget).data()`
  - `target.querySelector()` statt `$(element).find()`
  - `element.getAttribute()` statt `$(element).attr()`
- **jQuery verbleibt in:**
  - Dialog-Callbacks (`html.find('[name="..."]').val()`) — diese Dialoge nutzen V1 Dialog API, die jQuery erwartet
  - `_onRender()`: `$(this.element)` für AccordionManager/FavoritesManager (diese Manager nutzen intern jQuery)
- **Grund:** AccordionManager und FavoritesManager müssten separat zu Vanilla DOM migriert werden

#### Task 6.2: `alternative-creature-sheet.js` ✅
- Gleicher Status wie 6.1

---

### PHASE 8: Form-Submission Migration — ERLEDIGT

#### Task 8.1 & 8.2 ✅
- `_updateObject()` entfernt
- Form-Submission erfolgt über die Basis-Klasse `IlarisActorSheet` die bereits `form: { submitOnChange: true, closeOnSubmit: false }` in DEFAULT_OPTIONS definiert hat

---

### Template-Updates — ERLEDIGT (Hauptteil)

Folgende Templates wurden mit `data-action` Attributen aktualisiert:

| Template | Geänderte Elemente |
|---|---|
| `character/alternative-actor-sheet.hbs` | `.hex-main` → `data-action="rollable"`, `.hex-small` → `data-action="hexagonEdit"`, `.editable-stat` → `data-action="editStat"`, `.schip-decrease` → `data-action="schipDecrease"`, `.schip-increase` → `data-action="schipIncrease"`, `.rest-button` → `data-action="rest"`, `.toggle-bool` → `data-action="toggleBool"` |
| `npc/alternative-creature-sheet.hbs` | `.hex-main` → `data-action="rollable"`, `.hex-small` → `data-action="hexagonEdit"`, `.editable-stat` → `data-action="editStat"`, `.toggle-bool` → `data-action="toggleBool"` |
| `components/energy-resources.hbs` | Alle `.energy-settings` → `data-action="energySettings"` (4 Stellen) |
| `components/health-resources.hbs` | `.energy-settings[data-health-settings]` → `data-action="healthSettings"` |
| `components/effect-card.hbs` | `.effect-stack-increase` → `data-action="effectStackIncrease"`, `.effect-stack-decrease` → `data-action="effectStackDecrease"`, `.item-edit` → `data-action="itemEdit"`, `.item-delete` → `data-action="itemDelete"` |
| `components/item-accordion.hbs` | `.rollable` → `data-action="rollable"`, `.item-edit` → `data-action="itemEdit"`, `.item-delete` → `data-action="itemDelete"`, `.item-toggle` → `data-action="toggleItem"` |
| `character/tabs/effects-tab.hbs` | `.effect-advance-time` → `data-action="effectAdvanceTime"`, `.effect-library-open` → `data-action="openEffectLibrary"` |
| `character/tabs/kampf-tab.hbs` | `data-action="edit"` → `data-action="itemEdit"`, `data-action="delete"` → `data-action="itemDelete"` |
| `npc/tabs/creature-kampf-tab.hbs` | Alle `.rollable` → `data-action="rollable"`, `.item-edit` → `data-action="itemEdit"`, `.item-delete` → `data-action="itemDelete"`, `.effect-advance-time` → `data-action="effectAdvanceTime"`, `.effect-library-open` → `data-action="openEffectLibrary"` |
| `npc/tabs/creature-allgemein-tab.hbs` | `.item-edit` (Eigenschaft) → `data-action="itemEdit"`, `.item-edit` (Fertigkeit) → `data-action="itemEdit"`, `.rollable` (Fertigkeit) → `data-action="rollable"` |

---

## ⚠️ Offene / Verbleibende Tasks

### PHASE 6: jQuery in Managern (Task 6.1/6.2 — Teilweise offen)
- `AccordionManager` nutzt jQuery intern (`.find()`, `.click()`, `.hasClass()`, `.addClass()`, `.removeClass()`)
- `FavoritesManager` nutzt jQuery intern (`.click()`, `.toggleClass()`, `.find()`, `.addClass()`, `.removeClass()`)
- **Empfehlung:** Separate Migration dieser Manager-Klassen zu Vanilla DOM

### PHASE 7: Dialog-System Modernisierung — NICHT BEGONNEN
#### Task 7.1 & 7.2: Dialoge zu V2 API
- Alle Dialoge nutzen noch V1 `Dialog` Klasse
- Dialoge: `onEnergySettings`, `onHealthSettings`, `onEditStat`, `onHexagonEdit`, `onRest`
- **Empfehlung:** Migiere zu `foundry.applications.api.DialogV2` oder `Dialog.prompt()` in einem zukünftigen Schritt
- **Priorität:** Niedrig — V1 Dialog funktioniert weiterhin in V13

### PHASE 9: Template-Struktur Anpassung — NICHT BEGONNEN
#### Task 9.1 & 9.2: PARTS-Struktur
- Monolithische Templates beibehalten (wie im Task-Dokument empfohlen)
- Potenzielle zukünftige Optimierung: Aufteilen in echte PARTS für Partial-Rendering
- **Priorität:** Niedrig — funktioniert mit monolithischem Ansatz

### PHASE 10: Helper-Methoden & Utilities — TEILWEISE ERLEDIGT
#### Task 10.1: DragDrop ✅
- Actor Sheet: DragDrop in `_onRender()` neu implementiert mit Vanilla DOM `DragDrop` Klasse
- Creature Sheet: Nutzt übergeordneten `_onDrop()` Override für Effect-Library-Drops

#### Task 10.2: AccordionManager & FavoritesManager — OFFEN
- Manager werden weiterhin in `_onRender()` statt `activateListeners()` initialisiert ✅
- Manager nutzen intern noch jQuery — separate Migration empfohlen

#### Task 10.3: Utility-Funktionen — ERLEDIGT
- Alle alten Accordion-Hilfsmethoden entfernt (Dead Code)
- DragDrop-Methoden refaktoriert

### Template-Updates — ✅ VOLLSTÄNDIG ERLEDIGT
- Alle Templates wurden aktualisiert, inklusive aller 9 Vorteil-Kategorie `item-edit` Links in `creature-allgemein-tab.hbs`

### PHASE 11: Testing & Validierung — NICHT BEGONNEN
#### Task 11.1: Funktionalitäts-Tests
- Alle genannten Funktionen müssen in Foundry VTT v13 getestet werden
- Insbesondere: Tab-Switching (funktioniert mit AppV2 tabGroups?), Schips, DragDrop, Dialoge

#### Task 11.2: Browser-Konsolen-Check
- Keine jQuery-Fehler prüfen
- Keine undefined `this`-Kontexte in Actions prüfen
- Template-Rendering prüfen

---

## 📁 Geänderte Dateien

### JavaScript (komplett neu geschrieben):
1. `scripts/sheets/alternative-actor-sheet.js` — 530 Zeilen (vorher: 941)
2. `scripts/sheets/alternative-creature-sheet.js` — 410 Zeilen (vorher: 574)

### Templates (data-action Attribute hinzugefügt):
3. `templates/sheets/character/alternative-actor-sheet.hbs`
4. `templates/sheets/npc/alternative-creature-sheet.hbs`
5. `templates/components/energy-resources.hbs`
6. `templates/components/health-resources.hbs`
7. `templates/components/effect-card.hbs`
8. `templates/components/item-accordion.hbs`
9. `templates/sheets/character/tabs/effects-tab.hbs`
10. `templates/sheets/character/tabs/kampf-tab.hbs`
11. `templates/sheets/npc/tabs/creature-kampf-tab.hbs`
12. `templates/sheets/npc/tabs/creature-allgemein-tab.hbs`

### Nicht geändert:
- `module.js` — keine Änderungen nötig (Sheet-Registrierung bleibt gleich)
- `scripts/components/accordion-manager.js` — nutzt noch jQuery (separate Migration)
- `scripts/components/favorites-manager.js` — nutzt noch jQuery (separate Migration)
- `scripts/utilities.js` — keine Änderungen nötig

---

## 📊 Zusammenfassung

| Phase | Status | Kommentar |
|---|---|---|
| Phase 1: Deduplication | ✅ Erledigt | Alle duplizierten Methoden entfernt |
| Phase 2: DEFAULT_OPTIONS | ✅ Erledigt | Beide Sheets migriert |
| Phase 3: _prepareContext | ✅ Erledigt | getData → _prepareContext |
| Phase 4: Event-Handler | ✅ Erledigt | activateListeners → _onRender + Actions |
| Phase 5: Static Actions | ✅ Erledigt | Alle 21 Action-Methoden konvertiert |
| Phase 6: jQuery-Entfernung | ⚠️ Teilweise | Actions: jQuery-frei. Manager: noch jQuery |
| Phase 7: Dialog-Modernisierung | ❌ Offen | V1 Dialog funktioniert weiterhin |
| Phase 8: Form-Submission | ✅ Erledigt | Via Basis-Klasse |
| Phase 9: Template-Struktur | ❌ Offen | Monolith beibehalten (wie empfohlen) |
| Phase 10: Utilities | ⚠️ Teilweise | DragDrop ✅, Manager noch jQuery |
| Phase 11: Testing | ❌ Offen | Manuelles Testen in Foundry erforderlich |
