# Migration zu ApplicationV2 - Findings

**Status:** V12 → V13 AppV2 Migration  
**Datum:** 2026-02-08  
**Zielversion:** Foundry VTT v13+

---

## 📋 Executive Summary

Die aktuellen Context Files (`actor.js`, `helden.js`, `kreatur.js`) basieren auf der **alten ActorSheet (Application V1) API** und müssen auf **ApplicationV2** migriert werden. Dies ist eine umfangreiche Änderung, die betrifft:

- **Klassenstruktur**: `ActorSheet` → `HandlebarsApplicationMixin(ActorSheetV2)`
- **Lifecycle Methods**: `getData()` → `_prepareContext()`, `activateListeners()` → `_onRender()`
- **Event Handling**: jQuery-basiert → Vanilla DOM + Actions-System
- **Template System**: Monolithisch → PARTS-System (teilweise Rendering)
- **Form Handling**: Manuell → Built-in Form Submission

---

## 🔴 Critical Breaking Changes

### 1. **Klassendeklaration**

#### ❌ ALTES SYSTEM (V1 - Aktuell)

```javascript
export class IlarisActorSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['ilaris', 'sheet', 'actor'],
            // ...
        });
    }
}
```

#### ✅ NEUES SYSTEM (V2 - Target)

```javascript
const { HandlebarsApplicationMixin, ActorSheetV2 } = foundry.applications.api;

export class IlarisActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        // Konfiguration ohne mergeObject!
    };

    static PARTS = {
        header: { template: 'path/to/header.hbs' },
        tabs: { template: 'path/to/tabs.hbs' },
        body: { template: 'path/to/body.hbs' },
    };
}
```

**Auswirkungen:**

- Keine `mergeObject()` mehr nötig - ApplicationV2 merged automatisch parent chain
- `defaultOptions()` Getter → `DEFAULT_OPTIONS` Static Property
- Mixin-Basiert statt direkter Vererbung

---

### 2. **DEFAULT_OPTIONS Struktur**

#### ❌ ALT (wird ignoriert)

```javascript
static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
        id: "ilaris-actor-sheet",
        title: "Actor Sheet",
        template: "systems/Ilaris/templates/sheets/helden.hbs",
        classes: ['ilaris', 'sheet', 'actor'],
        width: 850,
        height: 750,
        tabs: [{
            navSelector: '.sheet-tabs',
            contentSelector: '.sheet-body',
            initial: 'kampf'
        }],
        scrollY: ['.herotab']
    })
}
```

#### ✅ NEU (ApplicationV2 Format)

```javascript
static DEFAULT_OPTIONS = {
    // Window Konfiguration
    window: {
        icon: "fas fa-scroll",  // NEU: Optional
        title: "ILARIS.sheet.title",  // Localization key
        contentClasses: ["standard-form"]
    },

    // Position/Größe
    position: {
        width: 850,
        height: 750
    },

    // Tag für root element
    tag: "form",  // wichtig für FormHandling

    // Form Handling (NEU!)
    form: {
        handler: IlarisActorSheet.#onSubmitForm,
        submitOnChange: false,
        closeOnSubmit: false
    },

    // Actions (Ersatz für activateListeners)
    actions: {
        ausklappen: IlarisActorSheet.ausklappView,
        rollable: IlarisActorSheet.onRollable,
        toggleBool: IlarisActorSheet.onToggleBool,
        // ... weitere actions
    },

    // Header Buttons (NEU! Dropdown statt inline)
    window: {
        controls: [
            {
                icon: "fa-solid fa-sync-alt",
                label: "ILARIS.syncItems",
                action: "syncItems"
            }
        ]
    }
}
```

**Kritische Unterschiede:**

- `scrollY` wird **nicht mehr unterstützt** - CSS muss gepflegt werden
- Tabs werden anders handled (siehe Tab-Sektion)
- `form.handler` ersetzt `_updateObject()`

---

### 3. **getData() → \_prepareContext()**

#### ❌ ALT

```javascript
async getData() {
    const context = super.getData()
    context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.notes, {
        async: true,
    })
    return context
}
```

#### ✅ NEU

```javascript
async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Alle Daten hier aufbereiten
    context.enrichedBiography = await TextEditor.enrichHTML(
        this.actor.system.notes,
        { async: true }
    )

    // Context wird an ALLE Parts übergeben
    return context
}
```

**Unterschiede:**

- Parameter: `options` statt keine
- Ist **asynchron** (muss `await` sein)
- Aufgerufene Daten sind für **alle PARTS** zugänglich
- Keine `super.getData()` mehr - use `await super._prepareContext(options)` if needed

---

### 4. **activateListeners() → \_onRender()**

#### ❌ ALT (jQuery-basiert)

