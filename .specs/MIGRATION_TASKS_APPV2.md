# Migration Tasks: ApplicationV2 für Alternative Sheets

**Status:** Task-Definition für AppV2-Migration  
**Datum:** 2026-02-20  
**Zielversion:** Foundry VTT v13+  
**Dateien:** 
- `scripts/sheets/alternative-actor-sheet.js`
- `scripts/sheets/alternative-creature-sheet.js`

---

## 📋 MIGRATION TASKS: ApplicationV2 für Alternative Sheets

### **PHASE 1: Code-Deduplication & Cleanup**

#### Task 1.1: `alternative-actor-sheet.js` - Methoden-Deduplication
**Beschreibung:**
- Entfernen Sie diese Methoden aus `IlarisAlternativeActorSheet`, da sie bereits in der Base-Klasse `HeldenSheet` vorhanden sind:
  - `_onSchipIncrease()` 
  - `_onSchipDecrease()`
  - `_onAccordionToggle()` (evtl. in `FavoritesManager` auslagern)
  - Alle `activateListeners()` Standard-Funktionen, die nicht spezifisch für die Alternative Sheet sind
- **Prüfe:** Welche Event-Handler sind bereits in `HeldenSheet.actions` mit `schipsClick` definiert?
- **Aktion:** Entfernen Sie duplizierte Logik und nutzen Sie die geerbten Actions

#### Task 1.2: `alternative-creature-sheet.js` - Methoden-Deduplication  
**Beschreibung:**
- Entfernen Sie diese Methoden, da sie bereits in `KreaturSheet` vorhanden sind:
  - `_canDragStart()`, `_canDragDrop()`, `_onDragStart()`, `_onDragOver()`, `_onDrop()` (alles bereits im Basis-Sheet)
  - `_onDropItemCreate()` - bereits in KreaturSheet implementiert
- **Aktion:** Nutzen Sie die geerbten DragDrop-Handler

---

### **PHASE 2: Klassen-Deklaration zu ApplicationV2**

#### Task 2.1: `alternative-actor-sheet.js` - defaultOptions → DEFAULT_OPTIONS
**Beschreibung:**
- Konvertieren Sie `static get defaultOptions()` zu `static DEFAULT_OPTIONS = {...}`
- Migrieren Sie die Struktur gemäß Research Document:
  - `classes` → `window: { ... }` und class-basierte Config
  - `tabs` → wird durch PARTS und TABS in Base-Klasse gehändelt
  - `scrollY` → entfernen (wird durch CSS `overflow-y` ersetzt)
  - `width/height` → `position: { width, height }`
- **Format-Vorlage:**
```javascript
static DEFAULT_OPTIONS = {
    window: { /* icon, title, controls */ },
    position: { width: 820, height: 900 },
    form: { handler: IlarisAlternativeActorSheet.#onSubmitForm, ... },
    actions: { /* alle Aktionen */ }
}
```

#### Task 2.2: `alternative-creature-sheet.js` - defaultOptions → DEFAULT_OPTIONS
**Beschreibung:**
- Gleicher Prozess wie Task 2.1
- Beachten Sie: Creature Sheet hat kein Tab-System, nutzt nur eine Form

---

### **PHASE 3: Lifecycle-Methoden-Migration**

#### Task 3.1: `alternative-actor-sheet.js` - getData() → _prepareContext()
**Beschreibung:**
- Ersetzen Sie `async getData()` mit `async _prepareContext(options)`
- **Wichtig:** 
  - Parameter: `options` statt keine
  - Call: `await super._prepareContext(options)` statt `super.getData()`
  - Alle Daten werden für **alle PARTS** zugänglich gemacht
  - Accordion-States müssen in Context vorbereitet werden
- **Aktion:** Aufbereiten aller Context-Daten die Template braucht

#### Task 3.2: `alternative-creature-sheet.js` - getData() → _prepareContext()
**Beschreibung:**
- Gleiches wie 3.1
- Prüfen Sie: welche zusätzlichen Daten braucht die alternative Creature-View?