```javascript
activateListeners(html) {
    super.activateListeners(html)
    html.find('.ausklappen-trigger').click((ev) => this._ausklappView(ev))
    html.find('.rollable').click((ev) => this._onRollable(ev))
    html.find('.clickable').click((ev) => this._onClickable(ev))
    html.find('.item-create').click((ev) => this._onItemCreate(ev))

    // Input listener für live updates
    html.find('input[name="system.gesundheit.wunden"]').on('input', (ev) =>
        this._onHealthValueChange(ev)
    )
}
```

#### ✅ NEU (Vanilla DOM + Actions)

```javascript
_onRender(context, options) {
    super._onRender(context, options)

    // Click-Events via Actions (im DEFAULT_OPTIONS)
    // Kein Code hier nötig!

    // Nur spezielle Events (non-click):
    const woundsInput = this.element.querySelector('input[name="system.gesundheit.wunden"]')
    if (woundsInput) {
        woundsInput.addEventListener('input', (ev) => this._onHealthValueChange(ev))
    }
}

// Actions sind static methods:
static ausklappView(event, target) {
    const targetkey = target.dataset.ausklappentarget
    const targetId = `ausklappen-view-${targetkey}`
    const toggleView = this.element.querySelector(`#${targetId}`)
    if (toggleView.style.display === 'none') {
        toggleView.style.display = 'table-row'
    } else {
        toggleView.style.display = 'none'
    }
}
```

**Kritische Unterschiede:**

- **KEINE jQuery mehr** - nur Vanilla DOM
- jQuery ist noch verfügbar via `const html = $(this.element)` bei Bedarf
- Click-Events sollten über **Actions** im DEFAULT_OPTIONS definiert werden
- Komplexe Event-Listener in `_onRender()` aufbauen
- `this` in \_onRender verweist auf die Application-Instanz

---

### 5. **Tab System**

#### ❌ ALT (verwaltet via Selector)

```javascript
static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
        tabs: [{
            navSelector: '.sheet-tabs',
            contentSelector: '.sheet-body',
            initial: 'kampf'
        }]
    })
}

// HTML:
<div class="sheet-tabs tabs" data-group="primary">
    <a class="tab-item" data-tab="kampf">Kampf</a>
    <a class="tab-item" data-tab="inventar">Inventar</a>
</div>
<div class="sheet-body">
    <div class="tab" data-group="primary" data-tab="kampf">...</div>
    <div class="tab" data-group="primary" data-tab="inventar">...</div>
</div>
```

#### ✅ NEU (Jeder Tab ist ein PART)

```javascript
static PARTS = {
    header: { template: "systems/Ilaris/templates/sheets/parts/header.hbs" },
    tabs: { template: "systems/Ilaris/templates/sheets/parts/tabs.hbs" },
    kampf: { template: "systems/Ilaris/templates/sheets/parts/kampf.hbs" },
    inventar: { template: "systems/Ilaris/templates/sheets/parts/inventar.hbs" },
    fertigkeiten: { template: "systems/Ilaris/templates/sheets/parts/fertigkeiten.hbs" }
}

// _prepareContext
async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Tab Management
    context.tabs = {
        kampf: { id: "kampf", group: "primary", label: "ILARIS.tabs.kampf", icon: "...", active: true },
        inventar: { id: "inventar", group: "primary", label: "ILARIS.tabs.inventar", active: false },
        // ...
    }

    return context
}

// V13: Bessere Tab-Unterstützung
// https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Tabs-in-AppV2
```

**WICHTIG für V13+:**

- Tab-Navigation wird **gerenderter als PART**
- Kann partiales Rendering nutzen für bessere Performance
- Siehe offizielle V13 Tab-Doku für erweiterte Features

---

### 6. **jQuery Event Delegation**

#### ❌ ALT (überall jQuery)

```javascript
html.find('.ausklappen-trigger').click(ev => this._ausklappView(ev));
html.find('.toggle-bool').click(ev => this._onToggleBool(ev));
html.find('input[name="system.gesundheit.wunden"]').on('input', ev => this._onHealthValueChange(ev));
```

#### ✅ NEU (Actions + vanilla)

```javascript
// In DEFAULT_OPTIONS:
actions: {
    ausklappen: IlarisActorSheet.ausklappView,
    toggleBool: IlarisActorSheet.onToggleBool
}

// In _onRender für komplexe Handler:
_onRender(context, options) {
    this.element.querySelectorAll('input[name="system.gesundheit.wunden"]')
        .forEach(input => {
            input.addEventListener('input', (ev) => this._onHealthValueChange(ev))
        })
}

// Action als static method:
static ausklappView(event, target) {
    // `this` = application instance
    // `event` = PointerEvent
    // `target` = element mit data-action
}
```

**Merkpunkte:**

- `data-action="actionName"` in HTML
- Action-Funktionen sind `static` aber `this` verweist auf Instance
- Nur für Click-Events verwenden
- Andere Events (input, change, etc.) in `_onRender()` mit `addEventListener`

---

### 7. **Form Submission**

#### ❌ ALT

```javascript
async _updateObject(event, formData) {
    // formData ist Object, nicht FormDataExtended
    await this.actor.update(formData)
}
```

#### ✅ NEU

```javascript
static DEFAULT_OPTIONS = {
    form: {
        handler: IlarisActorSheet.#onSubmitForm,
        submitOnChange: false,
        closeOnSubmit: false
    }
}

static async #onSubmitForm(event, form, formData) {
    // formData ist FormDataExtended
    const updateData = foundry.utils.expandObject(formData.object)
    await this.document.update(updateData)
}
```

**Unterschiede:**

- `formData` ist nicht einfach Object, sondern `FormDataExtended`
- Muss mit `formData.object` oder `expandObject()` gehandhabt werden
- Private static methods (#) sind erlaubt für Handler
- `submitOnChange: true` für automatisches Speichern bei Eingabe
- `closeOnSubmit: true` schließt das Fenster nach Submit

---

### 8. **DragDrop System**

#### ❌ ALT (gemanagt in Konstruktor v1)

```javascript
// Wurde automatisch gemanagt durch Application v1
```

#### ✅ NEU (manuell in Konstruktor)

```javascript
constructor(options = {}) {
    super(options)
    this.dragDrop = this.#createDragDropHandlers()
}

#createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
        d.permissions = {
            dragstart: this._canDragStart.bind(this),
            drop: this._canDragDrop.bind(this),
        }
        d.callbacks = {
            dragstart: this._onDragStart.bind(this),
            dragover: this._onDragOver.bind(this),
            drop: this._onDrop.bind(this),
        }
        return new DragDrop(d)
    })
}

_onRender(context, options) {
    this.dragDrop.forEach((d) => d.bind(this.element))
}
```

**Neu:**

- Muss im Konstruktor initialisiert werden
- `dragDrop` bleibt private field `#dragDrop` mit Getter
- Binding in `_onRender()` statt automatisch

---

### 9. **Header Buttons & Toolbar**

#### ❌ ALT (inline HTML)

```javascript
// Im Template:
<div class="window-controls">
    <a class="sync-items">Sync</a>
    <a class="window-button close">X</a>
</div>
```

#### ✅ NEU (Dropdown Menu)

```javascript
static DEFAULT_OPTIONS = {
    window: {
        controls: [
            {
                icon: "fa-solid fa-sync-alt",
                label: "ILARIS.syncItems",
                action: "syncItems",  // muss in actions definiert sein
            },
            {
                icon: "fa-solid fa-times",
                label: "COMMON.Close",
                action: "close",  // built-in action
            }
        ]
    }
}

static actions = {
    syncItems: IlarisActorSheet.syncItems,
    close: IlarisActorSheet.close
}
```

**Änderungen:**

- Buttons sind jetzt im Dropdown-Menu
- Müssen als Actions definiert sein
- Bessere UI auf mobilen Geräten
- Styling ist automatisch

---

### 10. **Templates: Monolith → PARTS**

#### ❌ ALT (eine große .hbs Datei)

```
helden.hbs (alle Tabs + Content in einer Datei)
```

#### ✅ NEU (Aufteilen in PARTS)

```
parts/
  header.hbs      (Name + Schips + Bild)
  tabs.hbs        (Tab Navigation)
  kampf.hbs       (Kampf Tab Content)
  inventar.hbs    (Inventar Tab Content)
  fertigkeiten.hbs
  uebernatuerlich.hbs
  notes.hbs
  effects.hbs
```

**Vorteile:**

- Bessere Lesbarkeit
- Partiales Rendering möglich (nur einzelne PARTS rendern)
- Wiederverwendung von PARTS
- Performance-Optimierung

---

## 🟡 Major Feature Impacts

### Context Property Access

#### ❌ ALT

```javascript
// In Template:
{
    {
        actor.name;
    }
}
{
    {
        actor.system.attribute;
    }
}
```

#### ✅ NEU

```javascript
// In _prepareContext muss alles aufbereitet sein:
async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.actor = this.document  // or this.actor for ActorSheet
    return context
}

// In Template:
{{actor.name}}
{{actor.system.attribute}}
```

**Wichtig:**

- Nichts ist automatisch in Context!
- Muss explizit in `_prepareContext()` hinzugefügt werden
- `this.document` vs `this.actor` - im ActorSheetV2 ist es `this.actor`

---

### Scroll Preservation

#### ❌ ALT (Foundry-verwaltet)

```javascript
scrollY: ['.herotab']; // Automatisch
```

#### ✅ NEU (CSS-basiert)