---

### **PHASE 4: Event-Handler Migration**

#### Task 4.1: `alternative-actor-sheet.js` - activateListeners() → _onRender() + Actions
**Beschreibung:**
- Ersetzen Sie `activateListeners(html)` mit `_onRender(context, options)`
- **Migrieren Sie jQuery-Events zu Actions:**
  - `.click('.ausklappen-trigger')` → `data-action="ausklappen"` im HTML
  - `.click('.rollable')` → `data-action="rollable"` im HTML
  - `.click('.energy-settings')` → `data-action="energySettings"` im HTML
- **Struktur:**
```javascript
static DEFAULT_OPTIONS = {
    actions: {
        ausklappen: IlarisAlternativeActorSheet.ausklappView,
        energySettings: IlarisAlternativeActorSheet.onEnergySettings,
        rollable: IlarisAlternativeActorSheet.onRollable,
        // weitere Actions
    }
}

// Static Action Methods:
static ausklappView(event, target) { /* this = application instance */ }
static async onEnergySettings(event, target) { /* this = application instance */ }
```
- **Nur komplexe Events in _onRender():**
  - `input`, `change`, `customEvent` (nicht Click)
  - Nur wenn nicht einfach per Action gelöst

#### Task 4.2: `alternative-creature-sheet.js` - activateListeners() → _onRender() + Actions
**Beschreibung:**
- Gleiches wie 4.1
- Spezifische Actions für Creature-Sheet:
  - `energySettings` → `onEnergySettings`
  - `healthSettings` → `onHealthSettings`
  - `editStat` → `onEditStat`
  - `hexagonEdit` → `onHexagonEdit`
  - `effectStackIncrease` / `effectStackDecrease`
  - `effectAdvanceTime`

---

### **PHASE 5: Methoden zu Static Actions konvertieren**

#### Task 5.1: `alternative-actor-sheet.js` - Methoden → Static Actions
**Beschreibung:**
- Diese Instanz-Methoden zu statischen Action-Methoden konvertieren:
  - `_onEnergySettings()` → `static async onEnergySettings(event, target)`
  - `_onHealthSettings()` → `static async onHealthSettings(event, target)`
  - `_onOpenEffectLibrary()` → `static async onOpenEffectLibrary(event, target)`
  - `_onEditStat()` → `static async onEditStat(event, target)`
  - `_onHexagonEdit()` → `static async onHexagonEdit(event, target)`
  - `_onEffectStackIncrease()` → `static async onEffectStackIncrease(event, target)`
  - `_onEffectStackDecrease()` → `static async onEffectStackDecrease(event, target)`
  - `_onEffectAdvanceTime()` → `static async onEffectAdvanceTime(event, target)`
  - `_onRest()` → `static async onRest(event, target)`
  - `_onCopyUUID()` → `static async onCopyUUID(event, target)`
- **Format:** `static action(event, target)` wobei `this = application instance`
- **Wichtig:** `this` im Action-Kontext ist die Application-Instanz, nicht die Methode

#### Task 5.2: `alternative-creature-sheet.js` - Methoden → Static Actions
**Beschreibung:**
- Gleicher Prozess wie 5.1
- Konvertieren Sie:
  - `_onEnergySettings()`
  - `_onHealthSettings()`
  - `_onOpenEffectLibrary()`
  - `_onEditStat()`
  - `_onHexagonEdit()`
  - `_onEffectStackIncrease()`
  - `_onEffectStackDecrease()`
  - `_onEffectAdvanceTime()`
  - `_onCopyUUID()`

---

### **PHASE 6: jQuery-Entfernung & Vanilla DOM**