```css
.herotab {
    overflow-y: auto;
    max-height: 600px;
    /* Scroll wird automatisch vom Browser bewahrt */
}
```

---

### Enriched Text

#### ✅ Bleibt ähnlich, aber im Context

```javascript
async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.enrichedBiography = await TextEditor.enrichHTML(
        this.actor.system.notes,
        { async: true }
    )
    return context
}

// Template:
{{{enrichedBiography}}}  // Triple braces für HTML!
```

---

## 📦 File Structure für Migration

### Aktuell:

```
scripts/sheets/
  actor.js      (Base Sheet - 952 Zeilen)
  helden.js     (Hero Sheet - 87 Zeilen)
  kreatur.js    (Creature Sheet - 112 Zeilen)

templates/sheets/
  helden.hbs
  kreatur.hbs
```

### Nach Migration:

```
scripts/sheets/
  actor.js      (Base - AppV2-Mixin)
  helden.js     (Hero Sheet)
  kreatur.js    (Creature Sheet)

templates/sheets/
  helden/
    header.hbs
    tabs.hbs
    parts/
      kampf.hbs
      inventar.hbs
      fertigkeiten.hbs
      uebernatuerlich.hbs
      notes.hbs
      effects.hbs

  kreatur/
    header.hbs
    tabs.hbs
    parts/
      hauptinfo.hbs
      attribute.hbs
      angriffe.hbs
      // ...
```

---

## ⚠️ Migration Komplexität

### Einfach (1-2 Stunden):

- ✅ Class Declaration ändern
- ✅ DEFAULT_OPTIONS anpassen
- ✅ getData() → \_prepareContext() renamen

### Mittel (4-6 Stunden):

- ✅ activateListeners() → \_onRender() + Actions
- ✅ jQuery entfernen
- ✅ Event Listeners umbauen
- ✅ Form Submission anpassen

### Komplex (8-12 Stunden):

- ✅ Templates in PARTS aufteilen
- ✅ Tab System neu strukturieren
- ✅ Dialog/Prompt-Handling (Z.B. in kreatur.js)
- ✅ DragDrop neu implementieren (falls vorhanden)
- ✅ Testen aller Funktionalitäten

### Speziell für dieses Projekt:

- ⚠️ Viele Dialog/Prompt-Aufrufe (kreatur.js)
- ⚠️ Komplexe Event Listener Verkettung
- ⚠️ DragDrop für Items
- ⚠️ Custom Dialogs (`AngriffDialog`, `FernkampfDialog`, etc.)

---

## 🔧 Compatibility Matrix

| Feature             | V1 (Aktuell)   | V2 (Target)           | Status                    |
| ------------------- | -------------- | --------------------- | ------------------------- |
| FormApplication     | ✅             | ⚠️ Andere API         | Manuelles Handling        |
| jQuery              | ✅ Auto        | ⚠️ Manual             | Mit `const html = $(...)` |
| getData()           | ✅             | ❌ → \_prepareContext | **Breaking**              |
| activateListeners() | ✅             | ❌ → \_onRender()     | **Breaking**              |
| defaultOptions      | ✅ Getter      | ❌ → DEFAULT_OPTIONS  | **Breaking**              |
| Tabs                | ✅ navSelector | ⚠️ PARTS + Manual     | **Breaking**              |
| DragDrop            | ✅ Auto        | ⚠️ Manual             | Manuell neu               |
| Scrolling           | ✅ scrollY     | ⚠️ CSS                | **Deprecated**            |
| scrollY             | ✅             | ❌                    | **Nicht mehr**            |

---

## 📚 Offizielle Ressourcen

1. **API Dokumentation**: https://foundryvtt.com/api/v13/
2. **Migration Guide**: https://foundryvtt.wiki/en/development/guides/converting-to-appv2
3. **ApplicationV2 Wiki**: https://foundryvtt.wiki/en/development/api/applicationv2
4. **V13 Tabs Guide**: https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Tabs-in-AppV2

---

## ✅ Next Steps

1. **Analyse Complete** ✓ (dieses Dokument)
2. **Requirements** → Siehe MIGRATION_REQUIREMENTS.md
3. **Base Klasse Migration** → IlarisActorSheet zuerst
4. **Subclasses** → HeldenSheet, KreaturSheet
5. **Template Aufbau** → Aufteilen in PARTS
6. **Testing** → Alle Funktionalitäten validieren

---

## 🎯 Critical Success Factors

1. **Keine jQuery** in neu geschriebenem Code
2. **Alle Context-Daten** in `_prepareContext()` vorbereiten
3. **PARTS korrekt strukturieren** für Performance
4. **Actions für alle Click-Events** nutzen
5. **Tests schreiben** für Migration
6. **Schrittweise migrieren** - nicht alles auf einmal