#### Task 6.1: `alternative-actor-sheet.js` - jQuery → Vanilla DOM
**Beschreibung:**
- Entfernen Sie alle jQuery-Selektoren außer wo absolut nötig
- **Nicht mehr erlaubt in neuen Actions:**
  - `html.find()` → `this.element.querySelector()`
  - `$(element).data()` → `element.dataset`
  - `$(element).val()` → `element.value`
  - `$(element).addClass()` → `element.classList.add()`
  - `html.on()` → `addEventListener()` in `_onRender()`
- **Erlaubt:** 
  - Dialog/Prompt HTML-Building im Action-Code (keine DOM-Manipulation)
  - TextEditor API calls

#### Task 6.2: `alternative-creature-sheet.js` - jQuery → Vanilla DOM
**Beschreibung:**
- Gleiches wie 6.1

---

### **PHASE 7: Dialog-System Modernisierung**

#### Task 7.1: `alternative-actor-sheet.js` - Dialoge zu FormApplicationV2 oder Dialog.prompt()
**Beschreibung:**
- Prüfen Sie diese Dialog-Aufrufe:
  - `_onEnergySettings()` → neuer Dialog mit Form
  - `_onHealthSettings()` → neuer Dialog mit Form
  - `_onEditStat()` → Dialog mit Input
  - `_onHexagonEdit()` → Dialog mit Input
  - `_onRest()` → komplexerer Dialog
- **Aktion:** 
  - Nutzen Sie `Dialog.prompt()` für einfache Inputs
  - Nutzen Sie `new Dialog()` für komplexe Forms
  - Nutzen Sie `FormDataExtended` für Form-Submission, falls nötig

#### Task 7.2: `alternative-creature-sheet.js` - Dialoge zu Dialog V2 API
**Beschreibung:**
- Modernisieren Sie Dialog-Aufrufe
- Gleiches wie 7.1

---

### **PHASE 8: Form-Submission Migration**

#### Task 8.1: `alternative-actor-sheet.js` - _updateObject() → form.handler
**Beschreibung:**
- Ersetzen Sie `async _updateObject(event, formData)` mit einer **privaten statischen Methode** im DEFAULT_OPTIONS
- **Vorlage:**
```javascript
static DEFAULT_OPTIONS = {
    form: {
        handler: IlarisAlternativeActorSheet.#onSubmitForm,
        submitOnChange: false,
        closeOnSubmit: false
    }
}

static async #onSubmitForm(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object)
    await this.document.update(updateData)
}
```

#### Task 8.2: `alternative-creature-sheet.js` - Form-Submission
**Beschreibung:**
- Prüfen Sie: braucht Creature-Sheet Form-Submission?
- Wenn ja: gleicher Prozess wie 8.1
- Wenn nein: entfernen

---

### **PHASE 9: Template-Struktur Anpassung**

#### Task 9.1: `alternative-actor-sheet.hbs` - PARTS-Struktur (Optional)
**Beschreibung:**
- **Zukünftige Optimierung** (nicht zwingend für V2-Migration erforderlich):
  - Könnte in PARTS aufgeteilt werden (header.hbs, tabs.hbs, kampf.hbs, etc.)
  - Würde bessere Performance für Partial-Rendering ermöglichen
  - **Für diese Migration:** Behalten Sie die monolithe Struktur, aber passen Sie Context-Zugriff an
- **Aktion:** Stelle sicher, dass alle Context-Variablen in `_prepareContext()` existieren

#### Task 9.2: `alternative-creature-sheet.hbs` - Context-Anpassung
**Beschreibung:**
- Prüfen Sie Context-Zugriff in der Creature-Template
- Alle erforderlichen Daten in `_prepareContext()` vorbereiten

---

### **PHASE 10: Helper-Methoden & Utilities**

#### Task 10.1: DragDrop in `alternative-actor-sheet.js`
**Beschreibung:**
- **Prüfen Sie:** benötigt alternative-actor-sheet DragDrop?
- Aktuell: jQuery-basiert in `_onDragStart()` und `_onDrop()`
- **Falls nötig:** Migrieren Sie zu Vanilla DOM wie in KreaturSheet

#### Task 10.2: AccordionManager & FavoritesManager Integration
**Beschreibung:**
- Prüfen Sie: Werden diese Manager noch benötigt für V2?
- Falls ja: Stellen Sie sicher, dass sie nicht auf jQuery-Selektoren verlassen
- Falls nein: Erwägen Sie Entfernung
- **Aktion:** Integrieren Sie mit `_onRender()` statt `activateListeners()`

#### Task 10.3: Utility-Funktionen
**Beschreibung:**
- Prüfen Sie diese Utility-Funktionen in den Sheets:
  - `_getAccordionStorageKey()`
  - `_saveAccordionState()`
  - `_removeAccordionState()`
  - `_clearAccordionStates()`
  - `_onDragStart()`, `_onDrop()`
- **Aktion:** Refaktorieren Sie für V2 oder entfernen Sie, falls obsolet

---

### **PHASE 11: Testing & Validierung**

#### Task 11.1: Funktionalitäts-Tests
**Beschreibung:**
- Testen Sie nach Migration:
  - Alle Schips-Buttons funktionieren (`schipsClick` aus HeldenSheet)
  - Alle Tri-State-Health-Buttons funktionieren (`triStateClick`)
  - Energy-Settings-Dialog öffnet und speichert
  - Health-Settings-Dialog öffnet und speichert
  - Hexagon-Edit für Attribute funktioniert
  - Effect Stack Increase/Decrease funktioniert
  - Effect Advance Time funktioniert
  - Rest-Dialog funktioniert
  - UUID Copy funktioniert
  - DragDrop funktioniert (falls implementiert)
  - Accordion-Manager funktioniert (falls benutzt)

#### Task 11.2: Browser-Konsolen-Check
**Beschreibung:**
- Keine jQuery-Fehler
- Keine undefinierten `this`-Kontexte
- Keine 404-Template-Fehler
- Keine Form-Submission-Fehler

---

## 📊 Zusammenfassung der Änderungen

| Komponente | Alt (V1) | Neu (V2) | Task |
|---|---|---|---|
| Klassen-Deklaration | `get defaultOptions()` | `DEFAULT_OPTIONS = {}` | 2.1, 2.2 |
| getData | `async getData()` | `async _prepareContext(options)` | 3.1, 3.2 |
| Event-Handler | `activateListeners(html)` | `_onRender(context, options)` + Actions | 4.1, 4.2 |
| Click-Events | jQuery `.click()` | `data-action` + Static Methods | 5.1, 5.2, 6.1, 6.2 |
| Form-Submit | `_updateObject()` | `form: { handler: #onSubmitForm }` | 8.1, 8.2 |
| jQuery Selektoren | `html.find()` | `this.element.querySelector()` | 6.1, 6.2 |
| DragDrop | Automatisch | Manuell in Konstruktor + `_onRender()` | 10.1 |

---

## ✅ Erfolgskriterien

- [ ] Keine jQuery-Selektoren in neuen Action-Methoden
- [ ] `DEFAULT_OPTIONS` statt `defaultOptions`
- [ ] `_prepareContext()` statt `getData()`
- [ ] `_onRender()` statt `activateListeners()`
- [ ] Alle Actions sind statisch und nutzen `this` korrekt
- [ ] Keine Kompilierungsfehler in Browser-Konsole
- [ ] Alle bisherigen Funktionen arbeiten korrekt
- [ ] Code-Duplikation mit Base-Klassen beseitigt

---

## 📚 Referenzen

- [MIGRATION_FINDINGS_APPV2.md](.MIGRATION_FINDINGS_APPV2.md) - Detaillierte Analyse der Breaking Changes
- [Foundry VTT V13 API Documentation](https://foundryvtt.com/api/v13/)
- [ApplicationV2 Migration Guide](https://foundryvtt.wiki/en/development/guides/converting-to-appv2)
